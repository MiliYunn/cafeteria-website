import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { ApiService } from "../core/api";
import { apiError } from "../core/auth";
import { CartService } from "../core/cart";
import { OrderFeeConfiguration, PaymentAccount } from "../core/models";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-checkout",
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <div class="menu-head enter">
      <a routerLink="/cart" class="round-button" aria-label="Back to cart"><app-icon name="back" /></a>
      <div><span class="eyebrow">{{ cart.shopName() }}</span><h1>Checkout</h1></div>
    </div>

    @if (!cart.lines().length) {
      <section class="empty-card checkout-empty"><app-icon name="cart" [size]="30" /><h2>Your cart is empty</h2><p>Add menu items before checking out.</p><a class="primary" routerLink="/shops">Browse restaurants</a></section>
    } @else {
      <section class="checkout-summary enter delay-1">
        <h2>Order summary</h2>
        @for (line of cart.lines(); track line.menu.id) {
          <div><span>{{ line.quantity }}× {{ line.menu.name }}</span><strong>RM {{ money(+line.menu.cost * line.quantity) }}</strong></div>
        }
        <a routerLink="/cart">Edit cart</a>
      </section>

      <section class="cart-checkout enter delay-1">
        <div class="checkout-section first">
          <h3><app-icon name="payment" [size]="18" /> Payment</h3>
          @if (loadingAccounts()) { <span class="skeleton payment"></span> }
          @for (account of accounts(); track account.id) {
            <label class="choice-card" [class.selected]="paymentId === account.id">
              <input type="radio" name="payment" [value]="account.id" [(ngModel)]="paymentId" (ngModelChange)="paymentChanged()" />
              <span><strong>{{ account.payment_method.name }}</strong><small>{{ account.payment_method.type.toLowerCase() === 'cash' ? 'Pay when you collect' : account.account_number }}</small></span>
              <em>{{ account.payment_method.type }}</em>
            </label>
          } @empty { @if (!loadingAccounts()) { <p class="muted">This restaurant has no active payment accounts.</p> } }
        </div>

        <div class="checkout-section">
          <h3><app-icon name="delivery" [size]="18" /> Fulfilment</h3>
          <div class="segment">
            <button [class.active]="fulfillment === 'pickup'" (click)="fulfillment = 'pickup'">Pickup</button>
            <button [disabled]="isCash()" [class.active]="fulfillment === 'delivery'" (click)="fulfillment = 'delivery'">Delivery</button>
          </div>
          @if (isCash()) { <small class="cash-note">Cash orders are pickup only.</small> }
          @if (fulfillment === 'delivery') {
            <label class="stack-field"><span>Delivery address *</span><textarea [(ngModel)]="deliveryLocation" rows="3" placeholder="Building, floor, room or nearby landmark"></textarea></label>
          }
        </div>

        <label class="stack-field"><span>Order note</span><textarea [(ngModel)]="remark" rows="2" placeholder="Optional preparation note"></textarea></label>
        @if (error()) { <div class="error-banner">{{ error() }}</div> }
        <footer class="cart-total">
          <div class="fee-lines">
            <div><span>Sub-total</span><strong>RM {{ money(cart.total()) }}</strong></div>
            <div><span>Tax fee</span><strong>RM {{ money(taxFee()) }}</strong></div>
            <div><span>Service fee <small>{{ fulfillment === 'pickup' ? '(Pickup)' : '(Delivery)' }}</small></span><strong>RM {{ money(serviceFee()) }}</strong></div>
            <div class="grand-total"><span>Total fee</span><strong>RM {{ money(totalFee()) }}</strong></div>
          </div>
          <button class="primary wide" [disabled]="placing || !accounts().length" (click)="placeOrder()">{{ placing ? "Placing order…" : "Place order" }}</button>
        </footer>
      </section>
    }
  `,
})
export class CheckoutPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastrService);
  readonly cart = inject(CartService);
  readonly accounts = signal<PaymentAccount[]>([]);
  readonly loadingAccounts = signal(false);
  readonly error = signal("");
  readonly feeConfiguration = signal<OrderFeeConfiguration>({
    tax_fee: 1,
    pickup_service_fee: 0,
    delivery_service_fee: 1,
  });
  paymentId: number | null = null;
  fulfillment: "pickup" | "delivery" = "pickup";
  deliveryLocation = "";
  remark = "";
  placing = false;
  ngOnInit() {
    const shopId = this.cart.shopId();
    if (!shopId || !this.cart.lines().length) return;
    this.loadingAccounts.set(true);
    this.api.paymentAccounts(shopId).pipe(finalize(() => this.loadingAccounts.set(false))).subscribe({
      next: (response) => this.accounts.set(response.data),
      error: (error) => this.error.set(apiError(error)),
    });
    this.api.orderFees().subscribe({
      next: (response) => this.feeConfiguration.set(response.data),
      error: (error) => this.error.set(apiError(error)),
    });
  }
  selectedAccount() { return this.accounts().find((account) => account.id === Number(this.paymentId)); }
  isCash() { return this.selectedAccount()?.payment_method.type.toLowerCase() === "cash"; }
  paymentChanged() { if (this.isCash()) this.fulfillment = "pickup"; }
  taxFee() { return Number(this.feeConfiguration().tax_fee); }
  serviceFee() {
    const fees = this.feeConfiguration();
    return Number(
      this.fulfillment === "pickup"
        ? fees.pickup_service_fee
        : fees.delivery_service_fee,
    );
  }
  totalFee() { return this.cart.total() + this.taxFee() + this.serviceFee(); }
  placeOrder() {
    const shopId = this.cart.shopId();
    if (!shopId || !this.cart.lines().length) { this.error.set("Your cart is empty."); return; }
    if (!this.paymentId) { this.error.set("Choose a payment method."); return; }
    if (this.fulfillment === "delivery" && !this.deliveryLocation.trim()) { this.error.set("Enter a delivery address."); return; }
    this.placing = true;
    this.error.set("");
    this.api.createOrder({
      shop_id: shopId,
      payment_account_id: Number(this.paymentId),
      fulfillment: this.fulfillment,
      delivery_location: this.fulfillment === "delivery" ? this.deliveryLocation.trim() : null,
      remark: this.remark.trim() || null,
      items: this.cart.lines().map((line) => ({ menu_id: line.menu.id, quantity: line.quantity })),
    }).pipe(finalize(() => (this.placing = false))).subscribe({
      next: (response) => { this.cart.clear(); this.toast.success(`Order ${response.data.order_code} placed.`); void this.router.navigate(["/orders"]); },
      error: (error) => this.error.set(apiError(error)),
    });
  }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
