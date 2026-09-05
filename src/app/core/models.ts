export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}
export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}
export interface User {
  id: number;
  username: string;
  email: string;
  fullname: string;
  type: string;
  role_id: number;
}
export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number;
  role: "student" | "staff";
  user: User;
}
export interface Category { id: number; name: string }
export interface Genre { id: number; name: string }
export interface Shop {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  location: string;
  open_at?: string;
  close_at?: string;
  categories: Category[];
}
export interface Menu {
  id: number;
  shop_id: number;
  name: string;
  description?: string;
  image?: string;
  cost: number | string;
  genres: Genre[];
}
export interface PaymentMethod {
  id: number;
  name: string;
  type: "cash" | "bank" | "wallet" | "card" | string;
  logo?: string;
  description?: string;
}
export interface PaymentAccount {
  id: number;
  account_holder_name: string;
  account_number: string;
  image?: string;
  payment_method: PaymentMethod;
}
export interface OrderFeeConfiguration {
  tax_fee: number | string;
  pickup_service_fee: number | string;
  delivery_service_fee: number | string;
}
export interface OrderItem {
  id: number;
  menu_id: number;
  menu_name: string;
  quantity: number;
  amount: number | string;
}
export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: string;
  created_at: string;
}
export interface Order {
  id: number;
  order_code: string;
  status: string;
  order_at: string;
  subtotal_amount: number | string;
  tax_fee: number | string;
  service_fee: number | string;
  total_amount: number | string;
  is_pickup: boolean;
  delivery_location?: string;
  shop?: { id: number; name: string };
  items: OrderItem[];
  payment_account?: PaymentAccount;
  status_history?: OrderStatusHistory[];
}
