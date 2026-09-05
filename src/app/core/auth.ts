import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject, signal } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { catchError, tap, throwError } from "rxjs";
import { ApiResponse, Session, User } from "./models";

export const API_BASE = "http://127.0.0.1:8000/cafeteria/api";
const SESSION_KEY = "cafeteria.website.session";

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  readonly session = signal<Session | null>(this.restore());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.scheduleExpiry();
  }

  private restore(): Session | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Session | null;
      if (!session?.access_token || session.expiresAt <= Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<ApiResponse<Omit<Session, "expiresAt">>>(`${API_BASE}/auth/login`, {
        email,
        password,
      })
      .pipe(tap((response) => this.save(response.data)));
  }

  private save(data: Omit<Session, "expiresAt">) {
    const session: Session = {
      ...data,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    this.session.set(session);
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.scheduleExpiry();
  }

  private scheduleExpiry() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    const remaining = (this.session()?.expiresAt || 0) - Date.now();
    if (remaining > 0)
      this.expiryTimer = setTimeout(() => this.expire(), Math.min(remaining, 2_147_000_000));
  }

  isAuthenticated() {
    const session = this.session();
    return !!session?.access_token && session.expiresAt > Date.now();
  }

  updateUser(user: User) {
    const session = this.session();
    if (!session) return;
    const updated = { ...session, user };
    this.session.set(updated);
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  expire() {
    this.clear();
    void this.router.navigate(["/login"], { queryParams: { reason: "expired" } });
  }

  logout() {
    return this.http.post<ApiResponse<null>>(`${API_BASE}/auth/logout`, {}).pipe(
      catchError(() => throwError(() => new Error("Logout request failed"))),
      tap(() => this.clear()),
    );
  }

  clear() {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.session.set(null);
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem(SESSION_KEY);
  }
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  return auth.isAuthenticated() ? true : router.createUrlTree(["/login"]);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  return auth.isAuthenticated() ? router.createUrlTree(["/shops"]) : true;
};

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  if (!request.url.startsWith(API_BASE) || request.url.endsWith("/auth/login"))
    return next(request);
  const token = auth.session()?.access_token;
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) auth.expire();
      return throwError(() => error);
    }),
  );
};

export function apiError(error: unknown) {
  if (error instanceof HttpErrorResponse) {
    const errors = error.error?.errors;
    if (errors && typeof errors === "object") return Object.values(errors).join(" ");
    return error.error?.message || "The request could not be completed.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
