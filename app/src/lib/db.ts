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
  upiPhone?: string;
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
  email: string | null;
  role: string;
  rewardPoints: number;
  blocked?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: number | null;
  createdAt?: number;
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
    if (Array.isArray(remote)) return remote;
  } catch {
    /* fallback to stored */
  }

  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LeaderboardEntry[];
        if (Array.isArray(parsed)) {
          return game ? parsed.filter((p) => !p.game || p.game === game) : parsed;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return [];
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
  email: string;
  password: string;
  role: "admin" | "staff" | "customer";
}) => apiPost<AdminUser>("/admin/users", data);
export const setUserRole = (userId: number, role: "admin" | "staff" | "customer") =>
  apiPost<AdminUser>(`/admin/users/${userId}/role`, { role });
export const setUserBlocked = (userId: number, blocked: boolean) =>
  apiPost<AdminUser>(`/admin/users/${userId}/block`, { blocked });
export const deleteUser = (userId: number) =>
  apiDelete(`/admin/users/${userId}`);

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

/* ------------------------------------------------------------- admin password -- */

export const adminUpdateUserPassword = (userId: number, password: string) =>
  apiPost<{ ok: boolean; message: string; user: AdminUser }>(`/admin/users/${userId}/password`, {
    password,
  });

/* ----------------------------------------------------------- rewards redeem -- */

export interface RedeemResult {
  ok: boolean;
  voucherCode: string;
  rewardType: string;
  itemTitle: string;
  pointsRedeemed: number;
  remainingPoints: number;
  reason: string;
  message: string;
}

export const redeemRewards = (points: number, rewardType: string = "discount_voucher") =>
  apiPost<RedeemResult>("/rewards/redeem", { points, rewardType });

/* --------------------------------------------------------------- crypto tools -- */

export interface HashMeta {
  valid: boolean;
  algorithm: string;
  version?: string | null;
  rounds?: number | null;
  salt?: string;
  length: number;
  sample?: string;
  error?: string;
}

export const cryptoVerifyPassword = (password: string, hash: string) =>
  apiPost<{ match: boolean; hashMeta?: HashMeta; error?: string }>("/admin/crypto/verify-password", {
    password,
    hash,
  });

export const cryptoHashPassword = (password: string, rounds: number = 10) =>
  apiPost<{ plain: string; hash: string; rounds: number; hashMeta: HashMeta }>(
    "/admin/crypto/hash-password",
    { password, rounds },
  );

export const cryptoInspectHash = (hash: string) =>
  apiPost<HashMeta>("/admin/crypto/inspect-hash", { hash });

export const cryptoCheckUserPassword = (identifier: string, password: string) =>
  apiPost<{
    match: boolean;
    user: { id: number; name: string; phone: string; email: string; role: string; emailVerified: boolean; blocked: boolean };
    passwordHash: string;
    hashMeta: HashMeta;
  }>("/admin/crypto/check-user-password", { identifier, password });

export const cryptoInspectOtp = (email: string, otp: string = "") =>
  apiPost<{
    found: boolean;
    email: string;
    verifications: Array<{
      id: number;
      purpose: string;
      createdAt: number;
      expiresAt: number;
      expired: boolean;
      attemptCount: number;
      verifiedAt: number | null;
      otpHash: string;
      testedOtpMatch: boolean | null;
      computedHmac: string | null;
    }>;
  }>("/admin/crypto/inspect-otp", { email, otp });

/* ------------------------------------------------------------- database admin -- */

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  default: any;
  extra?: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: TableColumn[];
}

export interface TableRowsResult {
  tableName: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  columns: TableColumn[];
  rows: Record<string, any>[];
}

export interface SqlQueryResult {
  type: "select" | "mutation";
  columns?: string[];
  rows?: Record<string, any>[];
  rowCount?: number;
  changes?: number;
  lastInsertRowid?: number | string;
  durationMs: number;
  message?: string;
}

export const listDbTables = () =>
  apiGet<{ dbKind: string; tables: TableInfo[] }>("/admin/database/tables");

export const getDbTableRows = (
  tableName: string,
  params: { page?: number; limit?: number; sortBy?: string; sortDir?: string } = {},
) => {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.sortDir) q.set("sortDir", params.sortDir);
  return apiGet<TableRowsResult>(`/admin/database/table/${encodeURIComponent(tableName)}?${q.toString()}`);
};

export const executeDbQuery = (sql: string) =>
  apiPost<SqlQueryResult>("/admin/database/query", { sql });

export const insertDbTableRow = (tableName: string, row: Record<string, any>) =>
  apiPost<{ ok: boolean; lastInsertRowid: any; changes: number }>(
    `/admin/database/table/${encodeURIComponent(tableName)}/insert`,
    { row },
  );

export const deleteDbTableRow = (tableName: string, primaryKey: string, id: any) =>
  apiDelete(`/admin/database/table/${encodeURIComponent(tableName)}/row?primaryKey=${encodeURIComponent(primaryKey)}&id=${encodeURIComponent(id)}`);

/* ---------------------------------------------------------- railway variables -- */

export interface RailwayVariablesResult {
  source: string;
  projectId: string;
  environmentId: string;
  serviceId: string;
  variables: Record<string, string>;
}

export const getRailwayVariables = () =>
  apiGet<RailwayVariablesResult>("/admin/railway/variables");

export const setRailwayVariable = (name: string, value: string) =>
  apiPost<{ ok: boolean; name: string; value: string; railwayUpdated: boolean; methodUsed: string; message: string }>(
    "/admin/railway/variables",
    { name, value },
  );

export const deleteRailwayVariable = (name: string) =>
  apiDelete(`/admin/railway/variables/${encodeURIComponent(name)}`);

/* --------------------------------------------------- notification settings -- */

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  customer_email_otp_enabled: boolean;
  customer_sms_otp_enabled: boolean;
  booking_email_enabled: boolean;
  booking_sms_enabled: boolean;
  admin_booking_email_enabled: boolean;
  admin_booking_sms_enabled: boolean;
  admin_email: string;
  admin_phone: string;
  email_provider: string;
  sms_provider: string;
  otp_length: number;
  otp_expiry_minutes: number;
  otp_max_attempts: number;
  resend_cooldown_seconds: number;
}

export interface ProviderSecretStatus {
  email: {
    smtp: {
      configured: boolean;
      masked: boolean;
      host: string;
      port: number;
      user: string;
      secretMasked: string;
    };
    emailjs: {
      configured: boolean;
      masked: boolean;
      serviceId: string;
      secretMasked: string;
    };
  };
  sms: {
    msg91: {
      configured: boolean;
      masked: boolean;
      senderId: string;
      secretMasked: string;
    };
    twilio: {
      configured: boolean;
      masked: boolean;
      fromNumber: string;
      secretMasked: string;
    };
    sns: {
      configured: boolean;
      masked: boolean;
      secretMasked: string;
    };
  };
  renderConfigNotice: string;
}

export interface NotificationSettingsResponse {
  settings: NotificationSettings;
  providerStatus: ProviderSecretStatus;
}

export interface TestNotificationResult {
  success: boolean;
  message: string;
  provider: string;
  recipient: string;
  mocked?: boolean;
  messageId?: string;
}

export const getNotificationSettings = () =>
  apiGet<NotificationSettingsResponse>("/admin/notifications/settings");

export const updateNotificationSettings = (data: Partial<NotificationSettings>) =>
  apiPut<NotificationSettingsResponse>("/admin/notifications/settings", data);

export const sendTestEmail = (to?: string) =>
  apiPost<TestNotificationResult>("/admin/notifications/test-email", { to });

export const sendTestSms = (to?: string) =>
  apiPost<TestNotificationResult>("/admin/notifications/test-sms", { to });

