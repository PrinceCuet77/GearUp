import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import config from './config';
import { notFound } from './middleware/notFound';
import { globalErrorHandler } from './middleware/globalErrorHandler';
import { authRoutes } from './modules/auth/auth.routes';

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
  res.send('Gear up application');
});

app.use('/api/auth', authRoutes);

app.use(notFound);

app.use(globalErrorHandler);

export default app;
