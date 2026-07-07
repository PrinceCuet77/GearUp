import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { rentalService } from './rental.service';
import { IGetCustomerRentalsQuery } from './rental.interface';

const createRental = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const rental = await rentalService.createRental(customerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Rental order created successfully',
    data: rental,
  });
});

export const rentalController = {
  createRental,
};
