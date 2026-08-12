import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { authV1Service } from './authV1.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import passport from 'passport';
import { createAuthTokens } from '../../utils/createAuthToken';
import {
  accessTokenCookieOptions,
  clearAuthCookies,
  setAuthCookies,
} from '../../utils/authCookies';
import {
  createOAuthState,
  defaultLandingPath,
  isSafeRedirectPath,
  parseOAuthState,
  resolveFrontendRedirect,
  SelectableRole,
} from '../../utils/oauthState';
import { isAllowedOrigin } from '../../config/cors';
import { BadRequestError } from '../../errors/ApiError';

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authV1Service.registerUserIntoDB(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'User registered successfully',
      data: { user },
    });
  },
);

const credentialLoginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      try {
        if (err) {
          return next(err);
        }
        if (!user) {
          return next(new Error(info?.message || 'Invalid credentials!'));
        }

        const { accessToken, refreshToken } = createAuthTokens({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        setAuthCookies(res, { accessToken, refreshToken });

        sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: 'User logged in successfully',
          data: { user, accessToken, refreshToken },
        });
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken } = await authV1Service.refreshToken(
      req.cookies.refreshToken,
    );

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Token Refreshed Successfully',
      data: {
        accessToken,
      },
    });
  },
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    clearAuthCookies(res);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User logged out successfully',
      data: null,
    });
  },
);

/**
 * Starts the Google flow. The role tile the user clicked, the frontend path to
 * return to, and the frontend origin the click happened on are packed into a
 * signed `state` param — Google hands it back to the callback untouched, and it
 * is the only channel available (the callback is a fresh top-level navigation
 * from Google, so nothing from this request's session or cookies is guaranteed
 * to survive it).
 */
const startGoogleAuth = (role?: SelectableRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedRedirect = req.query.redirect;

    if (requestedRedirect !== undefined && !isSafeRedirectPath(requestedRedirect)) {
      throw new BadRequestError(
        'redirect must be a relative path starting with "/"',
      );
    }

    const { state } = createOAuthState({
      role,
      redirect: requestedRedirect,
      origin: resolveRequestOrigin(req),
    });

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state,
    })(req, res, next);
  };
};

/**
 * Where the browser came from, if we trust it. `Origin` is sent on POSTs;
 * top-level GET navigations (which is what this is) carry `Referer` instead —
 * and Chrome's default referrer policy trims it to the bare origin, which is
 * exactly what's needed here. Anything not on the CORS allowlist is discarded
 * so `resolveFrontendRedirect` falls back to `APP_URL`.
 */
const resolveRequestOrigin = (req: Request) => {
  const candidates = [req.headers.origin, req.headers.referer];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const origin = new URL(candidate).origin;
      if (isAllowedOrigin(origin)) return origin;
    } catch {
      // Malformed header — ignore it.
    }
  }

  return undefined;
};

const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  const state = parseOAuthState(
    typeof req.query.state === 'string' ? req.query.state : undefined,
  );

  const frontendUrl = (args: {
    query?: Record<string, string | undefined>;
    fragment?: Record<string, string | undefined>;
    fallbackPath?: string;
  }) =>
    resolveFrontendRedirect({
      origin: state?.origin,
      redirect: state?.redirect,
      fallbackPath: args.fallbackPath ?? '/login',
      query: args.query,
      fragment: args.fragment,
    });

  // A callback without valid, unexpired state was not started by this browser
  // through our own endpoint (login CSRF, a replayed link, or an abandoned
  // consent screen), so the code is never exchanged.
  if (!state) {
    console.error('Google OAuth callback rejected: invalid or expired state');
    return res.redirect(frontendUrl({ query: { error: 'invalid_oauth_state' } }));
  }

  passport.authenticate(
    'google',
    { session: false },
    async (err: any, user: any, info: any) => {
      try {
        if (err || !user) {
          // `info.message` comes from our own strategy and is safe to show;
          // anything from the Google exchange collapses to a stable code rather
          // than leaking gateway wording into the UI.
          const reason = info?.message || 'google_authentication_failed';

          // Redirecting beats rendering the global handler's JSON error: the
          // browser is mid-navigation and the user would otherwise land on a
          // raw error payload with no way back into the app.
          console.error(
            'Google OAuth callback failed:',
            err?.message || reason,
          );
          return res.redirect(frontendUrl({ query: { error: reason } }));
        }

        const { accessToken, refreshToken } = createAuthTokens({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        // Cookies are first choice, but they are third-party from the
        // frontend's point of view whenever the two are on different hostnames
        // (Safari/Firefox and Chrome-incognito drop them outright), so the
        // tokens also ride back in the URL fragment for the frontend to adopt
        // as a first-party session. Frontends that rely on the cookies can
        // simply ignore the fragment.
        setAuthCookies(res, { accessToken, refreshToken });

        return res.redirect(
          frontendUrl({
            fallbackPath: defaultLandingPath(user.role),
            query: {
              role: user.role,
              isNewUser: String(Boolean(user.isNewUser)),
            },
            fragment: { accessToken, refreshToken },
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  )(req, res, next);
};

export const authV1Controllers = {
  registerUser,
  credentialLoginUser,
  refreshToken,
  logout,
  startGoogleAuth,
  googleCallback,
};
