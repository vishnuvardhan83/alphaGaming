import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Nav } from '../../shared/nav/nav';
import { Footer } from '../../shared/footer/footer';
import { RevealDirective } from '../../shared/reveal.directive';
import { Hero } from './sections/hero/hero';
import { CatalogueService } from '../../core/catalogue/catalogue.service';
import { GameCard, PlatformPricing } from '../../core/catalogue/catalogue.models';
import { apiErrorMessage } from '../../core/auth/api-error';
import { BRAND, FEATURES, FOOD, TOURNAMENTS, REVIEWS, STATS, HOTSPOTS } from '../../core/content';

/** Presentational decoration the API doesn't carry, keyed by platform. */
interface Decor { icon: string; tagline: string; note: string; featured: boolean; }
const DECOR: Record<string, Decor> = {
  PC: {
    icon: 'bi-pc-display',
    tagline: 'High-refresh esports rigs · one gamer per PC',
    note: 'Low-ping internet, mechanical keyboards and pro peripherals.',
    featured: false,
  },
  PS5: {
    icon: 'bi-playstation',
    tagline: 'Big-TV couch lounge · up to 4 players per console',
    note: 'Price is per console and unchanged for 1–4 players.',
    featured: true,
  },
};
const UNIT: Record<string, string> = { MIN30: '30 min', HOUR: 'hour', DAY: 'day' };

export interface PricingView {
  platform: string; name: string; capacity: string; icon: string; tagline: string;
  note: string; featured: boolean;
  tiers: { label: string; price: number; unit: string; best: boolean }[];
}
export interface GameView { id: number; title: string; platforms: string[]; tags: string[]; }

@Component({
  selector: 'aq-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Nav, Footer, Hero, RevealDirective, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly catalogue = inject(CatalogueService);

  protected readonly brand = BRAND;
  protected readonly features = FEATURES;
  protected readonly food = FOOD;
  protected readonly tournaments = TOURNAMENTS;
  protected readonly reviews = REVIEWS;
  protected readonly stats = STATS;
  protected readonly hotspots = HOTSPOTS;

  // ---- Pricing (from API) ----
  protected readonly pricing = signal<PricingView[]>([]);
  protected readonly pricingLoading = signal(true);
  protected readonly pricingError = signal<string | null>(null);

  // ---- Games (from API) ----
  private readonly allGames = signal<GameView[]>([]);
  protected readonly gamesLoading = signal(true);
  protected readonly gamesError = signal<string | null>(null);
  protected readonly gameFilters = ['All', 'PC', 'PS5', 'Competitive', 'Casual'] as const;
  protected readonly gameFilter = signal<string>('All');
  protected readonly games = computed(() => {
    const f = this.gameFilter();
    const list = this.allGames();
    if (f === 'All') return list;
    return list.filter((g) => g.platforms.includes(f) || g.tags.includes(f));
  });

  constructor() {
    this.loadPricing();
    this.loadGames();
  }

  private loadPricing(): void {
    this.pricingLoading.set(true);
    this.catalogue.pricing().subscribe({
      next: (data) => { this.pricing.set(data.map((p) => this.toPricingView(p))); this.pricingLoading.set(false); },
      error: (err) => { this.pricingError.set(apiErrorMessage(err)); this.pricingLoading.set(false); },
    });
  }

  private loadGames(): void {
    this.gamesLoading.set(true);
    this.catalogue.games().subscribe({
      next: (data) => { this.allGames.set(data.map((g) => this.toGameView(g))); this.gamesLoading.set(false); },
      error: (err) => { this.gamesError.set(apiErrorMessage(err)); this.gamesLoading.set(false); },
    });
  }

  private toPricingView(p: PlatformPricing): PricingView {
    const d = DECOR[p.platform] ?? { icon: 'bi-controller', tagline: '', note: '', featured: false };
    return {
      platform: p.platform, name: p.name, capacity: p.capacity,
      icon: d.icon, tagline: d.tagline, note: d.note, featured: d.featured,
      tiers: p.tiers.map((t, i) => ({
        label: t.label, price: t.priceInr, unit: UNIT[t.tierCode] ?? '', best: i === p.tiers.length - 1,
      })),
    };
  }

  private toGameView(g: GameCard): GameView {
    const platforms = g.platform === 'BOTH' ? ['PC', 'PS5'] : [g.platform];
    return { id: g.id, title: g.title, platforms, tags: g.tags };
  }

  setFilter(f: string): void { this.gameFilter.set(f); }
  retryPricing(): void { this.pricingError.set(null); this.loadPricing(); }
  retryGames(): void { this.gamesError.set(null); this.loadGames(); }

  stars(n: number): unknown[] { return Array.from({ length: n }); }
}
