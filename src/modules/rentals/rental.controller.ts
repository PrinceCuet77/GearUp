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

const getCustomerRentals = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const result = await rentalService.getCustomerRentals(
    customerId,
    req.query as IGetCustomerRentalsQuery,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Rental orders retrieved successfully',
    data: result.rentals,
    meta: result.meta,
  });
});

const getRentalById = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const rentalId = req.params.rentalId as string;
  const rental = await rentalService.getRentalById(rentalId, customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Rental order retrieved successfully',
    data: rental,
  });
});

export const rentalController = {
  createRental,
  getCustomerRentals,
  getRentalById,
};
