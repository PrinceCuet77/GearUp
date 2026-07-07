export interface ICreateRentalItem {
  gearItemId: string;
  quantity: number;
}

export interface ICreateRentalPayload {
  startDate: string;
  endDate: string;
  items: ICreateRentalItem[];
}

export interface IGetCustomerRentalsQuery {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
}
