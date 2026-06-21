export type Role = "admin" | "cashier" | "kitchen" | "customer" | "guest";

export interface Category {
  id: string;
  cafe_id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Product {
  id: string;
  cafe_id: string;
  name: string;
  category_id: string;
  price: number;
  unit: string;
  tax_percentage: number;
  description?: string;
  prep_time_minutes: number;
  station: string;
  stock_qty: number;
  sold_today: number;
  margin_percentage: number;
  is_kitchen_item: boolean;
  is_available: boolean;
  is_popular: boolean;
  dietary_tags: string[];
  image_url?: string;
}

export interface Floor { id: string; cafe_id: string; name: string; }
export interface Table {
  id: string;
  cafe_id: string;
  floor_id: string;
  table_number: number;
  seats: number;
  active: boolean;
  status: "available" | "ordering" | "kitchen" | "preparing" | "ready" | "payment" | "paid";
  qr_token: string;
  current_order_id?: string | null;
}

export interface Ingredient {
  id: string;
  cafe_id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  cost_per_unit: number;
  supplier_name: string;
  expiry_date?: string;
  category: string;
  used_today: number;
}

export interface RecipeItem { cafe_id: string; product_id: string; ingredient_id: string; quantity_required: number; }

export type OrderSource = "POS" | "QR" | "Customer";
export type KitchenStatus = "to_cook" | "preparing" | "completed";
export type OrderStatus = "draft" | "sent_to_kitchen" | "ready" | "paid" | "cancelled" | KitchenStatus;
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "cash" | "upi" | "card";

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  prep_time_minutes: number;
  station: string;
  item_status: KitchenStatus;
  status?: KitchenStatus;
  kitchen_status?: KitchenStatus;
  completed?: boolean;
}

export interface Order {
  id: string;
  cafe_id: string;
  order_number: string;
  table_id?: string | null;
  table_number?: string | number;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  source: OrderSource;
  order_source?: OrderSource | string;
  status?: KitchenStatus;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  order_status: OrderStatus;
  kitchen_status: KitchenStatus;
  customer_status?: string;
  eta_minutes: number;
  priority_score: number;
  priority_level: "high" | "medium" | "normal";
  delay_status: "on_time" | "at_risk" | "delayed";
  ai_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface DemoCustomer {
  id: string;
  cafe_id: string;
  name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  tier: "Bronze" | "Silver" | "Gold";
  dietary_preferences: string[];
  favorite_items: string[];
  total_spent: number;
  total_orders: number;
}

export interface Coupon {
  id: string;
  cafe_id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  active: boolean;
  promo_type?: "coupon" | "auto_product" | "auto_order";
  min_quantity?: number;
  min_order_amount?: number;
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  cafe_id: string;
  name: string;
  enabled: boolean;
  upi_id?: string;
}

