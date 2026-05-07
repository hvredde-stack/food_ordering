// Database row types — kept in sync manually with supabase/schema.sql.
// (Generate from `supabase gen types typescript` once the project is wired up.)

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
export type ItemStatus = OrderStatus;
export type SessionStatus = "active" | "expired" | "cleaned";
export type SentimentKind = "happy" | "sad";
export type OrderType = "dine-in" | "takeout";
/**
 * How a dish (and its order line) is sold. "each" is the default for the
 * vast majority of items. Weight units (lb / kg / oz / g) let restaurants
 * sell things like "$15/lb fish pakora" with a fractional customer-picked
 * quantity. Stored on dishes.price_unit and snapshotted onto each
 * order_items.unit at order time so historical prices survive dish edits.
 */
export type PriceUnit = "each" | "lb" | "kg" | "oz" | "g";

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_user_id: string;
  currency: string;
  timezone: string;
  dine_in_enabled: boolean;
  takeout_enabled: boolean;
  takeout_code: string | null;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  invited_by_user_id: string | null;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Dish {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  /** Defaults to "each" — weight units enable fractional quantity. */
  price_unit: PriceUnit;
  image_url: string | null;
  available: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  code: string;
  label: string | null;
  seats: number;
  created_at: string;
}

export interface CustomerSession {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  takeout_code: string | null;
  order_type: OrderType;
  token: string;
  status: SessionStatus;
  party_size: number | null;
  customer_name: string | null;
  created_at: string;
  last_active_at: string;
  expires_at: string;
  cleaned_at: string | null;
  cleaned_by_user_id: string | null;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  takeout_code: string | null;
  session_id: string;
  order_type: OrderType;
  customer_name: string | null;
  status: OrderStatus;
  total_cents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  restaurant_id: string;
  dish_id: string;
  dish_name: string;
  unit_price_cents: number;
  /** Decimal: integer for "each" items, fractional for weight units. */
  quantity: number;
  /** Snapshot of the dish's price_unit at order time. */
  unit: PriceUnit;
  status: ItemStatus;
  notes: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SentimentEvent {
  id: string;
  restaurant_id: string;
  session_id: string;
  table_id: string;
  kind: SentimentKind;
  created_at: string;
}

export interface Feedback {
  id: string;
  restaurant_id: string;
  session_id: string;
  table_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  table?: RestaurantTable;
}
