// Data layer over the AlphaQ REST API: catalogue (games/food/tournaments),
// customer activity (food orders, registrations, rewards), reviews, gallery,
// and admin settings. Function names are kept stable so pages don't churn.

import { apiGet, apiPost, apiPut, apiDelete, apiUpload, apiPatch } from "./api";

/* ----------------------------------------------------------------- types -- */

export interface Game {
  id: string;
  title: string;
  platform: string[];
  tags: string[];
  active: boolean;
  sortOrder: number;
}
export type NewGame = Omit<Game, "id">;

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string; // URL ("" = no photo)
  active: boolean;
  sortOrder: number;
}
export type NewFoodItem = Omit<FoodItem, "id">;

export type TournamentStatus = "open" | "soon" | "full" | "closed";
export interface Tournament {
  id: string;
  game: string;
  format: string;
  date: string;
  prize: string;
  status: TournamentStatus;
  description: string;
  capacity: number;
  registeredCount?: number;
  createdAt: number;
}
export type NewTournament = Omit<Tournament, "id" | "createdAt">;

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  playerName: string;
  teamName: string;
  phone?: string;
  createdAt: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  team: string;
  points: number;
  game?: string;
  tag?: string;
}

export type FoodOrderStatus = "placed" | "preparing" | "delivered" | "cancelled";
export interface FoodOrderLine {
  foodId: string;
  name: string;
  price: number;
  qty: number;
}
export interface FoodOrder {
  id: string;
  userId: string;
  phone: string;
  bookingId: string;
  setupLabel: string;
  items: FoodOrderLine[];
  total: number;
  payWith: "counter" | "points" | "online";
  status: FoodOrderStatus;
  createdAt: number;
}

export interface Review {
  id: string;
  name: string;
  handle: string;
  rating: number;
  body: string;
  verified: boolean;
  approved: boolean;
  createdAt: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  sortOrder: number;
}

export interface Settings {
  brandName: string;
  whatsapp?: string; // kept for backward compat but no longer displayed in UI
  phone: string;
  email: string;
  instagram: string;
  city: string;
  address: string; // Full address or Google Maps link/coordinates for the venue
  hours: string;
  upiId: string;
  upiName: string;
  arenaImage: string; // URL of the admin-managed "Inside the arena" photo ("" = use bundled default)
  appBg: string; // URL of the dashboard/app background image ("" = use bundled default)
  pcCount: string; // total gaming PCs (string; parse with Number)
  ps5Count: string; // total PS5 setups
  // Pricing tiers for Gaming PC (INR amounts as strings)
  pcPrice30m: string; // 30-minute price
  pcPrice1h: string;  // Per hour price
  pcPriceDay: string; // Full-day pass price
  // Pricing tiers for PS5
  ps5Price30m: string;
  ps5Price1h: string;
  ps5PriceDay: string;
  // Stats shown in the "Why AlphaQ" section
  statSetups: string;   // e.g. "13"
  statRefresh: string;  // e.g. "240Hz"
  statPing: string;     // e.g. "<20ms"
  statTitles: string;   // e.g. "7+"
}

export interface AdminUser {
  id: number;
  phone: string;
  name: string;
  role: string;
  rewardPoints: number;
}

/* ----------------------------------------------------------------- games -- */

export const listGames = (activeOnly = false) =>
  apiGet<Game[]>(`/games${activeOnly ? "?active=1" : ""}`);
export const createGame = (data: NewGame) => apiPost<Game>("/admin/games", data);
export const updateGame = (id: string, data: Partial<NewGame>) =>
  apiPut<Game>(`/admin/games/${id}`, data);
export const deleteGame = (id: string) => apiDelete(`/admin/games/${id}`);

/* ------------------------------------------------------------------ food -- */

export const listFood = (activeOnly = false) =>
  apiGet<FoodItem[]>(`/food${activeOnly ? "?active=1" : ""}`);
export const createFood = (data: NewFoodItem) => apiPost<FoodItem>("/admin/food", data);
export const updateFood = (id: string, data: Partial<NewFoodItem>) =>
  apiPut<FoodItem>(`/admin/food/${id}`, data);
export const deleteFood = (id: string) => apiDelete(`/admin/food/${id}`);

/* ----------------------------------------------------------- tournaments -- */

export const listTournaments = () => apiGet<Tournament[]>("/tournaments");
export const createTournament = (data: NewTournament) =>
  apiPost<Tournament>("/admin/tournaments", data);
export const updateTournament = (id: string, data: Partial<NewTournament>) =>
  apiPut<Tournament>(`/admin/tournaments/${id}`, data);
export const deleteTournament = (id: string) => apiDelete(`/admin/tournaments/${id}`);

export const registerForTournament = (input: {
  tournamentId: string;
  userId?: string;
  phone?: string;
  playerName: string;
  teamName: string;
}) =>
  apiPost(`/tournaments/${input.tournamentId}/register`, {
    playerName: input.playerName,
    teamName: input.teamName,
  });

export const listMyRegistrations = (_userId?: string) =>
  apiGet<TournamentRegistration[]>("/registrations/mine");

export const listTournamentRegistrations = (tournamentId: string) =>
  apiGet<TournamentRegistration[]>(`/tournaments/${encodeURIComponent(tournamentId)}/registrations`);

export const deleteTournamentRegistration = (id: string) =>
  apiDelete(`/admin/registrations/${encodeURIComponent(id)}`);

/* ---------------------------------------------------------- leaderboard -- */

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lb-1", rank: 1, team: "Team Nova", points: 2480, game: "Valorant" },
  { id: "lb-2", rank: 2, team: "Frag Society", points: 2190, game: "Valorant" },
  { id: "lb-3", rank: 3, team: "Indore Aces", points: 1905, game: "Valorant" },
  { id: "lb-4", rank: 4, team: "Outplay Esports", points: 1720, game: "Counter-Strike 2" },
  { id: "lb-5", rank: 5, team: "Velocity IX", points: 1540, game: "Counter-Strike 2" },
];

const LEADERBOARD_STORAGE_KEY = "aq_season_leaderboard";

export async function listLeaderboard(game?: string): Promise<LeaderboardEntry[]> {
  try {
    const remote = await apiGet<LeaderboardEntry[]>(`/leaderboard${game ? `?game=${encodeURIComponent(game)}` : ""}`);
    if (Array.isArray(remote) && remote.length > 0) return remote;
  } catch {
    /* fallback to stored / seed */
  }

  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LeaderboardEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return game ? parsed.filter((p) => !p.game || p.game === game) : parsed;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return game ? SEED_LEADERBOARD.filter((p) => !p.game || p.game === game) : SEED_LEADERBOARD;
}

export async function saveLeaderboard(entries: LeaderboardEntry[]): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  }
  try {
    await apiPost("/admin/leaderboard", { entries });
  } catch {
    /* non-blocking */
  }
}

/* ------------------------------------------------------------ food orders -- */

export const createFoodOrder = (input: {
  userId?: string;
  phone?: string;
  bookingId: string;
  setupLabel: string;
  items: FoodOrderLine[];
  payWith?: "counter" | "points" | "online";
}) =>
  apiPost<FoodOrder>("/food-orders", {
    bookingId: input.bookingId,
    setupLabel: input.setupLabel,
    items: input.items,
    payWith: input.payWith ?? "counter",
  });

export const listMyFoodOrders = (_userId?: string) =>
  apiGet<FoodOrder[]>("/food-orders/mine");
export const listAllFoodOrders = () => apiGet<FoodOrder[]>("/admin/food-orders");
export const updateFoodOrderStatus = (id: string, status: FoodOrderStatus) =>
  apiPut(`/admin/food-orders/${id}`, { status });

/* --------------------------------------------------------------- reviews -- */

export const listReviews = () => apiGet<Review[]>("/reviews");
export const submitReview = (rating: number, body: string) =>
  apiPost<{ ok: boolean; message: string }>("/reviews", { rating, body });
export const listAllReviews = () => apiGet<Review[]>("/admin/reviews");
export const createReview = (data: {
  name: string;
  handle?: string;
  rating: number;
  body: string;
}) => apiPost<Review>("/admin/reviews", data);
export const setReviewApproved = (id: string, approved: boolean) =>
  apiPut<Review>(`/admin/reviews/${id}`, { approved });
export const deleteReview = (id: string) => apiDelete(`/admin/reviews/${id}`);

/* --------------------------------------------------------------- gallery -- */

export const listGallery = () => apiGet<GalleryImage[]>("/gallery");
export const uploadGalleryImage = (file: File, caption = "") => {
  const form = new FormData();
  form.append("image", file);
  form.append("caption", caption);
  return apiUpload<GalleryImage>("/admin/gallery", form);
};
export const deleteGalleryImage = (id: string) => apiDelete(`/admin/gallery/${id}`);

/* --------------------------------------------------------------- rewards -- */

export interface RewardsInfo {
  points: number;
  ledger: { id: string; delta: number; reason: string; createdAt: number }[];
}
export const getMyRewards = () => apiGet<RewardsInfo>("/rewards/me");

/* -------------------------------------------------------------- settings -- */

export const getSettings = () => apiGet<Settings>("/settings");
export const getAdminSettings = () => apiGet<Record<string, string>>("/admin/settings");
export const updateSettings = (data: Partial<Settings>) =>
  apiPut<Record<string, string>>("/admin/settings", data);

/** Upload/replace the "Inside the arena" photo shown on the landing page. */
export const uploadArenaImage = (file: File) => {
  const form = new FormData();
  form.append("image", file);
  return apiUpload<{ arenaImage: string }>("/admin/arena-image", form);
};

/** Generic image upload (e.g. a food photo). Returns the served URL. */
export const uploadImage = (file: File) => {
  const form = new FormData();
  form.append("image", file);
  return apiUpload<{ url: string }>("/admin/upload", form);
};

/** Upload/replace the app/dashboard background image. */
export const uploadAppBg = (file: File) => {
  const form = new FormData();
  form.append("image", file);
  return apiUpload<{ appBg: string }>("/admin/app-bg", form);
};

/** Total setups admins have configured (falls back to 10 PC / 3 PS5). */
export async function getSetupCounts(): Promise<{ pc: number; ps5: number }> {
  try {
    const s = await getSettings();
    return {
      pc: Number(s.pcCount) || 10,
      ps5: Number(s.ps5Count) || 3,
    };
  } catch {
    return { pc: 10, ps5: 3 };
  }
}

/* ----------------------------------------------------------------- users -- */

export const listUsers = () => apiGet<AdminUser[]>("/admin/users");
export const adjustReward = (userId: number, delta: number, reason: string) =>
  apiPost<AdminUser>("/admin/rewards", { userId, delta, reason });
export const createUser = (data: {
  phone: string;
  name: string;
  password: string;
  role: "admin" | "customer";
}) => apiPost<AdminUser>("/admin/users", data);
export const setUserRole = (userId: number, role: "admin" | "customer") =>
  apiPost<AdminUser>(`/admin/users/${userId}/role`, { role });

/* --------------------------------------------------------------- group quotes -- */

export interface GroupQuote {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  groupSize: number;
  eventType: "birthday" | "group" | "corporate" | "other";
  preferredDate: string;
  platform: "pc" | "ps5" | "both";
  addFood: boolean;
  addTournament: boolean;
  message: string;
  status: "pending" | "contacted" | "confirmed" | "cancelled";
  createdAt: number;
}

export interface GroupQuoteInput {
  name: string;
  phone: string;
  email?: string;
  groupSize: number;
  eventType: GroupQuote["eventType"];
  preferredDate?: string;
  platform: GroupQuote["platform"];
  addFood: boolean;
  addTournament: boolean;
  message?: string;
}

/** Submit a group/birthday quote request (works for guests + logged-in users). */
export const submitGroupQuote = (input: GroupQuoteInput) =>
  apiPost<GroupQuote>("/group-quotes", input);

/** Admin: list all group quote requests. */
export const listAdminGroupQuotes = () =>
  apiGet<GroupQuote[]>("/admin/group-quotes");

/** Admin: update the status of a group quote. */
export const updateGroupQuoteStatus = (id: string, status: GroupQuote["status"]) =>
  apiPatch<GroupQuote>(`/admin/group-quotes/${id}`, { status });
