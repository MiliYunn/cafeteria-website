import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { mediaUrl } from "../core/api";
import { CartService } from "../core/cart";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-cart",
  imports: [RouterLink, Icon],
  template: `
    <section class="page-heading enter cart-heading">
      <div><span class="eyebrow">ONE RESTAURANT PER ORDER</span><h1>Your cart</h1><p>{{ cart.shopName() || "Check the menu items you selected." }}</p></div>
      @if (cart.lines().length) { <button class="clear-cart" (click)="clearCart()">Clear all</button> }
    </section>

    @if (!cart.lines().length) {
      <section class="empty-card enter">
        <app-icon name="cart" [size]="32" />
        <h2>Your cart is empty</h2>
        <p>Choose a restaurant and add menu items first.</p>
        <a class="primary" routerLink="/shops">Browse restaurants</a>
      </section>
    } @else {
      <section class="cart-items enter delay-1">
        @for (line of cart.lines(); track line.menu.id) {
          <article class="cart-item">
            <div class="cart-item-image">
              @if (line.menu.image) { <img [src]="media(line.menu.image)" [alt]="line.menu.name" /> }
              @else { <app-icon name="food" [size]="24" /> }
            </div>
            <div class="cart-item-copy">
              <button class="remove-item" [attr.aria-label]="'Remove ' + line.menu.name" (click)="remove(line.menu.id, line.menu.name)"><app-icon name="close" [size]="17" /></button>
              <h2>{{ line.menu.name }}</h2>
              <span>RM {{ money(line.menu.cost) }} each</span>
              <div class="cart-item-actions">
                <div class="quantity">
                  <button aria-label="Decrease quantity" (click)="cart.change(line.menu.id, -1)"><app-icon name="minus" [size]="15" /></button>
                  <span>{{ line.quantity }}</span>
                  <button aria-label="Increase quantity" (click)="cart.add(line.menu, cart.shopName())"><app-icon name="plus" [size]="15" /></button>
                </div>
                <strong>RM {{ money(+line.menu.cost * line.quantity) }}</strong>
              </div>
            </div>
          </article>
        }
      </section>

      <section class="cart-review-total enter delay-1">
        <div><span>{{ cart.count() }} {{ cart.count() === 1 ? "item" : "items" }} from {{ cart.shopName() }}</span><strong>RM {{ money(cart.total()) }}</strong></div>
        <a class="primary wide" routerLink="/checkout">Continue to checkout</a>
      </section>
    }
  `,
})
export class CartPage {
  private toast = inject(ToastrService);
  readonly cart = inject(CartService);
  readonly media = mediaUrl;
  remove(menuId: number, name: string) {
    this.cart.remove(menuId);
    this.toast.info(`${name} removed from your cart.`);
  }
  clearCart() {
    this.cart.clear();
    this.toast.info("Cart cleared.");
  }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
