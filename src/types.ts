export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'completed';

export interface Category {
  id: string;
  _id?: string;
  name: string;
}

export interface MenuItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  _id?: string;
  customerName: string;
  items: CartItem[];
  total: number;
  promoCode?: string;
  discount: number;
  finalTotal: number;
  status: OrderStatus;
  queueNumber: number;
  createdAt: any;
  userId?: string;
  paymentMethod: string;
}

export interface PromoCode {
  id: string;
  _id?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minPurchase: number;
  isActive: boolean;
  expiresAt?: any;
}

export interface QueueSetting {
  currentNumber: number;
  lastResetDate: string; // YYYY-MM-DD
}
