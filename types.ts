
export enum OrderStatus {
  PENDING = 'pendiente',
  CONFIRMED = 'confirmado',
  DELIVERED = 'entregado',
  CANCELLED = 'cancelado'
}

export interface Sauce {
  id: string;
  name: string;
  active: boolean;
}

export interface OrderSauce {
  sauceId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  peopleCount: number;
  totalPrice: number;
  orderDate: string;
  orderTime: string;
  status: OrderStatus;
  paymentProofUrl: string;
  sauces: OrderSauce[];
  created_at: string;
}

export interface Settings {
  pricePerPerson: number;
  paymentAlias: string;
  paymentCbu?: string;
  adminPassword?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin';
}
