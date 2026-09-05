import { Component, Input } from "@angular/core";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  LogOut,
  LucideAngularModule,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  UserRound,
  UtensilsCrossed,
  WalletCards,
  X,
} from "lucide-angular";

const icons: Record<string, any> = {
  back: ArrowLeft,
  right: ChevronRight,
  clock: Clock3,
  logout: LogOut,
  location: MapPin,
  minus: Minus,
  orders: PackageCheck,
  plus: Plus,
  search: Search,
  bag: ShoppingBag,
  cart: ShoppingCart,
  shops: Store,
  trash: Trash2,
  delivery: Truck,
  profile: UserRound,
  food: UtensilsCrossed,
  payment: WalletCards,
  close: X,
};

@Component({
  selector: "app-icon",
  imports: [LucideAngularModule],
  template: '<lucide-icon [img]="icons[name]" [size]="size" [strokeWidth]="2" aria-hidden="true" />',
})
export class Icon {
  @Input() name = "food";
  @Input() size = 20;
  readonly icons = icons;
}
