// Commerce types — Kelatic Vitality House product catalog & orders
// Matches migration 050_vitality_house_commerce.sql

export interface ProductCategory {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductFulfillment = 'pickup' | 'shipping' | 'both';

export interface ProductOption {
  id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ProductOptionGroup {
  id: string;
  product_id: string;
  name: string;
  min_select: number;
  max_select: number;
  sort_order: number;
  options?: ProductOption[];
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  currency: string;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  track_inventory: boolean;
  stock_quantity: number | null;
  fulfillment: ProductFulfillment;
  stripe_product_id: string | null;
  created_at: string;
  updated_at: string;
  // Optional joins
  category?: ProductCategory | null;
  option_groups?: ProductOptionGroup[];
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItemSelectedOption {
  group: string;
  option: string;
  delta_cents: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  selected_options: OrderItemSelectedOption[];
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  client_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  fulfillment_type: 'pickup' | 'shipping';
  pickup_time: string | null;
  shipping_address: Record<string, unknown> | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_receipt_url: string | null;
  created_at: string;
  updated_at: string;
  // Optional join
  items?: OrderItem[];
}

// Payload sent from the product entry form
export interface ProductFormPayload {
  name: string;
  category_id: string | null;
  description?: string | null;
  image_url?: string | null;
  price_cents: number;
  tags?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  track_inventory?: boolean;
  stock_quantity?: number | null;
  option_groups?: Array<{
    name: string;
    min_select: number;
    max_select: number;
    options: Array<{ name: string; price_delta_cents: number; is_default?: boolean }>;
  }>;
}
