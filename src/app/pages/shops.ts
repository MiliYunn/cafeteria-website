import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ApiService, mediaUrl } from "../core/api";
import { apiError } from "../core/auth";
import { Category, Pagination, Shop } from "../core/models";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-shops",
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <section class="page-heading enter">
      <span class="eyebrow">CAMPUS FOOD</span>
      <h1>What are you craving?</h1>
      <p>Choose a shop first, then explore its available menu.</p>
    </section>
    <form class="search-bar enter delay-1" (ngSubmit)="searchNow()">
      <app-icon name="search" [size]="19" />
      <input name="search" [(ngModel)]="search" placeholder="Search restaurant name" />
      <button>Search</button>
    </form>
    <section class="category-filter enter delay-1" aria-label="Restaurant categories">
      <button [class.active]="selectedCategory === null" (click)="selectCategory(null)">
        <strong>All</strong>
      </button>
      @for (category of visibleCategories(); track category.id) {
        <button [class.active]="selectedCategory === category.id" (click)="selectCategory(category.id)">
          <strong>{{ category.name }}</strong>
        </button>
      }
    </section>
    @if (categories().length > 3) {
      <button class="category-more" (click)="toggleCategories()">
        {{ showAllCategories ? "See less" : "See more" }}
      </button>
    }
    @if (loading()) {
      <div class="card-grid"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
    } @else if (error()) {
      <div class="error-banner">{{ error() }}</div>
    } @else {
      <div class="card-grid">
        @for (shop of shops(); track shop.id; let index = $index) {
          <a class="shop-card enter" [style.animation-delay.ms]="index * 55" [routerLink]="['/shops', shop.id, 'menus']" [queryParams]="{ name: shop.name }">
            <div
              class="shop-visual"
              [class.has-logo]="!!shop.logo_url"
              [style.background-image]="shop.logo_url ? 'url(' + media(shop.logo_url) + ')' : null"
              [attr.aria-label]="shop.logo_url ? shop.name + ' logo' : null"
            >
              @if (!shop.logo_url) { <span>{{ initials(shop.name) }}</span> }
              <div class="open-chip"><i></i> Open today</div>
            </div>
            <div class="shop-copy">
              <h2>{{ shop.name }}</h2>
              <p><app-icon name="location" [size]="15" />{{ shop.location }}</p>
              <div class="chips">@for (category of shop.categories; track category.id) { <span>{{ category.name }}</span> }</div>
              <strong>View menu <app-icon name="right" [size]="17" /></strong>
            </div>
          </a>
        } @empty {
          <div class="empty-card"><app-icon name="shops" [size]="30" /><h2>No shops found</h2><p>Try a different search.</p></div>
        }
      </div>
      @if (pagination().total_pages > 1) {
        <div class="pager">
          <button [disabled]="!pagination().has_previous" (click)="changePage(-1)">Previous</button>
          <span>{{ pagination().page }} / {{ pagination().total_pages }}</span>
          <button [disabled]="!pagination().has_next" (click)="changePage(1)">Next</button>
        </div>
      }
    }
  `,
})
export class ShopsPage implements OnInit {
  private api = inject(ApiService);
  readonly media = mediaUrl;
  readonly shops = signal<Shop[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly pagination = signal<Pagination>({ page: 1, per_page: 12, total: 0, total_pages: 0, has_next: false, has_previous: false });
  search = "";
  selectedCategory: number | null = null;
  showAllCategories = false;
  ngOnInit() {
    this.load();
    this.api.categories().subscribe({
      next: (response) => this.categories.set(response.data),
      error: (error) => this.error.set(apiError(error)),
    });
  }
  load() {
    this.loading.set(true);
    this.api.shops(this.pagination().page, this.search.trim(), this.selectedCategory ?? "").subscribe({
      next: (response) => { this.shops.set(response.data); this.pagination.set(response.pagination); this.loading.set(false); },
      error: (error) => { this.error.set(apiError(error)); this.loading.set(false); },
    });
  }
  searchNow() { this.pagination.update((p) => ({ ...p, page: 1 })); this.load(); }
  selectCategory(categoryId: number | null) {
    this.selectedCategory = categoryId;
    this.pagination.update((pagination) => ({ ...pagination, page: 1 }));
    this.load();
  }
  visibleCategories() {
    return this.showAllCategories ? this.categories() : this.categories().slice(0, 3);
  }
  toggleCategories() {
    this.showAllCategories = !this.showAllCategories;
    if (
      !this.showAllCategories &&
      this.selectedCategory !== null &&
      !this.categories().slice(0, 3).some((category) => category.id === this.selectedCategory)
    ) {
      this.selectCategory(null);
    }
  }
  changePage(change: number) { this.pagination.update((p) => ({ ...p, page: p.page + change })); this.load(); }
  initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
}
