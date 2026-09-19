import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../core/auth/api-error';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'aq-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
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
  protected readonly resetForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(4)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  requestOtp(): void {
    if (this.mobileForm.invalid) { this.mobileForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set(null);
    this.auth.requestResetOtp(this.mobileForm.getRawValue().mobile).subscribe({
      next: (res) => {
        if (res.devOtp) {
          this.resetForm.controls.otp.setValue(res.devOtp);
          this.notice.set(`Dev mode — OTP auto-filled: ${res.devOtp}`);
        } else {
          this.notice.set(res.message);
        }
        this.step.set(2); this.loading.set(false);
      },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  reset(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set(null);
    const v = this.resetForm.getRawValue();
    this.auth.resetPassword({ mobile: this.mobileForm.getRawValue().mobile, otp: v.otp, newPassword: v.newPassword })
      .subscribe({
        next: () => this.router.navigate(['/login'], { queryParams: { reset: '1' } }),
        error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
      });
  }
}
