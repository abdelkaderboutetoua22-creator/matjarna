// Core Types for Matjarna E-commerce

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  sku: string;
  stock: number;
  is_published: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  category?: Category;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  cf_image_id: string;
  position: number;
  is_primary: boolean;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  position: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number | null;
  stock: number;
  option_values: Record<string, string>;
  is_available: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  position: number;
  children?: Category[];
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  selected_options: Record<string, string>;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon_code: string | null;
}

export interface ShippingRate {
  id: string;
  wilaya_code: string;
  wilaya_name: string;
  office_price: number;
  home_price: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya_code: string;
  wilaya_name: string;
  address: string;
  delivery_type: 'office' | 'home';
  note: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  status: OrderStatus;
  status_history: StatusHistoryEntry[];
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  variant_id: string | null;
  selected_options: Record<string, string>;
  quantity: number;
  price: number;
  total: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  product_ids: string[] | null;
  category_ids: string[] | null;
  is_active: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  text: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link: string | null;
  position: number;
  is_active: boolean;
}

export interface UpsellRule {
  id: string;
  name: string;
  trigger_type: 'product' | 'category' | 'cart_total';
  trigger_ids: string[];
  trigger_min_total: number | null;
  product_ids: string[];
  display_location: 'product_page' | 'checkout' | 'both';
  is_active: boolean;
}

export interface AbandonedCart {
  id: string;
  session_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  wilaya_code: string | null;
  address: string | null;
  items: CartItem[];
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  store_name: string;
  logo_url: string | null;
  support_phone: string;
  support_email: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    telegram?: string;
    x?: string;
    snapchat?: string;
  };
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  name: string;
  created_at: string;
}

// Analytics Types
export interface AnalyticsData {
  revenue: number;
  orders: number;
  aov: number;
  conversionRate: number;
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
  topCategories: { id: string; name: string; sales: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: Record<OrderStatus, number>;
}
