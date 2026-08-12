import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import passport from '../../config/passport';
import { authV1Service } from './authV1.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  createOAuthState,
  parseOAuthState,
  resolveFrontendRedirect,
  SelectableRole,
} from '../../utils/oauthState';
import type { AuthUser } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';

const OAUTH_STATE_COOKIE = 'oauthState';

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

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, accessToken, refreshToken } = await authV1Service.loginUser(
      req.body,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User logged in successfully',
      data: { user, accessToken, refreshToken },
    });
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken } = await authV1Service.refreshToken(
      req.cookies.refreshToken,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });

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
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User logged out successfully',
      data: null,
    });
  },
);

/**
 * Step 1 — the browser lands here from the Customer/Provider tile as a full
 * page navigation (not fetch). The selected role is folded into a signed
 * `state` param so it survives the round trip through Google, and the state's
 * nonce is mirrored into a short-lived cookie for CSRF protection.
 */
const startGoogleAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
  role?: SelectableRole,
) => {
  const { redirect } = req.query as { redirect?: string };

  const { state, nonce } = createOAuthState({ role, redirect });

  res.cookie(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: false,
    // Lax, not none: the Google -> API callback is a top-level navigation, so
    // the cookie still comes back, and Lax works without HTTPS in dev.
    sameSite: 'lax',
    maxAge: 1000 * 60 * 10, // 10 minutes
  });

  passport.authenticate('google', {
    session: false,
    state,
    prompt: 'select_account',
  })(req, res, next);
};

// Dedicated entry points — the role is fixed by the route itself, so the
// customer frontend and the provider frontend each hit their own URL instead
// of passing `role` on the query string.
const googleAuthCustomer = (
  req: Request,
  res: Response,
  next: NextFunction,
) => startGoogleAuth(req, res, next, UserRole.CUSTOMER);

const googleAuthProvider = (
  req: Request,
  res: Response,
  next: NextFunction,
) => startGoogleAuth(req, res, next, UserRole.PROVIDER);

/**
 * Step 2 — Google redirects here with `?code=...&state=...`. We verify the
 * state, let the strategy find-or-create the user, then set the same auth
 * cookies as a normal login and bounce back to the frontend.
 */
const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  const state = parseOAuthState(req.query.state as string | undefined);
  const stateNonce = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, { sameSite: 'lax' });

  const failureRedirect = (message: string, redirect?: string) =>
    res.redirect(resolveFrontendRedirect(redirect, { error: message }));

  // Signature invalid, or the nonce doesn't match the cookie we set in step 1
  // — the flow wasn't started by this browser.
  if (!state || !stateNonce || state.nonce !== stateNonce) {
    return failureRedirect('invalid_oauth_state');
  }

  passport.authenticate(
    'google',
    { session: false },
    (
      error: unknown,
      user: AuthUser | false,
      info?: { message?: string; isNewUser?: boolean },
    ) => {
      if (error) return next(error);

      if (!user) {
        return failureRedirect(
          info?.message ?? 'google_authentication_failed',
          state.redirect,
        );
      }

      const { accessToken, refreshToken } =
        authV1Service.createAuthTokens(user);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day
      });

      return res.redirect(
        resolveFrontendRedirect(state.redirect, {
          isNewUser: info?.isNewUser ? 'true' : undefined,
        }),
      );
    },
  )(req, res, next);
};

export const authV1Controller = {
  registerUser,
  loginUser,
  refreshToken,
  logout,
  googleAuthCustomer,
  googleAuthProvider,
  googleCallback,
};
