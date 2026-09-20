import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  Monitor,
  Tv,
  CalendarClock,
  XCircle,
  Gift,
  ChevronDown,
  ChevronUp,
  CreditCard,
  UtensilsCrossed,
  Home,
  LayoutDashboard,
  Trophy,
  User,
  Settings as SettingsIcon,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, type ShellNavItem } from "@/components/app-shell";
import { FoodOrder } from "@/components/food-order";
import { TournamentsSection } from "@/components/tournaments-section";
import { LandingContent } from "@/components/landing-content";
import { BookSetup } from "@/components/book-setup";
import { useAuth } from "@/lib/auth";
import {
  listMyBookings,
  cancelBooking,
  payBooking,
  STATUS_LABEL,
  setupLabel,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import {
  getMyRewards,
  getSettings,
  listMyRegistrations,
  listTournaments,
  type RewardsInfo,
  type Settings,
  type TournamentRegistration,
  type Tournament,
} from "@/lib/db";
import { formatINR } from "@/lib/content";
import QRCode from "qrcode";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My dashboard — AlphaQ Gaming" },
      { name: "description", content: "View and manage your AlphaQ Gaming setup bookings." },
      { property: "og:title", content: "My dashboard — AlphaQ Gaming" },
      { property: "og:description", content: "View and manage your AlphaQ Gaming setup bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const STATUS_STYLES: Record<BookingStatus, string> = {
  awaiting_payment: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  confirmed: "border-primary/50 bg-primary/10 text-primary",
  completed: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/50 bg-destructive/10 text-destructive",
  rejected: "border-destructive/50 bg-destructive/10 text-destructive",
};

function fmtDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function RewardsCard({ fallbackPoints }: { fallbackPoints: number }) {
  const [rewards, setRewards] = useState<RewardsInfo | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    void getMyRewards()
      .then((r) => {
        if (alive) setRewards(r);
      })
      .catch(() => {
        // fall back to user.rewardPoints below
      });
    return () => {
      alive = false;
    };
  }, []);

  const points = rewards?.points ?? fallbackPoints;
  const ledger = rewards?.ledger ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 card-glow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-primary">
              {points.toLocaleString()} <span className="text-sm font-semibold">points</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Earn points on every confirmed booking; redeem on food.
            </p>
          </div>
        </div>
        {ledger.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            {open ? "Hide" : "History"}
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {open && ledger.length > 0 && (
        <ul className="mt-4  space-y-2 overflow-y-auto border-t border-border pt-4">
          {ledger.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate text-foreground">{e.reason}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(e.createdAt)}</span>
              </span>
              <span
                className={`shrink-0 font-display font-bold ${
                  e.delta >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {e.delta >= 0 ? "+" : ""}
                {e.delta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingCard({
  b,
  onCancelled,
  onReload,
}: {
  b: Booking;
  onCancelled: (id: string) => void;
  onReload: () => void;
}) {
  const [payOpen, setPayOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qr, setQr] = useState("");
  const [editingUpi, setEditingUpi] = useState(false);
  const [newUpi, setNewUpi] = useState("");
  const [busyUpi, setBusyUpi] = useState(false);

  async function handleUpdateUpi() {
    const trimmed = newUpi.trim();
    if (!trimmed) {
      toast.error("Enter your UPI reference.");
      return;
    }
    setBusyUpi(true);
    try {
      await payBooking(b.id, trimmed);
      toast.success("UPI reference updated.");
      setEditingUpi(false);
      onReload();
    } catch {
      toast.error("Could not update reference. Try again.");
    } finally {
      setBusyUpi(false);
    }
  }

  // When the customer opens "Complete UPI payment", load the UPI settings and
  // build a QR they can scan to pay the booking amount.
  useEffect(() => {
    if (!payOpen) return;
    let alive = true;
    void getSettings()
      .then((s) => {
        if (!alive) return;
        setSettings(s);
        if (s.upiId) {
          const link = `upi://pay?pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(
            s.upiName || "AlphaQ",
          )}&am=${b.price}&cu=INR&tn=${encodeURIComponent("AlphaQ booking " + b.id)}`;
          QRCode.toDataURL(link, {
            width: 200,
            margin: 1,
            color: { dark: "#0b0f0d", light: "#eafff3" },
          })
            .then((d) => alive && setQr(d))
            .catch(() => alive && setQr(""));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [payOpen, b.price, b.id]);

  const canCancel =
    b.status === "awaiting_payment" || b.status === "pending" || b.status === "confirmed";

  async function handleCancel() {
    try {
      await cancelBooking(b.id);
      onCancelled(b.id);
      toast.success("Booking cancelled.");
    } catch {
      toast.error("Could not cancel. Try again.");
    }
  }

  async function handlePay() {
    const trimmed = ref.trim();
    if (!trimmed) {
      toast.error("Enter your UPI reference.");
      return;
    }
    setBusy(true);
    try {
      await payBooking(b.id, trimmed);
      toast.success("Payment submitted — awaiting approval.");
      setPayOpen(false);
      setRef("");
      onReload();
    } catch {
      toast.error("Could not submit payment. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {b.platform === "pc" ? <Monitor className="h-5 w-5" /> : <Tv className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-display font-semibold">
              {b.platform === "pc" ? "Gaming PC" : "PlayStation 5"} · {b.durationLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {setupLabel(b)} · {b.date} at {b.slot}
              {b.platform === "ps5" ? ` · ${b.players} player${b.players > 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-primary">{formatINR(b.price)}</span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}
          >
            {STATUS_LABEL[b.status]}
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {b.status === "rejected" && b.decisionReason && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {b.decisionReason}
        </p>
      )}

      {b.upiRef && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            UPI reference: <span className="font-mono font-medium text-foreground">{b.upiRef}</span>
          </span>
          {(b.status === "pending" || b.status === "awaiting_payment") && (
            <button
              onClick={() => {
                setEditingUpi(!editingUpi);
                setNewUpi(b.upiRef || "");
              }}
              className="inline-flex items-center gap-1 rounded border border-primary/40 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10 transition"
              title="Edit UPI reference"
            >
              <Pencil className="h-2.5 w-2.5" /> Edit
            </button>
          )}
        </div>
      )}

      {editingUpi && (b.status === "pending" || b.status === "awaiting_payment") && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-3">
          <input
            value={newUpi}
            onChange={(e) => setNewUpi(e.target.value)}
            placeholder="Enter correct UPI reference"
            className="flex-1 min-w-[12rem] rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-mono"
            autoFocus
          />
          <button
            onClick={handleUpdateUpi}
            disabled={busyUpi}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busyUpi ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditingUpi(false)}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {b.status === "awaiting_payment" && (
        <div className="mt-4 border-t border-border pt-4">
          {!payOpen ? (
            <button
              onClick={() => setPayOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground"
            >
              <CreditCard className="h-4 w-4" /> Complete UPI payment
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Scan the QR with any UPI app, pay{" "}
                <span className="text-primary">{formatINR(b.price)}</span>, then enter the
                reference number below.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {qr ? (
                  <img src={qr} alt="UPI QR code" className="h-40 w-40 rounded-lg" />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
                    Loading QR…
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Pay to</p>
                  <p className="font-mono text-sm text-foreground">{settings?.upiId || "—"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Confirmed once staff verifies your payment.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="UPI reference / transaction ID"
                  className="flex-1 min-w-[12rem] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={handlePay}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit
                </button>
                <button
                  onClick={() => {
                    setPayOpen(false);
                    setRef("");
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CUSTOMER_NAV: ShellNavItem[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "bookings", label: "My Bookings", icon: CalendarClock },
  { key: "food", label: "Food Order", icon: UtensilsCrossed },
  { key: "rewards", label: "Rewards", icon: Gift },
  { key: "tournaments", label: "Tournaments", icon: Trophy },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "profile", label: "Profile", icon: User },
];

function StatCard({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-6 w-6 text-primary" />
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

function DashboardPage() {
  const { user, phone, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [tab, setTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["home", "bookings", "food", "rewards", "tournaments", "payment", "profile", "settings"].includes(hash)) {
        return hash;
      }
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get("tab");
      if (qTab && ["home", "bookings", "food", "rewards", "tournaments", "payment", "profile", "settings"].includes(qTab)) {
        return qTab;
      }
    }
    return "home";
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["home", "bookings", "food", "rewards", "tournaments", "payment", "profile", "settings"].includes(hash)) {
        setTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);
  const [showBook, setShowBook] = useState(false);
  const [myRegs, setMyRegs] = useState<TournamentRegistration[]>([]);
  const [tournamentsMap, setTournamentsMap] = useState<Record<string, Tournament>>({});

  async function reload() {
    try {
      setBookings(await listMyBookings());
    } catch {
      toast.error("Could not load bookings.");
      setBookings([]);
    }
  }

  // Load tournament registrations and tournament details for the current user
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void Promise.all([listMyRegistrations(user.uid), listTournaments()])
      .then(([regs, tournaments]) => {
        if (!alive) return;
        setMyRegs(regs);
        const map: Record<string, Tournament> = {};
        for (const t of tournaments) map[t.id] = t;
        setTournamentsMap(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h2 className="font-display text-2xl font-bold">Sign in to open your dashboard</h2>
        <Link
          to="/auth"
          className="rounded-md bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const bookingsList =
    bookings === null ? (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : bookings.length === 0 ? (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <CalendarClock className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-semibold">No bookings yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your reserved setups will appear here.</p>
        <button
          onClick={() => setShowBook(true)}
          className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          Book your first setup
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {bookings.map((b) => (
          <BookingCard
            key={b.id}
            b={b}
            onCancelled={(id) =>
              setBookings((prev) =>
                prev ? prev.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)) : prev,
              )
            }
            onReload={reload}
          />
        ))}
      </div>
    );

  let section: React.ReactNode = null;
  if (tab === "home") {
    section = (
      <LandingContent
        onBook={() => {
          setShowBook(true);
          setTab("bookings");
        }}
        onFood={() => {
          setTab("food");
        }}
      />
    );
  } else if (tab === "bookings") {
    section = showBook ? (
      <div>
        <button
          onClick={() => {
            setShowBook(false);
            void reload();
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
        >
          ← Back to my bookings
        </button>
        <BookSetup
          onBooked={() => void reload()}
          onViewBookings={() => {
            setShowBook(false);
            void reload();
          }}
        />
      </div>
    ) : (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My bookings</h1>
          <button
            onClick={() => setShowBook(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
          >
            <ArrowRight className="h-4 w-4" /> Book a setup
          </button>
        </div>
        {bookingsList}
      </div>
    );
  } else if (tab === "food") {
    section = <FoodOrder />;
  } else if (tab === "rewards") {
    section = (
      <div className="">
        <SectionHeading title="Reward points" />
        <RewardsCard fallbackPoints={user.rewardPoints ?? 0} />
      </div>
    );
  } else if (tab === "tournaments") {
    section = <TournamentsSection />;
  } else if (tab === "payment") {
    section = (
      <div>
        <SectionHeading
          title="Payments"
          subtitle="Complete UPI payment for pending bookings — staff confirms your slot."
        />
        {bookingsList}
      </div>
    );
  } else if (tab === "profile") {
    section = (
      <div className="max-w-xl">
        <SectionHeading title="Profile" />
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <Row label="Name" value={user.name || "—"} />
          <Row label="Phone" value={phone ? `+${phone}` : "—"} />
          <Row label="Role" value={user.role} />
          <Row label="Reward points" value={String(user.rewardPoints ?? 0)} />
        </div>
      </div>
    );
  } else if (tab === "settings") {
    section = (
      <div className="max-w-xl">
        <SectionHeading title="Settings" />
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>
            Signed in as <span className="text-foreground">{user.name}</span> (
            {phone ? `+${phone}` : "—"}).
          </p>
          <p>To change your phone number or remove your account, please contact AlphaQ staff.</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      nav={CUSTOMER_NAV}
      active={tab}
      onSelect={(t) => {
        setTab(t);
        if (t === "bookings") {
          setShowBook(false);
          void reload();
        }
      }}
    >
      {section}
    </AppShell>
  );
}
