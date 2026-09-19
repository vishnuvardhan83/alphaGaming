import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Nav } from '../../shared/nav/nav';
import { AdminService } from '../../core/admin/admin.service';
import { AdminBooking, SetupAdmin } from '../../core/admin/admin.models';
import { apiErrorMessage } from '../../core/auth/api-error';

@Component({
  selector: 'aq-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Nav, FormsModule],
  templateUrl: './admin.html',
})
export class Admin {
  private readonly api = inject(AdminService);

  protected readonly tab = signal<'bookings' | 'setups'>('bookings');
  protected readonly error = signal<string | null>(null);

  // Bookings
  protected statusFilter = 'PENDING_APPROVAL';   // plain property for [(ngModel)]
  protected readonly statuses = ['PENDING_APPROVAL', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'ALL'];
  protected readonly bookings = signal<AdminBooking[]>([]);
  protected readonly loadingBookings = signal(false);

  protected readonly expandedRef = signal<string | null>(null);
  protected readonly assignable = signal<string[]>([]);
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly rejectingRef = signal<string | null>(null);
  protected rejectReason = '';
  protected readonly busyRef = signal<string | null>(null);

  // Setups
  protected readonly setups = signal<SetupAdmin[]>([]);
  protected readonly loadingSetups = signal(false);
  protected readonly busySetup = signal<string | null>(null);

  constructor() { this.loadBookings(); }

  switchTab(t: 'bookings' | 'setups'): void {
    this.tab.set(t);
    if (t === 'setups' && this.setups().length === 0) this.loadSetups();
  }

  // ---- Bookings ----
  loadBookings(): void {
    this.loadingBookings.set(true); this.error.set(null);
    this.resetPanels();
    this.api.bookings(this.statusFilter).subscribe({
      next: (list) => { this.bookings.set(list); this.loadingBookings.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loadingBookings.set(false); },
    });
  }

  openApprove(b: AdminBooking): void {
    this.resetPanels();
    this.expandedRef.set(b.reference);
    this.api.assignableSetups(b.reference).subscribe({
      next: (codes) => this.assignable.set(codes),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  toggleSetup(code: string, quantity: number): void {
    const next = new Set(this.selected());
    if (next.has(code)) next.delete(code);
    else if (next.size < quantity) next.add(code);
    this.selected.set(next);
  }
  isSelected(code: string): boolean { return this.selected().has(code); }

  confirmApprove(b: AdminBooking): void {
    const codes = [...this.selected()];
    if (codes.length !== b.quantity) return;
    this.busyRef.set(b.reference);
    this.api.approve(b.reference, codes).subscribe({
      next: () => { this.busyRef.set(null); this.loadBookings(); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.busyRef.set(null); },
    });
  }

  openReject(b: AdminBooking): void { this.resetPanels(); this.rejectingRef.set(b.reference); this.rejectReason = ''; }

  confirmReject(b: AdminBooking): void {
    this.busyRef.set(b.reference);
    this.api.reject(b.reference, this.rejectReason).subscribe({
      next: () => { this.busyRef.set(null); this.loadBookings(); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.busyRef.set(null); },
    });
  }

  private resetPanels(): void {
    this.expandedRef.set(null); this.rejectingRef.set(null);
    this.assignable.set([]); this.selected.set(new Set());
  }

  // ---- Setups ----
  loadSetups(): void {
    this.loadingSetups.set(true); this.error.set(null);
    this.api.setups().subscribe({
      next: (list) => { this.setups.set(list); this.loadingSetups.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loadingSetups.set(false); },
    });
  }

  toggleMaintenance(s: SetupAdmin): void {
    const next = s.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    this.busySetup.set(s.code);
    this.api.setSetupStatus(s.code, next).subscribe({
      next: (updated) => {
        this.setups.update((list) => list.map((x) => (x.code === updated.code ? updated : x)));
        this.busySetup.set(null);
      },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.busySetup.set(null); },
    });
  }

  statusClass(status: string): string {
    if (['CONFIRMED', 'COMPLETED', 'ACTIVE', 'CHECKED_IN'].includes(status)) return 'status--available';
    if (['REJECTED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(status)) return 'status--full';
    return 'status--soon';
  }
  label(s: string): string { return s.replace(/_/g, ' ').toLowerCase(); }
}
