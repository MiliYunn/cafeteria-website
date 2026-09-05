import { DatePipe } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { interval } from "rxjs";
import { ApiService } from "../core/api";
import { apiError } from "../core/auth";
import { Order } from "../core/models";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-orders",
  imports: [DatePipe, RouterLink, Icon],
  template: `
    <section class="page-heading enter"><span class="eyebrow">ORDER HISTORY</span><h1>Your orders</h1><p>Tap an order to view its details and latest status.</p></section>
    @if (loading()) { <div class="list-stack"><span class="skeleton order"></span><span class="skeleton order"></span></div> }
    @else if (error()) { <div class="error-banner">{{ error() }}</div> }
    @else {
      <div class="list-stack">
        @for (order of orders(); track order.id; let index = $index) {
          <article class="order-card order-card-clickable enter" role="button" tabindex="0" [style.animation-delay.ms]="index * 50" (click)="openOrder(order.id)" (keydown.enter)="openOrder(order.id)">
            <header><div><small>{{ order.order_code }}</small><h2>{{ order.shop?.name || "Shop" }}</h2></div><span class="order-status" [attr.data-status]="order.status">{{ order.status }}</span></header>
            <div class="order-meta"><span><app-icon name="clock" [size]="15" />{{ order.order_at | date: "medium" }}</span><span><app-icon [name]="order.is_pickup ? 'bag' : 'delivery'" [size]="15" />{{ order.is_pickup ? "Pickup" : "Delivery" }}</span></div>
            <div class="order-items">@for (item of order.items; track item.id) { <span>{{ item.quantity }}× {{ item.menu_name }}</span> }</div>
            <footer><span>View order details</span><strong>Total RM {{ money(order.total_amount) }} <app-icon name="right" [size]="15" /></strong></footer>
          </article>
        } @empty {
          <div class="empty-card"><app-icon name="orders" [size]="32" /><h2>No orders yet</h2><p>Your orders will appear here after checkout.</p><a class="primary" routerLink="/shops">Browse shops</a></div>
        }
      </div>
    }

    @if (selected(); as order) {
      <div class="order-detail-backdrop" (click)="closeOrder()">
        <section class="customer-order-sheet" role="dialog" aria-modal="true" aria-label="Order details" (click)="$event.stopPropagation()">
          <header>
            <div><span class="eyebrow">{{ order.order_code }}</span><h2>{{ order.shop?.name || 'Order details' }}</h2></div>
            <button class="round-button" aria-label="Close order details" (click)="closeOrder()"><app-icon name="close" /></button>
          </header>
          <div class="customer-order-scroll">
            <div class="current-order-status" [attr.data-status]="order.status">
              <small>Current status</small><strong>{{ order.status }}</strong>
              <span>Updated automatically every 10 seconds</span>
            </div>

            @if (order.status === 'cancelled') {
              <div class="cancelled-message">This order was cancelled.</div>
            } @else {
              <div class="status-progress" aria-label="Order progress">
                @for (step of statusSteps; track step) {
                  <div [class.done]="statusReached(order.status, step)" [class.current]="order.status === step"><i></i><span>{{ statusLabel(step) }}</span></div>
                }
              </div>
            }

            <section class="detail-section">
              <h3>Items</h3>
              <div class="detail-items">
                @for (item of order.items; track item.id) {
                  <div><b>{{ item.quantity }}×</b><span>{{ item.menu_name }}</span><strong>RM {{ money(item.amount) }}</strong></div>
                }
              </div>
            </section>

            <section class="detail-section order-information">
              <h3>Order information</h3>
              <div><span>Fulfilment</span><strong>{{ order.is_pickup ? 'Pickup' : 'Delivery' }}</strong></div>
              @if (!order.is_pickup) { <div><span>Delivery address</span><strong>{{ order.delivery_location }}</strong></div> }
              <div><span>Payment</span><strong>{{ order.payment_account?.payment_method?.name || '—' }}</strong></div>
              <div><span>Placed at</span><strong>{{ order.order_at | date:'medium' }}</strong></div>
            </section>

            <section class="detail-section detail-fees">
              <h3>Payment summary</h3>
              <div><span>Sub-total</span><strong>RM {{ money(order.subtotal_amount) }}</strong></div>
              <div><span>Tax fee</span><strong>RM {{ money(order.tax_fee) }}</strong></div>
              <div><span>Service fee</span><strong>RM {{ money(order.service_fee) }}</strong></div>
              <div class="detail-total"><span>Total fee</span><strong>RM {{ money(order.total_amount) }}</strong></div>
            </section>

            <section class="detail-section">
              <h3>Status history</h3>
              <div class="status-history">
                @for (event of order.status_history || []; track event.id) {
                  <div><i></i><span><strong>{{ statusLabel(event.status) }}</strong><small>{{ event.created_at | date:'medium' }}</small></span></div>
                }
              </div>
            </section>
          </div>
        </section>
      </div>
    }
  `,
})
export class OrdersPage implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  readonly orders = signal<Order[]>([]);
  readonly selected = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly statusSteps = ["pending", "confirmed", "preparing", "ready", "completed"];

  ngOnInit() {
    this.loadOrders();
    interval(10000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadOrders(true);
      const orderId = this.selected()?.id;
      if (orderId) this.refreshOrder(orderId);
    });
  }
  loadOrders(silent = false) {
    if (!silent) this.loading.set(true);
    this.api.orders().subscribe({
      next: (response) => { this.orders.set(response.data); this.loading.set(false); },
      error: (error) => { if (!silent) this.error.set(apiError(error)); this.loading.set(false); },
    });
  }
  openOrder(orderId: number) {
    const summary = this.orders().find((order) => order.id === orderId);
    if (summary) this.selected.set(summary);
    this.refreshOrder(orderId);
  }
  closeOrder() { this.selected.set(null); }
  private refreshOrder(orderId: number) {
    this.api.order(orderId).subscribe({ next: (response) => this.selected.set(response.data) });
  }
  statusReached(current: string, step: string) {
    return this.statusSteps.indexOf(step) <= this.statusSteps.indexOf(current);
  }
  statusLabel(value: string) { return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
