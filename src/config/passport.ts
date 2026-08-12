import passport from 'passport';
import { Request } from 'express';
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
import bcrypt from 'bcryptjs';
import { ForbiddenError } from '../errors/ApiError';
import { parseOAuthState } from '../utils/oauthState';

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
            message: 'User not found with this email, Please register first!',
          });
        }

        if (user.status === UserStatus.SUSPENDED) {
          throw new ForbiddenError(
            'Your account has been suspended. Please contact support.',
          );
        }

        if (!user.password) {
          return done(null, false, {
            message:
              'This account does not have password, Please login with google',
          });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
          return done(null, false, {
            message: 'Password does not matched',
          });
        }

        return done(null, { ...user, userId: user.id });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id,
      clientSecret: config.google_client_secret,
      callbackURL: config.google_redirect_uri,
      // The role the user picked rides through Google in the signed `state`
      // param, which is only reachable from the request.
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

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
          include: {
            auths: true,
          },
        });

        if (user) {
          if (user.status === UserStatus.SUSPENDED) {
            return done(null, false, {
              message:
                'Your account has been suspended. Please contact support.',
            });
          }

          const googleAuth = user.auths.find(
            (auth) => auth.provider === AuthProvider.GOOGLE,
          );

          // First Google sign-in on a credentials account links the two rather
          // than creating a second user for the same email.
          if (!googleAuth) {
            await prisma.auth.create({
              data: {
                provider: AuthProvider.GOOGLE,
                providerId: profile.id,
                userId: user.id,
              },
            });
          }

          return done(null, { ...user, userId: user.id, isNewUser: false });
        }

        // Signup: only CUSTOMER/PROVIDER can come from state (parseOAuthState
        // drops anything else), so ADMIN can never be self-assigned here.
        const requestedRole = parseOAuthState(
          typeof req.query.state === 'string' ? req.query.state : undefined,
        )?.role;

        const createdUser = await prisma.user.create({
          data: {
            name: profile.displayName,
            email: email,
            role: requestedRole ?? UserRole.CUSTOMER,
            avatarUrl: profile.photos?.[0]?.value || null,
            auths: {
              create: {
                provider: AuthProvider.GOOGLE,
                providerId: profile.id,
              },
            },
          },
          include: {
            auths: true,
          },
        });

        return done(null, {
          ...createdUser,
          userId: createdUser.id,
          isNewUser: true,
        });
      } catch (error) {
        // Without this the rejection escapes passport entirely and takes the
        // serverless function down instead of reaching the error handler.
        return done(error as Error);
      }
    },
  ),
);
