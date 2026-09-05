import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { ApiService, mediaUrl } from "../core/api";
import { apiError } from "../core/auth";
import { CartService } from "../core/cart";
import { Menu } from "../core/models";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-menus",
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <div class="menu-head enter">
      <a routerLink="/shops" class="round-button" aria-label="Back to shops"><app-icon name="back" /></a>
      <div><span class="eyebrow">NOW ORDERING FROM</span><h1>{{ shopName }}</h1></div>
    </div>
    <form class="search-bar compact enter delay-1" (ngSubmit)="loadMenus()">
      <app-icon name="search" [size]="18" /><input name="search" [(ngModel)]="search" placeholder="Search this menu" /><button>Search</button>
    </form>
    @if (differentShop()) {
      <div class="info-banner one-shop-note">
        Your cart contains items from {{ cart.shopName() }}. Complete or clear that cart before ordering from {{ shopName }}.
        <a routerLink="/cart">View cart</a>
      </div>
    }
    @if (loading()) {
      <div class="menu-grid"><span class="skeleton menu"></span><span class="skeleton menu"></span></div>
    } @else if (error()) {
      <div class="error-banner">{{ error() }}</div>
    } @else {
      <div class="menu-grid">
        @for (menu of menus(); track menu.id; let index = $index) {
          <article class="menu-card enter" [style.animation-delay.ms]="index * 45">
            <div class="menu-image">
              @if (menu.image) { <img [src]="media(menu.image)" [alt]="menu.name" /> }
              @else { <app-icon name="food" [size]="30" /> }
            </div>
            <div class="menu-copy">
              <div class="chips">@for (genre of menu.genres.slice(0, 2); track genre.id) { <span>{{ genre.name }}</span> }</div>
              <h2>{{ menu.name }}</h2>
              <p>{{ menu.description || "Freshly prepared for your order." }}</p>
              <div class="menu-price">
                <strong>RM {{ money(menu.cost) }}</strong>
                @if (cart.quantity(menu.id)) {
                  <div class="quantity"><button (click)="cart.change(menu.id, -1)"><app-icon name="minus" [size]="15" /></button><span>{{ cart.quantity(menu.id) }}</span><button (click)="addToCart(menu)"><app-icon name="plus" [size]="15" /></button></div>
                } @else {
                  <button class="add-button" [disabled]="differentShop()" (click)="addToCart(menu)"><app-icon name="plus" [size]="17" /> Add</button>
                }
              </div>
            </div>
          </article>
        } @empty {
          <div class="empty-card"><app-icon name="food" [size]="30" /><h2>No menu items found</h2><p>Try another search.</p></div>
        }
      </div>
    }
  `,
})
export class MenusPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  readonly cart = inject(CartService);
  readonly media = mediaUrl;
  readonly menus = signal<Menu[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  shopId = Number(this.route.snapshot.paramMap.get("shopId"));
  shopName = this.route.snapshot.queryParamMap.get("name") || "Shop menu";
  search = "";

  ngOnInit() { this.loadMenus(); }
  differentShop() { return !!this.cart.lines().length && this.cart.shopId() !== this.shopId; }
  addToCart(menu: Menu) {
    if (!this.cart.add(menu, this.shopName))
      this.toast.warning(`Your cart already contains items from ${this.cart.shopName()}.`);
  }
  loadMenus() {
    this.loading.set(true);
    this.api.menus(this.shopId, 1, this.search.trim()).subscribe({
      next: (response) => { this.menus.set(response.data); this.loading.set(false); },
      error: (error) => { this.error.set(apiError(error)); this.loading.set(false); },
    });
  }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
