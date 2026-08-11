import { Request } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';
import config from '.';
import {
  AuthProvider,
  UserRole,
  UserStatus,
} from '../../generated/prisma/enums';
import { parseOAuthState } from '../utils/oauthState';
import type { AuthUser } from '../middleware/auth';
import bcrypt from 'bcryptjs';

/**
 * Strategies resolve to the same shape the rest of the app reads off
 * `req.user`, so controllers never have to care which strategy ran.
 */
const toAuthUser = (user: {
  id: string;
  email: string;
  role: UserRole;
}): AuthUser => ({
  userId: user.id,
  email: user.email,
  role: user.role,
});

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, {
            message: 'User not found',
          });
        }

        if (user.status === UserStatus.SUSPENDED) {
          return done(null, false, {
            message:
              'Your account has been suspended. Please contact support.',
          });
        }

        if (!user.password) {
          return done(null, false, {
            message:
              'You have already loggedin with google, Please login with google',
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, {
            message: 'Invalid password',
          });
        }

        return done(null, toAuthUser(user));
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id as string,
      clientSecret: config.google_client_secret as string,
      callbackURL: config.google_redirect_uri as string,
      scope: ['profile', 'email'],
      // Needed to read the signed `state` param that carries the role the user
      // selected before being redirected to Google.
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: 'No email found from google!',
          });
        }

        // Already verified + role-whitelisted by parseOAuthState.
        const state = parseOAuthState(req.query.state as string | undefined);

        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { auths: true },
        });

        if (existingUser) {
          if (existingUser.status === UserStatus.SUSPENDED) {
            return done(null, false, {
              message:
                'Your account has been suspended. Please contact support.',
            });
          }

          // First Google sign-in for an account that registered with a
          // password: link the provider, don't create a second user.
          const hasGoogleAuth = existingUser.auths.some(
            (auth) => auth.provider === AuthProvider.GOOGLE,
          );

          if (!hasGoogleAuth) {
            await prisma.auth.create({
              data: {
                provider: AuthProvider.GOOGLE,
                providerId: profile.id,
                userId: existingUser.id,
              },
            });
          }

          // The stored role always wins. Clicking the "Provider" tile must not
          // silently upgrade an existing CUSTOMER.
          return done(null, toAuthUser(existingUser));
        }

        const createdUser = await prisma.user.create({
          data: {
            name: profile.displayName,
            email,
            avatarUrl: profile.photos?.[0]?.value,
            role: state?.role ?? UserRole.CUSTOMER,
            auths: {
              create: {
                provider: AuthProvider.GOOGLE,
                providerId: profile.id,
              },
            },
          },
          include: { auths: true },
        });

        return done(null, toAuthUser(createdUser), { isNewUser: true });
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
