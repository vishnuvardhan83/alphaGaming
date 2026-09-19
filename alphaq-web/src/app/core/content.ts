/**
 * Static site content for the AlphaQ public landing page.
 *
 * DATA NOTE (master prompt §18 — no fake functionality):
 * These are placeholder/illustrative values sourced from the blueprint. Prices,
 * availability and game/food catalogues MUST move to backend APIs once they
 * exist (see docs/REQUIREMENT-TRACEABILITY.md). Nothing here simulates a real
 * booking, payment, login or notification.
 */

export interface NavLink { label: string; fragment: string; }
export interface PriceTier { label: string; price: number; unit: string; }
export interface PlatformPricing {
  key: 'pc' | 'ps5';
  name: string;
  tagline: string;
  capacity: string;
  icon: string;
  tiers: PriceTier[];
  note: string;
  featured?: boolean;
}
export interface GameCard { title: string; platform: string[]; tags: string[]; }
export interface FeaturePoint { icon: string; title: string; body: string; }
export interface FoodItem { name: string; category: string; price: number; }
export interface Tournament { game: string; format: string; date: string; prize: string; status: 'open' | 'soon' | 'full'; }
export interface Review { name: string; handle: string; rating: number; body: string; }
export interface Stat { value: string; label: string; }

export const BRAND = {
  name: 'AlphaQ',
  full: 'AlphaQ Gaming',
  tagline: 'Play beyond limits',
  city: 'Indore, Madhya Pradesh',
  est: '2026',
  hours: 'Tue–Sun · 11:00 AM – 8:00 PM',
  closed: 'Closed Mondays',
  phone: '+91 00000 00000',      // TODO: replace with real number before launch
  whatsapp: '+91 00000 00000',   // TODO: real business WhatsApp
  email: 'hello@alphaq.gg',      // TODO: real sender
  instagram: 'alphaq.gaming',    // TODO: real handle
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Setups', fragment: 'battlestation' },
  { label: 'Pricing', fragment: 'pricing' },
  { label: 'Games', fragment: 'games' },
  { label: 'Food', fragment: 'food' },
  { label: 'Events', fragment: 'tournaments' },
  { label: 'Visit', fragment: 'visit' },
];

/** Illustrative live counts — replaced by GET /api/availability later. */
export const AVAILABILITY = {
  pcAvailable: 6, pcTotal: 10,
  ps5Available: 2, ps5Total: 3,
  openUntil: '8 PM',
};

export const PRICING: PlatformPricing[] = [
  {
    key: 'pc',
    name: 'Gaming PC',
    tagline: 'High-refresh esports rigs · one gamer per PC',
    capacity: '10 setups',
    icon: 'bi-pc-display',
    tiers: [
      { label: '30 minutes', price: 50, unit: '30 min' },
      { label: 'Per hour', price: 100, unit: 'hour' },
      { label: 'Full-day pass', price: 500, unit: 'day' },
    ],
    note: 'Low-ping internet, mechanical keyboards and pro peripherals.',
  },
  {
    key: 'ps5',
    name: 'PlayStation 5',
    tagline: 'Big-TV couch lounge · up to 4 players per console',
    capacity: '3 setups',
    icon: 'bi-playstation',
    featured: true,
    tiers: [
      { label: '30 minutes', price: 60, unit: '30 min' },
      { label: 'Per hour', price: 120, unit: 'hour' },
      { label: 'Full-day pass', price: 600, unit: 'day' },
    ],
    note: 'Price is per console and unchanged for 1–4 players.',
  },
];

export const FEATURES: FeaturePoint[] = [
  { icon: 'bi-cpu', title: 'High-end hardware', body: 'Performance-tuned rigs and PS5s, maintained and clean, ready for competitive play.' },
  { icon: 'bi-wifi', title: 'Low-ping internet', body: 'Fast, stable connections built for Valorant, CS and online ranked grinding.' },
  { icon: 'bi-controller', title: 'PS5 couch lounge', body: 'Large TV, comfortable seating and speakers — up to four friends per console.' },
  { icon: 'bi-stars', title: 'Clean & family-friendly', body: 'A welcoming arena for students, friends, families and birthday groups.' },
];

export const GAMES: GameCard[] = [
  { title: 'Valorant', platform: ['PC'], tags: ['Competitive', 'FPS'] },
  { title: 'Counter-Strike 2', platform: ['PC'], tags: ['Competitive', 'FPS'] },
  { title: 'Dota 2', platform: ['PC'], tags: ['MOBA', 'Multiplayer'] },
  { title: 'GTA V', platform: ['PC'], tags: ['Open world', 'Casual'] },
  { title: 'EA FC 25', platform: ['PS5'], tags: ['Sports', 'Couch'] },
  { title: 'Mortal Kombat 1', platform: ['PS5'], tags: ['Fighting', 'Couch'] },
];

export const FOOD: FoodItem[] = [
  { name: 'Cold coffee', category: 'Drinks', price: 90 },
  { name: 'Energy cooler', category: 'Drinks', price: 70 },
  { name: 'Peri-peri fries', category: 'Snacks', price: 120 },
  { name: 'Loaded nachos', category: 'Snacks', price: 150 },
  { name: 'Veg maggi bowl', category: 'Meals', price: 80 },
  { name: 'Alpha combo', category: 'Combos', price: 220 },
];

export const TOURNAMENTS: Tournament[] = [
  { game: 'Valorant', format: '5v5 · Best of 3', date: 'Sat, 27 Sep', prize: '₹10,000 pool', status: 'open' },
  { game: 'Counter-Strike 2', format: '5v5 · Single elim', date: 'Sun, 12 Oct', prize: '₹8,000 pool', status: 'soon' },
];

export const REVIEWS: Review[] = [
  { name: 'Rohit K.', handle: 'verified visit', rating: 5, body: 'Best rigs in Indore, hands down. Ping is unreal and the place is spotless.' },
  { name: 'Aisha M.', handle: 'verified visit', rating: 5, body: 'Booked the PS5 lounge for four of us. Comfortable couch, great TV, fun night.' },
  { name: 'Dev P.', handle: 'verified visit', rating: 4, body: 'Food to your seat is such a nice touch. Day pass is great value for a full grind.' },
];

export const STATS: Stat[] = [
  { value: '13', label: 'Battlestations' },
  { value: '<20ms', label: 'Avg. ping' },
  { value: '4', label: 'Players / PS5' },
  { value: '6', label: 'Days a week' },
];

/** Clickable hardware hotspots for the interactive battlestation (blueprint §03). */
export const HOTSPOTS: FeaturePoint[] = [
  { icon: 'bi-display', title: 'Display', body: 'High-refresh monitor tuned for fast-paced competitive titles.' },
  { icon: 'bi-cpu', title: 'PC cabinet', body: 'Performance GPU/CPU pairing — exact specs verified before publishing.' },
  { icon: 'bi-headphones', title: 'Headset', body: 'Positional audio so you hear footsteps before you see them.' },
  { icon: 'bi-keyboard', title: 'Keyboard', body: 'Mechanical switches with fast, consistent actuation.' },
  { icon: 'bi-mouse', title: 'Mouse', body: 'Precision esports sensor with a light, responsive body.' },
  { icon: 'bi-wifi', title: 'Network', body: 'Low-ping wired connection for stable online ranked play.' },
];
