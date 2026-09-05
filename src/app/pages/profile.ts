import { Component, OnInit, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { ApiService } from "../core/api";
import { AuthService, apiError } from "../core/auth";
import { User } from "../core/models";

@Component({
  selector: "app-profile",
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-heading enter"><span class="eyebrow">YOUR ACCOUNT</span><h1>Profile</h1><p>Keep your display name and password up to date.</p></section>
    @if (loading()) { <span class="skeleton profile"></span> }
    @else if (user()) {
      <section class="profile-card enter delay-1">
        <div class="profile-summary"><span>{{ initials(user()!.fullname) }}</span><div><h2>{{ user()!.fullname }}</h2><p>{{ user()!.email }}</p><em>{{ user()!.type }}</em></div></div>
        <form [formGroup]="form" (ngSubmit)="save()">
          <label class="stack-field"><span>Full name *</span><input formControlName="fullname" /></label>
          <div class="form-divider"><span>Change password</span></div>
          <label class="stack-field"><span>New password</span><input type="password" formControlName="password" autocomplete="new-password" placeholder="Leave blank to keep current password" /><small>Use 8–15 characters.</small></label>
          <label class="stack-field"><span>Confirm new password</span><input type="password" formControlName="confirmPassword" autocomplete="new-password" /></label>
          @if (error()) { <div class="error-banner">{{ error() }}</div> }
          <button class="primary wide" [disabled]="saving">{{ saving ? "Saving…" : "Save profile" }}</button>
        </form>
      </section>
    }
  `,
})
export class ProfilePage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);
  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  saving = false;
  form = this.fb.nonNullable.group({
    fullname: ["", [Validators.required, Validators.maxLength(255)]],
    password: ["", [Validators.minLength(8), Validators.maxLength(15)]],
    confirmPassword: [""],
  });
  ngOnInit() { this.api.profile().subscribe({ next: (r) => { this.user.set(r.data); this.form.controls.fullname.setValue(r.data.fullname); this.loading.set(false); }, error: (e) => { this.error.set(apiError(e)); this.loading.set(false); } }); }
  save() {
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.error.set("Enter a full name and use 8–15 characters for a new password."); return; }
    if (value.password !== value.confirmPassword) { this.error.set("The password confirmation does not match."); return; }
    const body: { fullname: string; password?: string } = { fullname: value.fullname.trim() };
    if (value.password) body.password = value.password;
    this.saving = true;
    this.error.set("");
    this.api.updateProfile(body).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (r) => { this.user.set(r.data); this.auth.updateUser(r.data); this.form.patchValue({ password: "", confirmPassword: "" }); this.toast.success("Profile updated."); },
      error: (e) => this.error.set(apiError(e)),
    });
  }
  initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
}
