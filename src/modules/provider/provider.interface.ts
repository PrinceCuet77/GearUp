export interface ICreateGearPayload {
  name: string;
  description: string;
  price: number;
  stock?: number;
  images: string;
  categoryId: string;
}

export interface IUpdateGearPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string;
  categoryId?: string;
  isActive?: boolean;
}
