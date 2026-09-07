import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { finalize, timeout, TimeoutError } from "rxjs";
import { AuthService, apiError } from "../core/auth";
import { Icon } from "../shared/icon";

@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, Icon],
  template: `
    <main class="login-page">
      <section class="login-hero">
        <div class="login-hero-brand">
          <div class="brand-orbit"><span>C</span><i></i><i></i></div>
          <div><strong>Cafeteria</strong><small>MOBILE ORDERING</small></div>
        </div>
        <span class="eyebrow">YOUR CAMPUS, YOUR MEAL</span>
        <h1>Good food is only a few taps away.</h1>
        <p>Browse campus shops, place your order, and collect it when it is ready.</p>
      </section>
      <section class="login-card">
        <h2>Welcome back</h2>
        <p>Sign in with your student or staff account.</p>
        @if (expired) {
          <div class="info-banner">Your one-day session has expired. Please sign in again.</div>
        }
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label><span>Email address</span><input type="email" formControlName="email" autocomplete="email" placeholder="st000001@gmail.com" [attr.aria-invalid]="error ? true : null" /></label>
          <label><span>Password</span><input type="password" formControlName="password" autocomplete="current-password" placeholder="Enter your password" [attr.aria-invalid]="error ? true : null" /></label>
          @if (error) {
            <div class="login-warning" role="alert" aria-live="assertive">
              <strong>Unable to sign in</strong>
              <span>{{ error }}</span>
            </div>
          }
          <button class="primary wide" [disabled]="busy">
            @if (busy) { <span class="spinner"></span> } @else { <app-icon name="food" [size]="19" /> }
            {{ busy ? "Signing in…" : "Sign in" }}
          </button>
        </form>
        <small>No registration is available. Accounts are issued by an administrator.</small>
      </section>
    </main>
  `,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastrService);
  expired = inject(ActivatedRoute).snapshot.queryParamMap.get("reason") === "expired";
  busy = false;
  error = "";
  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8), Validators.maxLength(15)]],
  });
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = "Enter a valid email and a password between 8 and 15 characters.";
      return;
    }
    this.busy = true;
    this.error = "";
    this.auth
      .login(this.form.getRawValue().email, this.form.getRawValue().password)
      .pipe(
        timeout(10000),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: () => {
          this.toast.success("Welcome to Cafeteria.");
          void this.router.navigate(["/shops"]);
        },
        error: (error) => {
          if (error instanceof TimeoutError) {
            this.error = "The server is taking too long to respond. Check that the backend is running, then try again.";
          } else if (error instanceof HttpErrorResponse && error.status === 401) {
            this.error = "The email address or password is incorrect. Please check both fields and try again.";
          } else if (error instanceof HttpErrorResponse && error.status === 0) {
            this.error = "Cannot connect to the Cafeteria server. Check that the backend is running and restart it after configuration changes.";
          } else {
            this.error = apiError(error);
          }
        },
      });
  }
}
