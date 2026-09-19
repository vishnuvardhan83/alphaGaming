import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Nav } from '../../shared/nav/nav';
import { Footer } from '../../shared/footer/footer';
import { BookingService } from '../../core/booking/booking.service';
import { Booking } from '../../core/booking/booking.models';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/auth/api-error';

@Component({
  selector: 'aq-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Nav, Footer, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly bookingsApi = inject(BookingService);
  protected readonly auth = inject(AuthService);

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyRef = signal<string | null>(null);

  private readonly cancellable = new Set(['AWAITING_PAYMENT', 'PAYMENT_RECEIVED', 'PENDING_APPROVAL', 'CONFIRMED']);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.bookingsApi.mine().subscribe({
      next: (list) => { this.bookings.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  canCancel(b: Booking): boolean { return this.cancellable.has(b.status); }

  cancel(b: Booking): void {
    if (!this.canCancel(b)) return;
    this.busyRef.set(b.reference);
    this.bookingsApi.cancel(b.reference).subscribe({
      next: () => { this.busyRef.set(null); this.load(); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.busyRef.set(null); },
    });
  }

  statusClass(status: string): string {
    if (['CONFIRMED', 'CHECKED_IN', 'ACTIVE', 'COMPLETED'].includes(status)) return 'status--available';
    if (['REJECTED', 'CANCELLED', 'EXPIRED', 'NO_SHOW', 'REFUNDED'].includes(status)) return 'status--full';
    return 'status--soon';
  }
  label(status: string): string { return status.replace(/_/g, ' ').toLowerCase(); }
}
