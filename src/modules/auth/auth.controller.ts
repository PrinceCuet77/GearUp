import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { authService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authService.registerUserIntoDB(req.body);

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
    const { user, accessToken, refreshToken } = await authService.loginUser(
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
    const { accessToken } = await authService.refreshToken(
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

export const authController = {
  registerUser,
  loginUser,
  refreshToken,
  logout,
};
