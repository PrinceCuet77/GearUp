export interface ICreatePaymentPayload {
  rentalOrderId: string;
}

export interface IConfirmPaymentBody {
  val_id: string;
  amount: number;
  currency: string;
}

export interface IGetPaymentHistoryQuery {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'paidAt';
  sortOrder?: 'asc' | 'desc';
}
