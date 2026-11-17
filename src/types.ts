export type HomeFilterTab = 'Explore' | 'Shoes Picks' | 'Best Deals' | 'Fashion';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid';

export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka';

export interface ProductColorVariant {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id: string;
  title: string;
  shortTitle?: string;
  category: string;
  tabGroups: HomeFilterTab[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  soldLabel: string;
  freeShipping: boolean;
  image: string;
  gallery: string[];
  colors: ProductColorVariant[];
  sizes: string[];
  inStock: boolean;
  description: string;
  isSplitFeatureCard?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  countLabel: string;
}

export interface CartItem {
  key: string;
  productId: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  freeShipping: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryZone: DeliveryZone;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  promoCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  senderNumber?: string;
  status: OrderStatus;
  isReadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  domain: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  supportPhone: string;
  supportEmail: string;
  insideDhakaShipping: number;
  outsideDhakaShipping: number;
  adminPin: string;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  deliveryZone: DeliveryZone;
  walletBalance: number;
}
