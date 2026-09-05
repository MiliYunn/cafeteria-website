import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "../core/auth";
import { CartService } from "../core/cart";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-layout",
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <a routerLink="/shops" class="mini-brand"><span>C</span><strong>Cafeteria</strong></a>
        <div class="header-user">
          <span>{{ auth.session()?.user?.fullname || "Campus user" }}</span>
          <button aria-label="Log out" (click)="logout()"><app-icon name="logout" [size]="19" /></button>
        </div>
      </header>
      <main class="page"><router-outlet /></main>
      <a routerLink="/cart" routerLinkActive="active" class="floating-cart" aria-label="Open cart" title="Cart">
        <app-icon name="cart" [size]="23" />
        @if (cart.count()) { <b>{{ cart.count() }}</b> }
      </a>
      <nav class="bottom-nav" aria-label="Primary navigation">
        <a routerLink="/shops" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          <app-icon name="shops" /><span>Browse</span>
        </a>
        <a routerLink="/orders" routerLinkActive="active">
          <app-icon name="orders" /><span>Orders</span>
        </a>
        <a routerLink="/profile" routerLinkActive="active">
          <app-icon name="profile" /><span>Profile</span>
        </a>
      </nav>
    </div>
  `,
})
export class Layout {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private router = inject(Router);
  private toast = inject(ToastrService);
  logout() {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(["/login"]),
      error: () => {
        this.auth.clear();
        this.toast.info("You have been signed out locally.");
        void this.router.navigate(["/login"]);
      },
    });
  }
}
