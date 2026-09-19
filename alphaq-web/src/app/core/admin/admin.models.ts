/** Mirrors backend admin DTOs. */
export interface AdminBooking {
  reference: string;
  username: string;
  platform: string;
  date: string;
  start: string;
  end: string;
  quantity: number;
  participants: number;
  dayPass: boolean;
  totalInr: number;
  status: string;
  assignedSetups: string[];
  decidedBy: string | null;
  decisionReason: string | null;
  createdAt: string;
}

export interface SetupAdmin {
  id: number;
  code: string;
  platform: string;
  status: string;          // AVAILABLE | MAINTENANCE
  capacityPlayers: number;
}
