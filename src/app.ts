import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import config from './config';
import { notFound } from './middleware/notFound';
import { globalErrorHandler } from './middleware/globalErrorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { providerRoutes } from './modules/provider/provider.routes';
import { gearRoutes } from './modules/gears/gear.routes';
import { categoryRoutes } from './modules/categories/category.routes';
import { rentalRoutes } from './modules/rentals/rental.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { reviewRoutes } from './modules/reviews/review.route';

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.send('Gear up application is running...');
});

app.use('/api/auth', authRoutes);
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
