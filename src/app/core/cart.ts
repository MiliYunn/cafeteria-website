import { Injectable, computed, signal } from "@angular/core";
import { Menu } from "./models";

export interface CartLine { menu: Menu; quantity: number }

@Injectable({ providedIn: "root" })
export class CartService {
  readonly shopId = signal<number | null>(null);
  readonly shopName = signal("");
  readonly lines = signal<CartLine[]>([]);
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + Number(line.menu.cost) * line.quantity, 0),
  );
  start(shopId: number, shopName: string) {
    if (!this.lines().length) {
      this.shopId.set(shopId);
      this.shopName.set(shopName);
      return true;
    }
    if (this.shopId() === shopId) {
      this.shopName.set(shopName);
      return true;
    }
    return false;
  }
  add(menu: Menu, shopName = "") {
    if (!this.start(menu.shop_id, shopName || this.shopName())) return false;
    this.lines.update((lines) => {
      const found = lines.find((line) => line.menu.id === menu.id);
      return found
        ? lines.map((line) =>
            line.menu.id === menu.id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...lines, { menu, quantity: 1 }];
    });
    return true;
  }
  change(menuId: number, difference: number) {
    const lines = this.lines()
        .map((line) =>
          line.menu.id === menuId
            ? { ...line, quantity: line.quantity + difference }
            : line,
        )
        .filter((line) => line.quantity > 0);
    this.lines.set(lines);
    if (!lines.length) this.resetShop();
  }
  remove(menuId: number) {
    const lines = this.lines().filter((line) => line.menu.id !== menuId);
    this.lines.set(lines);
    if (!lines.length) this.resetShop();
  }
  quantity(menuId: number) {
    return this.lines().find((line) => line.menu.id === menuId)?.quantity || 0;
  }
  clear() {
    this.lines.set([]);
    this.resetShop();
  }
  private resetShop() {
    this.shopId.set(null);
    this.shopName.set("");
  }
}
