import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../core/auth/api-error';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'aq-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly step = signal<1 | 2>(1);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly showPw = signal(false);

  protected readonly mobileForm = this.fb.nonNullable.group({
    mobile: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
  });

  protected readonly detailsForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(4)]],
    username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_.]{3,40}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    email: ['', [Validators.email]],
  });

  requestOtp(): void {
    if (this.mobileForm.invalid) { this.mobileForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set(null);
    this.auth.requestRegisterOtp(this.mobileForm.getRawValue().mobile).subscribe({
      next: (res) => { this.applyOtp(res); this.step.set(2); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  resendOtp(): void {
    this.loading.set(true); this.error.set(null);
    this.auth.requestRegisterOtp(this.mobileForm.getRawValue().mobile).subscribe({
      next: (res) => { this.applyOtp(res); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  /** In dev the mock provider returns the code, so we auto-fill it for easy UI testing. */
  private applyOtp(res: { message: string; devOtp?: string | null }): void {
    if (res.devOtp) {
      this.detailsForm.controls.otp.setValue(res.devOtp);
      this.notice.set(`Dev mode — OTP auto-filled: ${res.devOtp}`);
    } else {
      this.notice.set(res.message);
    }
  }

  register(): void {
    if (this.detailsForm.invalid) { this.detailsForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set(null);
    const v = this.detailsForm.getRawValue();
    this.auth.register({
      mobile: this.mobileForm.getRawValue().mobile,
      otp: v.otp, username: v.username, password: v.password,
      email: v.email ? v.email : null,
    }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  editMobile(): void { this.step.set(1); this.error.set(null); this.notice.set(null); }
}
