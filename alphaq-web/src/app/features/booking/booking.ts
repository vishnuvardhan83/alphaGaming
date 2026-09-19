import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, startWith, Subscription } from 'rxjs';
import { Nav } from '../../shared/nav/nav';
import { Footer } from '../../shared/footer/footer';
import { BookingService } from '../../core/booking/booking.service';
import { CatalogueService } from '../../core/catalogue/catalogue.service';
import { Availability, Booking } from '../../core/booking/booking.models';
import { apiErrorMessage } from '../../core/auth/api-error';

const OPEN = '11:00';
const CLOSE = '20:00';

@Component({
  selector: 'aq-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Nav, Footer],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class BookingPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly bookings = inject(BookingService);
  private readonly catalogue = inject(CatalogueService);
  private readonly route = inject(ActivatedRoute);

  protected readonly phase = signal<'configure' | 'pay' | 'done'>('configure');
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected readonly availability = signal<Availability | null>(null);
  protected readonly checking = signal(false);
  protected readonly booking = signal<Booking | null>(null);
  protected readonly holdRemaining = signal(0);

  // pricing map: platform -> { min30, day }
  private readonly prices = signal<Record<string, { min30: number; day: number }>>({});

  protected readonly startTimes = this.buildTimes();
  protected readonly durations = [
    { min: 30, label: '30 minutes' }, { min: 60, label: '1 hour' },
    { min: 90, label: '1.5 hours' }, { min: 120, label: '2 hours' }, { min: 180, label: '3 hours' },
  ];
  protected readonly maxDate = this.dateStr(7);
  protected readonly minDate = this.dateStr(0);

  protected readonly form = this.fb.nonNullable.group({
    platform: ['PC', Validators.required],
    date: [this.dateStr(1), Validators.required],
    start: ['14:00', Validators.required],
    durationMin: [60, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    participants: [1, [Validators.required, Validators.min(1)]],
    dayPass: [false],
  });

  private sub?: Subscription;
  private timer?: ReturnType<typeof setInterval>;

  protected readonly unitPrice = computed(() => {
    const v = this.form.getRawValue();
    const p = this.prices()[v.platform];
    if (!p) return 0;
    return v.dayPass ? p.day : (v.durationMin / 30) * p.min30;
  });
  protected readonly total = computed(() => this.unitPrice() * this.form.getRawValue().quantity);

  constructor() {
    const platform = this.route.snapshot.queryParams['platform'];
    if (platform === 'PC' || platform === 'PS5') this.form.controls.platform.setValue(platform);

    this.catalogue.pricing().subscribe((list) => {
      const map: Record<string, { min30: number; day: number }> = {};
      for (const pl of list) {
        const min30 = pl.tiers.find((t) => t.tierCode === 'MIN30')?.priceInr ?? 0;
        const day = pl.tiers.find((t) => t.tierCode === 'DAY')?.priceInr ?? 0;
        map[pl.platform] = { min30, day };
      }
      this.prices.set(map);
    });

    // Live availability whenever the selection changes.
    this.sub = this.form.valueChanges.pipe(startWith(null), debounceTime(300)).subscribe(() => this.checkAvailability());
  }

  private checkAvailability(): void {
    const v = this.form.getRawValue();
    if (!v.platform || !v.date) return;
    const start = v.dayPass ? OPEN : v.start;
    const end = v.dayPass ? CLOSE : this.addMinutes(v.start, v.durationMin);
    if (!end || start >= end) { this.availability.set(null); return; }
    this.checking.set(true);
    this.bookings.availability(v.platform, v.date, start, end).subscribe({
      next: (a) => { this.availability.set(a); this.checking.set(false); },
      error: () => { this.availability.set(null); this.checking.set(false); },
    });
  }

  protected get enoughFree(): boolean {
    const a = this.availability();
    return !!a && a.available >= this.form.getRawValue().quantity;
  }

  reserve(): void {
    if (this.form.invalid || !this.enoughFree) return;
    this.submitting.set(true); this.error.set(null);
    const v = this.form.getRawValue();
    this.bookings.create({
      platform: v.platform, date: v.date, start: v.start, durationMin: v.durationMin,
      quantity: v.quantity, participants: v.participants, dayPass: v.dayPass,
    }).subscribe({
      next: (b) => { this.booking.set(b); this.startHold(b.holdSecondsRemaining); this.phase.set('pay'); this.submitting.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.submitting.set(false); },
    });
  }

  payNow(): void {
    const b = this.booking();
    if (!b) return;
    this.submitting.set(true); this.error.set(null);
    this.bookings.pay(b.reference).subscribe({
      next: (res) => { this.booking.set(res); this.stopHold(); this.phase.set('done'); this.submitting.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.submitting.set(false); },
    });
  }

  cancelHold(): void {
    const b = this.booking();
    if (b) this.bookings.cancel(b.reference).subscribe();
    this.stopHold();
    this.booking.set(null);
    this.phase.set('configure');
  }

  private startHold(seconds: number): void {
    this.holdRemaining.set(seconds);
    this.stopHold();
    this.timer = setInterval(() => {
      const next = this.holdRemaining() - 1;
      this.holdRemaining.set(Math.max(0, next));
      if (next <= 0) this.stopHold();
    }, 1000);
  }
  private stopHold(): void { if (this.timer) { clearInterval(this.timer); this.timer = undefined; } }

  protected holdLabel(): string {
    const s = this.holdRemaining();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // ---- helpers ----
  private buildTimes(): string[] {
    const out: string[] = [];
    for (let m = 11 * 60; m <= 19 * 60 + 30; m += 30) {
      out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
    return out;
  }
  private addMinutes(hhmm: string, mins: number): string | null {
    const [h, m] = hhmm.split(':').map(Number);
    const total = h * 60 + m + mins;
    if (total > 20 * 60) return null; // past closing
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  private dateStr(offsetDays: number): string {
    // Local date (NOT toISOString, which is UTC and can shift the day in IST).
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); this.stopHold(); }
}
