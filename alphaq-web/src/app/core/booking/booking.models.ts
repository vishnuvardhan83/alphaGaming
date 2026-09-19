/** Mirrors backend booking DTOs (com.alphaq.gaming.booking.dto). */
export interface Availability {
  platform: string;
  date: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
  available: number;
}

export interface CreateBookingRequest {
  platform: string;
  date: string;         // YYYY-MM-DD
  start: string;        // HH:mm
  durationMin: number;
  quantity: number;
  participants: number;
  dayPass: boolean;
}

export interface Booking {
  reference: string;
  platform: string;
  date: string;
  start: string;
  end: string;
  durationMin: number;
  dayPass: boolean;
  quantity: number;
  participants: number;
  unitPriceInr: number;
  totalInr: number;
  status: string;
  holdExpiresAt: string | null;
  holdSecondsRemaining: number;
  assignedSetups: string[];
  decisionReason: string | null;
}
