export interface ICreateReviewPayload {
  rentalOrderId: string;
  gearItemId: string;
  rating: number;
  comment: string;
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
}
