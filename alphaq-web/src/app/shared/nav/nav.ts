import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, NAV_LINKS } from '../../core/content';
import { AuthService } from '../../core/auth/auth.service';
import { AvailabilityStripService } from '../../core/booking/availability-strip.service';

@Component({
  selector: 'aq-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  protected readonly brand = BRAND;
  protected readonly links = NAV_LINKS;
  protected readonly strip = inject(AvailabilityStripService);

  protected readonly auth = inject(AuthService);
  protected readonly isAdmin = computed(() => {
    const r = this.auth.user()?.roles ?? [];
    return r.includes('OWNER') || r.includes('ADMIN');
  });

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  toggleMenu(): void { this.menuOpen.update((v) => !v); }
  closeMenu(): void { this.menuOpen.set(false); }
  logout(): void { this.auth.logout(); this.closeMenu(); }
}
