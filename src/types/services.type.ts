export type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration: number;
  createdAt?: Date;
  barberShopId: string;
};