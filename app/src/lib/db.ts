// Data layer over the AlphaQ REST API: catalogue (games/food/tournaments),
// customer activity (food orders, registrations, rewards), reviews, gallery,
// and admin settings. Function names are kept stable so pages don't churn.

import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "./api";

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
  createdAt: number;
}
export type NewTournament = Omit<Tournament, "id" | "createdAt">;

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  playerName: string;
  teamName: string;
  createdAt: number;
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
  whatsapp: string;
  phone: string;
  email: string;
  instagram: string;
  city: string;
  hours: string;
  upiId: string;
  upiName: string;
  arenaImage: string; // URL of the admin-managed "Inside the arena" photo ("" = use bundled default)
  appBg: string; // URL of the dashboard/app background image ("" = use bundled default)
  pcCount: string; // total gaming PCs (string; parse with Number)
  ps5Count: string; // total PS5 setups
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
