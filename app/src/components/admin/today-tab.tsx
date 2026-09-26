import { useEffect, useState } from "react";
import {
  Monitor,
  Tv,
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Trophy,
  Users,
  Search,
  Check,
  UtensilsCrossed,
  Sparkles,
  Gauge,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import {
  listAllBookings,
  approveBooking,
  completeBooking,
  setupLabel,
  type Booking,
} from "@/lib/bookings";
import { listTournaments, type Tournament } from "@/lib/db";
import { formatINR } from "@/lib/content";

type StationStatus = "playing" | "reserved" | "available" | "maintenance";

interface Station {
  id: string;
  type: "pc" | "ps5" | "racing";
  status: StationStatus;
  game?: string;
  customer?: string;
  elapsedMinutes?: number;
  totalMinutes?: number;
}

const INITIAL_STATIONS: Station[] = [
  // 10 PCs
  { id: "PC-01", type: "pc", status: "playing", game: "Valorant", customer: "Rahul M.", elapsedMinutes: 45, totalMinutes: 120 },
  { id: "PC-02", type: "pc", status: "playing", game: "CS2", customer: "Devansh K.", elapsedMinutes: 70, totalMinutes: 120 },
  { id: "PC-03", type: "pc", status: "reserved", game: "Apex Legends", customer: "Arjun S.", elapsedMinutes: 0, totalMinutes: 60 },
  { id: "PC-04", type: "pc", status: "available" },
  { id: "PC-05", type: "pc", status: "maintenance" },
  { id: "PC-06", type: "pc", status: "playing", game: "Valorant", customer: "Team Alpha 1", elapsedMinutes: 30, totalMinutes: 180 },
  { id: "PC-07", type: "pc", status: "playing", game: "Valorant", customer: "Team Alpha 2", elapsedMinutes: 30, totalMinutes: 180 },
  { id: "PC-08", type: "pc", status: "available" },
  { id: "PC-09", type: "pc", status: "available" },
  { id: "PC-10", type: "pc", status: "playing", game: "Valorant", customer: "Team Alpha 5", elapsedMinutes: 30, totalMinutes: 180 },

  // 3 PS5s
  { id: "PS5-01", type: "ps5", status: "playing", game: "FC 26", customer: "Squad 4 (Amit + 3)", elapsedMinutes: 25, totalMinutes: 60 },
  { id: "PS5-02", type: "ps5", status: "playing", game: "Mortal Kombat 1", customer: "Rohan & Siddharth", elapsedMinutes: 40, totalMinutes: 120 },
  { id: "PS5-03", type: "ps5", status: "reserved", game: "WWE 2K25", customer: "Kunal J.", elapsedMinutes: 0, totalMinutes: 60 },

  // 2 Racing Rigs
  { id: "RACING-01", type: "racing", status: "playing", game: "F1 25", customer: "Kabir V.", elapsedMinutes: 35, totalMinutes: 60 },
  { id: "RACING-02", type: "racing", status: "available" },
];

const STATUS_CONFIG: Record<
  StationStatus,
  { label: string; badge: string; dot: string; border: string; bg: string }
> = {
  playing: {
    label: "PLAYING",
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_8px_#25D366]",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
  },
  reserved: {
    label: "RESERVED",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_8px_#F59E0B]",
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
  },
  available: {
    label: "AVAILABLE",
    badge: "border-border bg-card/60 text-muted-foreground",
    dot: "bg-zinc-400",
    border: "border-border",
    bg: "bg-card/40",
  },
  maintenance: {
    label: "MAINTENANCE",
    badge: "border-red-500/40 bg-red-500/10 text-red-400",
    dot: "bg-red-400 shadow-[0_0_8px_#EF4444]",
    border: "border-red-500/40",
    bg: "bg-red-500/5",
  },
};

export function TodayLiveArenaTab() {
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [stationTypeFilter, setStationTypeFilter] = useState<"all" | "pc" | "ps5" | "racing">("all");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState("");
  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString());

  // Real-time ticking clock every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reloadBookings = () => {
    void listAllBookings().then(setBookings).catch(() => setBookings([]));
    void listTournaments().then(setTournaments).catch(() => setTournaments([]));
  };

  useEffect(() => {
    reloadBookings();
  }, []);

  // Compute live station counts
  const playingCount = stations.filter((s) => s.status === "playing").length;
  const reservedCount = stations.filter((s) => s.status === "reserved").length;
  const availableCount = stations.filter((s) => s.status === "available").length;
  const maintenanceCount = stations.filter((s) => s.status === "maintenance").length;

  // Real database dynamic KPI calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const effectiveBookings = todayBookings.length > 0 ? todayBookings : bookings;

  const totalBookingsToday = todayBookings.length > 0 ? todayBookings.length : bookings.length;
  const checkedInToday = effectiveBookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  ).length;
  const upcomingToday = effectiveBookings.filter(
    (b) => b.status === "pending" || b.status === "awaiting_payment"
  ).length;

  // Pick active / upcoming tournament from real database
  const liveTournament =
    tournaments.find((t) => t.status === "open") ||
    tournaments.find((t) => t.status === "soon") ||
    tournaments[0] ||
    null;

  function cycleStatus(stationId: string) {
    const order: StationStatus[] = ["available", "playing", "reserved", "maintenance"];
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId) return s;
        const currentIdx = order.indexOf(s.status);
        const nextStatus = order[(currentIdx + 1) % order.length]!;
        toast.info(`Station ${s.id} updated to ${STATUS_CONFIG[nextStatus].label}`);
        return {
          ...s,
          status: nextStatus,
          game: nextStatus === "available" || nextStatus === "maintenance" ? undefined : s.game || "Game Session",
          customer: nextStatus === "available" || nextStatus === "maintenance" ? undefined : s.customer || "Walk-in Gamer",
        };
      }),
    );
  }

  function handleCheckIn(booking: Booking) {
    void approveBooking(booking.id)
      .then(() => {
        // Auto-assign to first available matching station in live dashboard
        setStations((prev) => {
          let assigned = false;
          return prev.map((s) => {
            if (!assigned && s.type === booking.platform && (s.status === "available" || s.status === "reserved")) {
              assigned = true;
              return {
                ...s,
                status: "playing",
                customer: booking.phone ? `+${booking.phone}` : "Gamer",
                game: `${booking.platform.toUpperCase()} Session (${booking.durationLabel})`,
                elapsedMinutes: 0,
                totalMinutes: 60,
              };
            }
            return s;
          });
        });
        toast.success(`Booking checked in successfully! Station assigned.`);
        reloadBookings();
      })
      .catch(() => {
        toast.error("Could not check in booking.");
      });
  }

  const filteredStations = stations.filter((s) => {
    if (stationTypeFilter !== "all" && s.type !== stationTypeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      s.game?.toLowerCase().includes(q) ||
      s.customer?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#25D366]" />
            <span>LIVE ARENA COMMAND CENTER</span>
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black uppercase text-foreground">
            TODAY'S DASHBOARD
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time station monitoring, check-ins, tournament matches, and food deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>Live Arena Time: {liveTime}</span>
        </div>
      </div>

      {/* Wireframe KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bookings */}
        <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <CalendarClock className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Today</span>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-foreground">
            {totalBookingsToday}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
            Total Bookings
          </div>
        </div>

        {/* Checked In */}
        <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">Active</span>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-emerald-400">
            {checkedInToday}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
            Checked In
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <Clock className="h-5 w-5 text-amber-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">Slots</span>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-amber-400">
            {upcomingToday}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
            Upcoming Today
          </div>
        </div>

        {/* Live Rig Utilization */}
        <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <Monitor className="h-5 w-5 text-sky-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">Occupancy</span>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-foreground">
            {Math.round(((playingCount + reservedCount) / stations.length) * 100)}%
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
            {playingCount} Active / {stations.length} Total Rigs
          </div>
        </div>
      </div>

      {/* Main Grid: Gaming Stations Matrix + Live Tournament Widget */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Gaming Stations Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                GAMING STATIONS
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any station badge to toggle status or view session details.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "pc", "ps5", "racing"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setStationTypeFilter(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    stationTypeFilter === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All (15)" : t === "pc" ? "PCs (10)" : t === "ps5" ? "PS5s (3)" : "Racing (2)"}
                </button>
              ))}
            </div>
          </div>

          {/* Status Legend matching wireframe: 🟢 PLAYING | 🟡 RESERVED | ⚪ AVAILABLE | 🔴 MAINTENANCE */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/60 p-3 text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider">Status:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#25D366]" />
              <span className="font-semibold text-emerald-400">PLAYING ({playingCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
              <span className="font-semibold text-amber-400">RESERVED ({reservedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
              <span className="font-semibold text-muted-foreground">AVAILABLE ({availableCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_8px_#EF4444]" />
              <span className="font-semibold text-red-400">MAINTENANCE ({maintenanceCount})</span>
            </div>
          </div>

          {/* Stations Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredStations.map((station) => {
              const cfg = STATUS_CONFIG[station.status];
              return (
                <button
                  key={station.id}
                  onClick={() => cycleStatus(station.id)}
                  type="button"
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 hover:scale-102 cursor-pointer ${cfg.border} ${cfg.bg} bg-card/80`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-black text-foreground">
                      {station.id}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  </div>

                  <div className="mt-3">
                    <div className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                      {cfg.label}
                    </div>

                    {station.customer && (
                      <div className="mt-2 text-xs font-semibold text-foreground truncate">
                        {station.customer}
                      </div>
                    )}
                    {station.game && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {station.game}
                      </div>
                    )}
                  </div>

                  {station.status === "playing" && station.elapsedMinutes !== undefined && (
                    <div className="mt-2 w-full bg-border/40 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (station.elapsedMinutes / (station.totalMinutes || 60)) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Tournament & Quick Check-in (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tournament Live Card matching wireframe & connected to real DB */}
          <div className="rounded-2xl border border-primary/50 bg-gradient-to-br from-card via-card to-primary/10 p-6 card-glow">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#25D366]" />
                {liveTournament?.status === "open" ? "LIVE TOURNAMENT" : "FEATURED TOURNAMENT"}
              </span>
              <Trophy className="h-5 w-5 text-primary" />
            </div>

            <h3 className="mt-4 font-display text-2xl font-black uppercase text-foreground">
              {liveTournament ? liveTournament.game : "VALORANT CUP"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {liveTournament
                ? `${liveTournament.format}${liveTournament.prize ? ` · ${liveTournament.prize}` : ""}`
                : "AlphaQ Arena Fall Championship · Double Elimination"}
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border/80 bg-background/60 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground uppercase font-semibold">Registered</span>
                <span className="font-display font-bold text-foreground">
                  {liveTournament
                    ? `${liveTournament.registeredCount ?? 0} / ${liveTournament.capacity ? `${liveTournament.capacity} Cap` : "Open"}`
                    : "16 / 16 Teams"}
                </span>
              </div>
              <div className="border-t border-border/60 pt-3">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Event Schedule
                </span>
                <div className="mt-1 font-display text-base font-bold text-foreground">
                  {liveTournament?.date || "Today"}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{liveTournament?.status === "soon" ? "Coming Soon" : liveTournament?.status || "Open"}</span>
                  <span className="font-mono text-emerald-400 font-bold">{liveTournament?.prize || "Prize Pool"}</span>
                </div>
                {liveTournament?.description && (
                  <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2 border-t border-border/40 pt-2">
                    {liveTournament.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => toast.success("Navigate to Tournaments tab to manage brackets and registrations")}
                className="w-full rounded-xl bg-primary py-2.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_4px_16px_var(--primary-shadow-glow)] transition hover:opacity-90 cursor-pointer"
              >
                Manage Tournaments
              </button>
            </div>
          </div>

          {/* Today's Check-in Queue */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold uppercase text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Quick Check-in Queue
              </h3>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                {bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length} Pending
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  All today's bookings are checked in or completed.
                </p>
              ) : (
                bookings
                  .filter((b) => b.status === "confirmed" || b.status === "pending")
                  .slice(0, 5)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-border/80 bg-background/80 p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {b.phone ? `+${b.phone}` : "Gamer"} · {b.platform.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {b.slot} ({b.durationLabel})
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckIn(b)}
                        className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500 hover:text-black transition cursor-pointer"
                      >
                        Check In
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
