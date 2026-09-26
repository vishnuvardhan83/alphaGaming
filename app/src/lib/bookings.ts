import { apiGet, apiPost } from "./api";

export type BookingStatus =
  | "awaiting_payment"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export interface Booking {
  id: string;
  userId: string;
  phone: string;
  platform: "pc" | "ps5" | "racing";
  date: string; // YYYY-MM-DD
  slot: string; // HH:mm
  durationLabel: string;
  price: number;
  players: number;
  status: BookingStatus;
  upiRef?: string | null;
  decisionReason?: string | null;
  createdAt: number;
}

export type NewBooking = {
  userId?: string;
  phone?: string;
  platform: "pc" | "ps5" | "racing";
  date: string;
  slot: string;
  durationLabel: string;
  price: number;
  players: number;
};

export const SETUP_TOTALS = { pc: 20, ps5: 6, racing: 2 } as const;

/** Friendly labels for the extended status set. */
export const STATUS_LABEL: Record<BookingStatus, string> = {
  awaiting_payment: "Awaiting payment",
  pending: "Pending approval",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export async function createBooking(data: NewBooking): Promise<Booking> {
  return apiPost<Booking>("/bookings", data);
}

/** Submit the UPI reference the customer paid with → moves to pending approval. */
export async function payBooking(id: string, upiRef: string): Promise<Booking> {
  return apiPost<Booking>(`/bookings/${id}/pay`, { upiRef });
}

export async function listMyBookings(_userId?: string): Promise<Booking[]> {
  return apiGet<Booking[]>("/bookings/mine");
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking | void> {
  return apiPost<Booking>(`/admin/bookings/${id}/cancel`, { reason }).catch(() =>
    apiPost<Booking>(`/bookings/${id}/cancel`, { reason }),
  );
}

/* ---- admin ---- */

export async function listAllBookings(status?: BookingStatus): Promise<Booking[]> {
  return apiGet<Booking[]>(`/admin/bookings${status ? `?status=${status}` : ""}`);
}

export async function approveBooking(id: string): Promise<Booking> {
  return apiPost<Booking>(`/admin/bookings/${id}/approve`);
}

export async function rejectBooking(id: string, reason: string): Promise<Booking> {
  return apiPost<Booking>(`/admin/bookings/${id}/reject`, { reason });
}

export async function completeBooking(id: string): Promise<Booking> {
  return apiPost<Booking>(`/admin/bookings/${id}/complete`);
}

export async function updateBookingUpiRef(id: string, upiRef: string): Promise<Booking> {
  return apiPost<Booking>(`/admin/bookings/${id}/upi-ref`, { upiRef });
}

/** Compatibility shim for older call sites that set a status directly. */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (status === "confirmed") await approveBooking(id);
  else if (status === "rejected") await rejectBooking(id, "Rejected by staff");
  else if (status === "completed") await completeBooking(id);
  else if (status === "cancelled") await cancelBooking(id);
}

/** Count of active bookings for a platform on a date (for availability chips). */
export async function countBookings(platform: "pc" | "ps5" | "racing", date: string): Promise<number> {
  const r = await apiGet<{ booked: number }>(
    `/availability?platform=${platform}&date=${date}`,
  );
  return r.booked;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Minutes of play a duration label grants (day pass runs until close, 20:00). */
function durationMinutes(label: string, slot: string): number {
  const l = label.toLowerCase();
  if (l.includes("day")) {
    const [h, m] = slot.split(":").map(Number);
    return Math.max(0, 20 * 60 - (h * 60 + (m || 0)));
  }
  if (l.includes("30")) return 30;
  return 60;
}

export function setupLabel(b: Pick<Booking, "platform" | "slot">): string {
  return `${b.platform.toUpperCase()} · ${b.slot}`;
}

export function isBookingActiveNow(b: Booking, now = new Date()): boolean {
  if (b.status === "cancelled" || b.status === "rejected") return false;
  if (b.date !== todayISO()) return false;
  const [h, m] = b.slot.split(":").map(Number);
  const start = new Date(now);
  start.setHours(h, m || 0, 0, 0);
  const end = new Date(start.getTime() + durationMinutes(b.durationLabel, b.slot) * 60_000);
  return now >= start && now <= end;
}

/** A booking you can order food against: any of today's live (not
 * cancelled/rejected/completed) bookings — you're a seated customer today. */
export function isBookingOrderable(b: Booking): boolean {
  if (b.status === "cancelled" || b.status === "rejected" || b.status === "completed")
    return false;
  return b.date === todayISO();
}

export async function getActiveBooking(_userId?: string): Promise<Booking | null> {
  const bookings = await listMyBookings();
  // Prefer a booking whose exact time-window is live right now; otherwise fall
  // back to any live booking for today so seated customers can still order.
  return (
    bookings.find((b) => isBookingActiveNow(b)) ??
    bookings.find((b) => isBookingOrderable(b)) ??
    null
  );
}
