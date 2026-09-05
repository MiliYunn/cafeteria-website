import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./core/auth";

export const routes: Routes = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () => import("./pages/login").then((m) => m.LoginPage),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () => import("./layout/layout").then((m) => m.Layout),
    children: [
      { path: "", pathMatch: "full", redirectTo: "shops" },
      {
        path: "shops",
        loadComponent: () => import("./pages/shops").then((m) => m.ShopsPage),
      },
      {
        path: "shops/:shopId/menus",
        loadComponent: () => import("./pages/menus").then((m) => m.MenusPage),
      },
      {
        path: "cart",
        loadComponent: () => import("./pages/cart").then((m) => m.CartPage),
      },
      {
        path: "checkout",
        loadComponent: () => import("./pages/checkout").then((m) => m.CheckoutPage),
      },
      {
        path: "orders",
        loadComponent: () => import("./pages/orders").then((m) => m.OrdersPage),
      },
      {
        path: "profile",
        loadComponent: () => import("./pages/profile").then((m) => m.ProfilePage),
      },
    ],
  },
  { path: "**", redirectTo: "shops" },
];
