// ─── Food & Menu Types ────────────────────────────────────────────────────────
import { ImageSourcePropType } from 'react-native';

export type FoodCategory =
  | 'all'
  | 'soups'
  | 'rice'
  | 'grills'
  | 'snacks'
  | 'drinks'
  | 'specials';

export interface SwallowOption {
  id: string;
  label: string;
}

export interface PortionOption {
  id: string;
  label: string;
  price: number;
}

export interface FoodItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: FoodCategory;
  basePrice: number;
  rating: number;
  reviewCount: string; // e.g. "1.2k+"
  calories: number;
  prepTime: string; // e.g. "20-30 min"
  badge?: string; // e.g. "Chef's Special"
  restaurant: string;
  distance: string;
  image: ImageSourcePropType;
  swallowOptions?: SwallowOption[];
  portionOptions?: PortionOption[];
  isFeatured?: boolean;
  isFavourite?: boolean;
}

// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  food: FoodItem;
  quantity: number;
  selectedSwallow?: SwallowOption;
  selectedPortion?: PortionOption;
  unitPrice: number; // resolved price (portion price or basePrice)
}

export interface Cart {
  items: CartItem[];
  promoCode?: string;
  promoDiscount: number;
  deliveryFee: number;
  packagingFee: number;
}

// ─── User Profile & Address Types ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role?: 'customer' | 'admin' | 'dispatch_rider';
  isActive?: boolean;
  savedAddresses: DeliveryAddress[];
  defaultAddressId?: string;
}

export interface DeliveryAddress {
  id: string;
  title: string; // "Home", "Office", "Friend's Place"
  street: string;
  city: string;
  landmark?: string;
  isDefault?: boolean;
}

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CHOW-8921"
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'card' | 'transfer' | 'cash';
  createdAt: string; // ISO date string
  deliveryAddress: string;
  recipientPhone: string;
  deliveryNote?: string;
  estimatedTime: string;
  restaurantName: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface ChowNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
}

// ─── Navigation Param Types ───────────────────────────────────────────────────

export type RootTabParamList = {
  index: undefined;
  pickup: undefined;
  shop: undefined;
  orders: undefined;
  profile: undefined;
};

export interface FoodDetailParams {
  id: string;
}
