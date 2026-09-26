// AlphaQ Gaming — static site content (ported from the existing Angular codebase).

export const BRAND = {
  name: "AlphaQ",
  full: "AlphaQ Gaming",
  tagline: "Play beyond limits",
  city: "Indore, Madhya Pradesh",
  est: "2026",
  hours: "Tue–Sun · 11:00 AM – 8:00 PM",
  closed: "Closed Mondays",
  phone: "+91 00000 00000",
  email: "hello@alphaq.gg",
  instagram: "alphaq.gaming",
};

export interface PriceTier {
  label: string;
  price: number;
  unit: string;
}

export interface PlatformPricing {
  key: "pc" | "ps5" | "racing";
  name: string;
  tagline: string;
  capacity: string;
  tiers: PriceTier[];
  note: string;
  featured?: boolean;
}

export const PRICING: PlatformPricing[] = [
  {
    key: "pc",
    name: "Gaming PC Zone",
    tagline: "High-refresh esports rigs · one gamer per PC",
    capacity: "10 setups",
    featured: true,
    tiers: [
      { label: "30 minutes", price: 50, unit: "30 min" },
      { label: "Per hour", price: 100, unit: "hour" },
      { label: "Full-day pass", price: 500, unit: "day" },
    ],
    note: "Low-ping internet, mechanical keyboards and pro peripherals.",
  },
  {
    key: "ps5",
    name: "PlayStation 5 Zone",
    tagline: "Big-TV couch lounge · up to 4 players per console",
    capacity: "3 setups",
    tiers: [
      { label: "30 minutes", price: 60, unit: "30 min" },
      { label: "Per hour", price: 120, unit: "hour" },
      { label: "Full-day pass", price: 600, unit: "day" },
    ],
    note: "Price is per console and unchanged for 1–4 players.",
  },
  {
    key: "racing",
    name: "Racing Sim Zone",
    tagline: "Pro Direct-Drive Cockpit · Force feedback & load-cell pedals",
    capacity: "2 rigs",
    tiers: [
      { label: "30 minutes", price: 80, unit: "30 min" },
      { label: "Per hour", price: 150, unit: "hour" },
      { label: "Full-day pass", price: 750, unit: "day" },
    ],
    note: "Fanatec direct drive wheel, triple curved displays, haptic pedals.",
  },
];

export interface GameCard {
  title: string;
  platform: string[];
  tags: string[];
}

export const GAMES: GameCard[] = [
  { title: "Valorant", platform: ["PC"], tags: ["Competitive", "FPS"] },
  { title: "Counter-Strike 2", platform: ["PC"], tags: ["Competitive", "FPS"] },
  { title: "Dota 2", platform: ["PC"], tags: ["MOBA", "Multiplayer"] },
  { title: "GTA V", platform: ["PC"], tags: ["Open world", "Casual"] },
  { title: "EA FC 25", platform: ["PS5"], tags: ["Sports", "Couch"] },
  { title: "Mortal Kombat 1", platform: ["PS5"], tags: ["Fighting", "Couch"] },
];

export interface FoodItem {
  name: string;
  category: string;
  price: number;
}

export const FOOD: FoodItem[] = [
  { name: "Cold coffee", category: "Drinks", price: 90 },
  { name: "Energy cooler", category: "Drinks", price: 70 },
  { name: "Peri-peri fries", category: "Snacks", price: 120 },
  { name: "Loaded nachos", category: "Snacks", price: 150 },
  { name: "Veg maggi bowl", category: "Meals", price: 80 },
  { name: "Alpha combo", category: "Combos", price: 220 },
];

// Tournaments are now admin-managed via the admin panel — no hardcoded fallback.
// Interface kept for reference; actual data comes from db.ts listTournaments().
export interface StaticTournament {
  game: string;
  format: string;
  date: string;
  prize: string;
  status: "open" | "soon" | "full";
}

export interface FeaturePoint {
  title: string;
  body: string;
}

export const FEATURES: FeaturePoint[] = [
  { title: "High-end hardware", body: "Performance-tuned rigs and PS5s, maintained and clean, ready for competitive play." },
  { title: "Low-ping internet", body: "Fast, stable connections built for Valorant, CS and online ranked grinding." },
  { title: "PS5 couch lounge", body: "Large TV, comfortable seating and speakers — up to four friends per console." },
  { title: "Clean & family-friendly", body: "A welcoming arena for students, friends, families and birthday groups." },
];

// Reviews are now admin-managed via the Reviews tab in the admin panel.
// The interface is kept for type usage in db.ts.
export interface Review {
  name: string;
  handle: string;
  rating: number;
  body: string;
}
// No hardcoded REVIEWS array — admin adds real reviews via the admin panel.

// Stats are now admin-managed via Settings in the admin panel.
// Fallback values are used if admin hasn't set them yet (see useAdminSettings in landing-content.tsx).

export const HOTSPOTS = [
  { key: "display", title: "Display", body: "High-refresh monitor tuned for fast-paced competitive titles." },
  { key: "cabinet", title: "PC cabinet", body: "Performance GPU/CPU pairing — exact specs verified before publishing." },
  { key: "headset", title: "Headset", body: "Positional audio so you hear footsteps before you see them." },
  { key: "keyboard", title: "Keyboard", body: "Mechanical switches with fast, consistent actuation." },
  { key: "mouse", title: "Mouse", body: "Precision esports sensor with a light, responsive body." },
  { key: "network", title: "Network", body: "Low-ping wired connection for stable online ranked play." },
];

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 11; h < 20; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();


export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
