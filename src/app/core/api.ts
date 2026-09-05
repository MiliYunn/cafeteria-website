import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { API_BASE } from "./auth";
import {
  ApiResponse,
  Category,
  ListResponse,
  Menu,
  Order,
  OrderFeeConfiguration,
  PaymentAccount,
  Shop,
  User,
} from "./models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private params(values: Record<string, string | number>) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values))
      if (value !== "") params = params.set(key, String(value));
    return params;
  }
  shops(page = 1, search = "", categoryId: number | "" = "") {
    return this.http.get<ListResponse<Shop>>(`${API_BASE}/shops`, {
      params: this.params({ page, per_page: 12, search, category_id: categoryId }),
    });
  }
  categories() {
    return this.http.get<ApiResponse<Category[]>>(`${API_BASE}/category-options`);
  }
  menus(shopId: number, page = 1, search = "") {
    return this.http.get<ListResponse<Menu>>(`${API_BASE}/shops/${shopId}/menus`, {
      params: this.params({ page, per_page: 50, search }),
    });
  }
  paymentAccounts(shopId: number) {
    return this.http.get<ApiResponse<PaymentAccount[]>>(
      `${API_BASE}/shops/${shopId}/payment-accounts`,
    );
  }
  createOrder(body: {
    shop_id: number;
    payment_account_id: number;
    fulfillment: "pickup" | "delivery";
    delivery_location: string | null;
    remark: string | null;
    items: { menu_id: number; quantity: number }[];
  }) {
    return this.http.post<ApiResponse<Order>>(`${API_BASE}/orders`, body);
  }
  orderFees() {
    return this.http.get<ApiResponse<OrderFeeConfiguration>>(
      `${API_BASE}/order-fees`,
    );
  }
  orders(page = 1) {
    return this.http.get<ListResponse<Order>>(`${API_BASE}/orders`, {
      params: this.params({ page, per_page: 20 }),
    });
  }
  order(orderId: number) {
    return this.http.get<ApiResponse<Order>>(`${API_BASE}/orders/${orderId}`);
  }
  profile() {
    return this.http.get<ApiResponse<User>>(`${API_BASE}/auth/profile`);
  }
  updateProfile(body: { fullname?: string; password?: string }) {
    return this.http.put<ApiResponse<User>>(`${API_BASE}/auth/profile`, body);
  }
}

export function mediaUrl(value?: string) {
  if (!value) return "";
  return value.startsWith("/") ? `http://127.0.0.1:8000${value}` : value;
}
