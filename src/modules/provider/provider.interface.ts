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

export interface IGetProviderGearQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}
