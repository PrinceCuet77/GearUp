import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import config from './config';
import { corsAllowlist, isAllowedOrigin } from './config/cors';
import passport from 'passport';
import { notFound } from './middleware/notFound';
import { globalErrorHandler } from './middleware/globalErrorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { authV1Routes } from './modules/authV1/authV1.routes';
import { userRoutes } from './modules/user/user.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { providerRoutes } from './modules/provider/provider.routes';
import { gearRoutes } from './modules/gears/gear.routes';
import { categoryRoutes } from './modules/categories/category.routes';
import { rentalRoutes } from './modules/rentals/rental.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { reviewRoutes } from './modules/reviews/review.route';
import './config/passport';

const app: Application = express();

// Behind Vercel's proxy: without this, req.protocol/req.secure report the
// internal http hop, so `secure` cookie decisions and redirects go wrong.
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser callers (curl, Google, SSLCommerz) send no Origin header.
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      // Resolving false (rather than passing an Error) omits the
      // Access-Control-Allow-Origin header instead of turning every blocked
      // preflight into a 500 from the global error handler.
      console.warn(
        `CORS: blocked origin ${origin}. Allowed: ${corsAllowlist().join(', ')}`,
      );
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/', (req: Request, res: Response) => {
  res.send('Gear up application is running...');
});

app.get('/api', (req: Request, res: Response) => {
  res.send('Gear up application is running 333333...');
});

// Legacy credentials-only auth, kept as-is.
app.use('/api/auth', authRoutes);
// V1: same endpoints plus Google OAuth (/google, /google/callback).
app.use('/api/v1/auth', authV1Routes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/gears', gearRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(notFound);

app.use(globalErrorHandler);

export default app;
