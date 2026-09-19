import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BookingService } from './booking.service';

/** Loads today's live PC/PS5 availability for the nav + hero strip. */
@Injectable({ providedIn: 'root' })
export class AvailabilityStripService {
  private readonly bookings = inject(BookingService);

  readonly pcAvailable = signal(0);
  readonly pcTotal = signal(0);
  readonly ps5Available = signal(0);
  readonly ps5Total = signal(0);
  readonly loaded = signal(false);

  constructor() { this.refresh(); }

  refresh(): void {
    const date = this.today();
    forkJoin({
      pc: this.bookings.availability('PC', date, '11:00', '20:00'),
      ps5: this.bookings.availability('PS5', date, '11:00', '20:00'),
    }).subscribe({
      next: ({ pc, ps5 }) => {
        this.pcAvailable.set(pc.available); this.pcTotal.set(pc.capacity);
        this.ps5Available.set(ps5.available); this.ps5Total.set(ps5.capacity);
        this.loaded.set(true);
      },
      error: () => { /* keep zeros; strip still renders */ },
    });
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
