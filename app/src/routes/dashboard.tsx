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
  Plus,
  Pencil,
  AlertCircle,
  Copy,
  Bell,
  Search,
  Check,
  Clock,
  Gamepad2,
  Gauge,
  Sparkles,
  ShieldCheck,
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
  redeemRewards,
  getSettings,
  listMyRegistrations,
  listTournaments,
  listGames,
  listLeaderboard,
  type RewardsInfo,
  type Settings,
  type TournamentRegistration,
  type Tournament,
  type Game,
  type LeaderboardEntry,
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
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardsInfo | null>(null);
  const [open, setOpen] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [customPts, setCustomPts] = useState("");
  const [voucherResult, setVoucherResult] = useState<any | null>(null);

  const fetchRewards = () => {
    void getMyRewards()
      .then((r) => setRewards(r))
      .catch(() => {});
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const points = rewards?.points ?? user?.rewardPoints ?? fallbackPoints;
  const ledger = rewards?.ledger ?? [];

  async function handleRedeem(ptsToRedeem: number, type: string) {
    if (ptsToRedeem <= 0 || isNaN(ptsToRedeem)) {
      toast.error("Enter a valid number of points.");
      return;
    }
    if (points < ptsToRedeem) {
      toast.error(`Insufficient points. You have ${points} points.`);
      return;
    }

    try {
      setRedeeming(true);
      const res = await redeemRewards(ptsToRedeem, type);
      setVoucherResult(res);
      toast.success(res.message);
      fetchRewards();
    } catch (err: any) {
      toast.error(err?.message || "Failed to redeem points.");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 card-glow space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-primary">
              {points.toLocaleString()} <span className="text-sm font-semibold">points</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Earn on every confirmed booking; redeem for instant vouchers & free hours.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setVoucherResult(null);
              setRedeemOpen(true);
            }}
            disabled={points <= 0}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            <Gift className="h-3.5 w-3.5" />
            Redeem Points
          </button>
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
      </div>

      {/* Redeem Modal */}
      {redeemOpen && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" /> Select Reward to Redeem
            </h4>
            <button
              onClick={() => setRedeemOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          {voucherResult ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-center space-y-2">
              <p className="text-xs font-semibold text-emerald-400">🎉 Voucher Generated Successfully!</p>
              <div className="inline-flex items-center gap-2 rounded border border-emerald-500/40 bg-background/80 px-3 py-1 text-sm font-mono font-bold text-emerald-400">
                <span>{voucherResult.voucherCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(voucherResult.voucherCode);
                    toast.success("Voucher code copied to clipboard!");
                  }}
                  className="hover:text-white"
                  title="Copy code"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{voucherResult.reason}</p>
              <p className="text-[11px] text-muted-foreground">
                Remaining balance: {voucherResult.remainingPoints} points
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-md border border-border bg-card p-3 flex flex-col justify-between space-y-2">
                <div>
                  <p className="font-semibold text-xs text-foreground">₹50 Café Voucher</p>
                  <p className="text-[11px] text-muted-foreground">50 Reward Points</p>
                </div>
                <button
                  disabled={redeeming || points < 50}
                  onClick={() => handleRedeem(50, "cafe_discount")}
                  className="rounded bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold py-1 px-2 disabled:opacity-40 transition"
                >
                  {redeeming ? "Redeeming..." : "Redeem 50 pts"}
                </button>
              </div>

              <div className="rounded-md border border-border bg-card p-3 flex flex-col justify-between space-y-2">
                <div>
                  <p className="font-semibold text-xs text-foreground">1 Free Gaming Hour</p>
                  <p className="text-[11px] text-muted-foreground">100 Reward Points</p>
                </div>
                <button
                  disabled={redeeming || points < 100}
                  onClick={() => handleRedeem(100, "gaming_hour")}
                  className="rounded bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold py-1 px-2 disabled:opacity-40 transition"
                >
                  {redeeming ? "Redeeming..." : "Redeem 100 pts"}
                </button>
              </div>

              <div className="rounded-md border border-border bg-card p-3 flex flex-col justify-between space-y-2">
                <div>
                  <p className="font-semibold text-xs text-foreground">VIP Pass Voucher</p>
                  <p className="text-[11px] text-muted-foreground">200 Reward Points</p>
                </div>
                <button
                  disabled={redeeming || points < 200}
                  onClick={() => handleRedeem(200, "vip_pass")}
                  className="rounded bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold py-1 px-2 disabled:opacity-40 transition"
                >
                  {redeeming ? "Redeeming..." : "Redeem 200 pts"}
                </button>
              </div>
            </div>
          )}

          {!voucherResult && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
              <span className="text-muted-foreground">Or custom points:</span>
              <input
                type="number"
                min="10"
                max={points}
                placeholder="Points"
                value={customPts}
                onChange={(e) => setCustomPts(e.target.value)}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
              />
              <button
                disabled={redeeming || !customPts || Number(customPts) > points || Number(customPts) < 10}
                onClick={() => handleRedeem(Number(customPts), "custom_discount")}
                className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                Redeem
              </button>
            </div>
          )}
        </div>
      )}

      {open && ledger.length > 0 && (
        <ul className="mt-4 space-y-2 overflow-y-auto border-t border-border pt-4 max-h-60">
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
        const upiTarget = s.upiId || s.upiPhone || s.phone;
        if (upiTarget) {
          const link = `upi://pay?pa=${encodeURIComponent(upiTarget)}&pn=${encodeURIComponent(
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
      await cancelBooking(b.id, "Cancelled by customer");
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
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/50 hover:text-destructive cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {b.status === "rejected" && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1 min-w-0">
            <p className="font-semibold text-sm text-red-400">Booking Rejected by Arena Staff</p>
            <p className="text-sm text-muted-foreground">
              <strong className="text text-muted-foreground">Reason:</strong>{" "}
              {b.decisionReason || "Setup unavailable or slot already filled. Please choose another slot or reach out to staff."}
            </p>
          </div>
        </div>
      )}

      {b.status === "cancelled" && b.decisionReason && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            <span>Cancellation note: </span>
            <span className="text-foreground font-medium">{b.decisionReason}</span>
          </p>
        </div>
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
            <div className="space-y-4 rounded-xl border border-primary/25 bg-card/80 p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                {/* QR Code */}
                <div className="flex shrink-0 flex-col items-center">
                  {qr ? (
                    <img
                      src={qr}
                      alt="UPI QR code"
                      className="h-40 w-40 rounded-lg border border-primary/30 bg-background p-1 shadow-md shadow-primary/10"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
                      Loading QR…
                    </div>
                  )}
                  <span className="mt-1.5 text-[11px] text-muted-foreground">Scan with any UPI app</span>
                </div>

                {/* Details & Payment Options */}
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code or pay directly using the UPI ID or Phone number below:{" "}
                    <span className="font-bold text-primary">{formatINR(b.price)}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* UPI ID */}
                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        UPI ID (VPA)
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {settings?.upiId || "—"}
                        </span>
                        {settings?.upiId && (
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard?.writeText(settings.upiId);
                              toast.success("UPI ID copied");
                            }}
                            className="text-muted-foreground transition hover:text-primary"
                            title="Copy UPI ID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pay to Phone */}
                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Pay to Phone
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {settings?.upiPhone || settings?.phone || "—"}
                        </span>
                        {(settings?.upiPhone || settings?.phone) && (
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard?.writeText(settings?.upiPhone || settings?.phone || "");
                              toast.success("UPI phone number copied");
                            }}
                            className="text-muted-foreground transition hover:text-primary"
                            title="Copy Phone Number"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Payee Name */}
                    {settings?.upiName && (
                      <div className="rounded-lg border border-border bg-background px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Payee
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {settings.upiName}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Confirmed once staff verifies your payment.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      value={ref}
                      onChange={(e) => setRef(e.target.value)}
                      placeholder="UPI reference / transaction ID"
                      className="flex-1 min-w-[12rem] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={handlePay}
                      disabled={busy || !ref.trim()}
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
                      className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CUSTOMER_NAV: ShellNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "games", label: "Browse Games", icon: Gamepad2 },
  { key: "book", label: "Book a Station", icon: Monitor },
  { key: "bookings", label: "My Bookings", icon: CalendarClock },
  { key: "tournaments", label: "Tournaments", icon: Trophy },
  { key: "food", label: "Food & Drinks", icon: UtensilsCrossed },
  { key: "rewards", label: "Rewards", icon: Gift },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: SettingsIcon },
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
  const VALID_TABS = [
    "dashboard",
    "home",
    "games",
    "book",
    "bookings",
    "tournaments",
    "food",
    "rewards",
    "notifications",
    "profile",
    "settings",
    "payment",
  ];

  const [tab, setTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && VALID_TABS.includes(hash)) {
        return hash;
      }
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get("tab");
      if (qTab && VALID_TABS.includes(qTab)) {
        return qTab;
      }
    }
    return "dashboard";
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && VALID_TABS.includes(hash)) {
        setTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const [showBook, setShowBook] = useState(false);
  const [selectedBookPlatform, setSelectedBookPlatform] = useState<"pc" | "ps5" | "racing">("pc");
  const [bookingFilter, setBookingFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [myRegs, setMyRegs] = useState<TournamentRegistration[]>([]);
  const [tournamentsMap, setTournamentsMap] = useState<Record<string, Tournament>>({});
  const [games, setGames] = useState<Game[]>([]);
  const [gameSearch, setGameSearch] = useState("");
  const [gamePlatform, setGamePlatform] = useState("All");
  const [tournamentSubTab, setTournamentSubTab] = useState<"upcoming" | "my" | "leaderboard">("upcoming");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load games and leaderboard
  useEffect(() => {
    void listGames(true).then(setGames).catch(() => setGames([]));
    void listLeaderboard().then(setLeaderboard).catch(() => setLeaderboard([]));
  }, []);

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

  // Filtered bookings based on sub-tab
  const filteredBookings = (bookings ?? []).filter((b) => {
    if (bookingFilter === "upcoming") {
      return ["awaiting_payment", "pending", "confirmed"].includes(b.status);
    }
    if (bookingFilter === "completed") {
      return b.status === "completed";
    }
    if (bookingFilter === "cancelled") {
      return ["cancelled", "rejected"].includes(b.status);
    }
    return true;
  });

  const renderBookingsList = (list: Booking[]) =>
    bookings === null ? (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : list.length === 0 ? (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <CalendarClock className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-semibold">No bookings found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {bookingFilter !== "all"
            ? `No ${bookingFilter} bookings at this moment.`
            : "Your reserved setups will appear here."}
        </p>
        <button
          onClick={() => {
            setSelectedBookPlatform("pc");
            setTab("book");
          }}
          className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          Book a station
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {list.map((b) => (
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

  const filteredGames = games.filter((g) => {
    const matchesSearch =
      !gameSearch ||
      g.title.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.tags.some((t) => t.toLowerCase().includes(gameSearch.toLowerCase()));
    const matchesPlatform =
      gamePlatform === "All" ||
      g.platform.includes(gamePlatform) ||
      g.tags.includes(gamePlatform);
    return matchesSearch && matchesPlatform;
  });

  const upcomingBooking = (bookings ?? []).find((b) =>
    ["awaiting_payment", "pending", "confirmed"].includes(b.status),
  );

  let section: React.ReactNode = null;

  if (tab === "dashboard") {
    section = (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
              <span className="aq-pulse-dot" />
              <span>ALPHA ELITE MEMBER</span>
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black uppercase text-foreground">
              WELCOME, {user.name || "GAMER"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your battle stations, tournament matches, and reward perks in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedBookPlatform("pc");
                setTab("book");
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
            >
              <Monitor className="h-4 w-4" /> Book Station
            </button>
            <button
              onClick={() => setTab("food")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary/50 transition"
            >
              <UtensilsCrossed className="h-4 w-4 text-primary" /> Order Café
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <CalendarClock className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Active</span>
            </div>
            <div className="mt-3 font-display text-3xl font-black text-foreground">
              {(bookings ?? []).filter((b) => ["pending", "confirmed", "awaiting_payment"].includes(b.status)).length}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
              Bookings
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Gift className="h-5 w-5 text-amber-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">Balance</span>
            </div>
            <div className="mt-3 font-display text-3xl font-black text-foreground">
              {user.rewardPoints ?? 0}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
              Reward Points
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Trophy className="h-5 w-5 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">Season</span>
            </div>
            <div className="mt-3 font-display text-3xl font-black text-foreground">
              {myRegs.length}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
              Tournaments
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Gamepad2 className="h-5 w-5 text-sky-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">Catalogue</span>
            </div>
            <div className="mt-3 font-display text-3xl font-black text-foreground">
              {games.length > 0 ? games.length : "50+"}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
              Games Ready
            </div>
          </div>
        </div>

        {/* Next Session Reminder Card (if any upcoming) */}
        {upcomingBooking ? (
          <div className="rounded-2xl border border-primary/50 bg-gradient-to-r from-card via-card to-primary/10 p-6 card-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[11px] font-semibold text-primary uppercase">
                  <span className="aq-pulse-dot" /> NEXT CONFIRMED SESSION
                </span>
                <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold uppercase text-foreground">
                  {upcomingBooking.platform === "pc" ? "Gaming PC Battlestation" : upcomingBooking.platform === "racing" ? "Direct-Drive Racing Sim" : "PlayStation 5 Lounge"} · {setupLabel(upcomingBooking)}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Scheduled for <strong className="text-foreground">{upcomingBooking.date}</strong> at <strong className="text-foreground">{upcomingBooking.slot}</strong> ({upcomingBooking.durationLabel})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[upcomingBooking.status]}`}>
                  {STATUS_LABEL[upcomingBooking.status]}
                </span>
                <button
                  onClick={() => setTab("bookings")}
                  className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Gaming Zones Quick Booker */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
              Book A Gaming Zone
            </h2>
            <button
              onClick={() => setTab("book")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Full booking view <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* PC */}
            <div className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-primary">₹70/hr</span>
                </div>
                <h3 className="mt-3 font-display font-bold uppercase text-foreground">PC ZONE</h3>
                <p className="mt-1 text-xs text-muted-foreground">RTX 4070 Ti · 240Hz Fast IPS · Optical Mice</p>
              </div>
              <button
                onClick={() => {
                  setSelectedBookPlatform("pc");
                  setTab("book");
                }}
                className="mt-4 w-full rounded-lg bg-primary/10 border border-primary/30 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition"
              >
                Select PC Setup
              </button>
            </div>

            {/* PS5 */}
            <div className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Tv className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-primary">₹120/hr</span>
                </div>
                <h3 className="mt-3 font-display font-bold uppercase text-foreground">PS5 ZONE</h3>
                <p className="mt-1 text-xs text-muted-foreground">65" 4K 120Hz OLED · 4 Controllers · Couch</p>
              </div>
              <button
                onClick={() => {
                  setSelectedBookPlatform("ps5");
                  setTab("book");
                }}
                className="mt-4 w-full rounded-lg bg-primary/10 border border-primary/30 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition"
              >
                Select PS5 Lounge
              </button>
            </div>

            {/* Racing */}
            <div className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400">₹150/hr</span>
                </div>
                <h3 className="mt-3 font-display font-bold uppercase text-foreground">RACING ZONE</h3>
                <p className="mt-1 text-xs text-muted-foreground">Fanatec Direct Drive · Load Cell · Triple Screen</p>
              </div>
              <button
                onClick={() => {
                  setSelectedBookPlatform("racing");
                  setTab("book");
                }}
                className="mt-4 w-full rounded-lg bg-amber-500/10 border border-amber-500/30 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500 hover:text-black transition"
              >
                Select Racing Rig
              </button>
            </div>
          </div>
        </div>

        {/* Recent Bookings Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
              Recent Bookings
            </h2>
            <button
              onClick={() => setTab("bookings")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View all bookings <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {renderBookingsList((bookings ?? []).slice(0, 3))}
        </div>
      </div>
    );
  } else if (tab === "home") {
    section = (
      <LandingContent
        onBook={() => {
          setSelectedBookPlatform("pc");
          setTab("book");
        }}
        onFood={() => {
          setTab("food");
        }}
      />
    );
  } else if (tab === "games") {
    section = (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-foreground">
              Browse Games
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore 50+ titles pre-installed across our PC, PS5, and Racing Simulator setups.
            </p>
          </div>
          <button
            onClick={() => setTab("book")}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
          >
            <Monitor className="h-4 w-4" /> Book Station to Play
          </button>
        </div>

        {/* Search & Platform Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              placeholder="Search games, genres, or tags…"
              className="w-full rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", "PC", "PS5", "Racing", "Competitive", "Casual"].map((p) => (
              <button
                key={p}
                onClick={() => setGamePlatform(p)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  gamePlatform === p
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No games match your search or filter.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((g) => (
              <div
                key={g.id || g.title}
                className="flex flex-col justify-between rounded-xl border border-border bg-card/80 p-5 backdrop-blur-md transition hover:border-primary/40"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-lg font-bold text-foreground">{g.title}</h3>
                    <div className="flex gap-1">
                      {g.platform.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border bg-card/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Pre-installed &amp; updated
                  </span>
                  <button
                    onClick={() => {
                      if (g.platform.includes("PS5")) setSelectedBookPlatform("ps5");
                      else if (g.platform.includes("Racing")) setSelectedBookPlatform("racing");
                      else setSelectedBookPlatform("pc");
                      setTab("book");
                    }}
                    className="text-xs font-bold text-primary hover:underline uppercase"
                  >
                    Play Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (tab === "book") {
    section = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-foreground">
              Book A Station
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select platform, pick date and time slot, choose duration, and confirm your reservation.
            </p>
          </div>
          <button
            onClick={() => setTab("bookings")}
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition"
          >
            View Existing Bookings →
          </button>
        </div>
        <BookSetup
          defaultPlatform={selectedBookPlatform}
          onBooked={() => {
            void reload();
            setTab("bookings");
          }}
          onViewBookings={() => {
            void reload();
            setTab("bookings");
          }}
        />
      </div>
    );
  } else if (tab === "bookings") {
    section = (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-foreground">
              My Bookings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your upcoming gaming sessions, completed sessions, and status.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedBookPlatform("pc");
              setTab("book");
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Book New Station
          </button>
        </div>

        {/* Sub-filters matching wireframe */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          {(["all", "upcoming", "completed", "cancelled"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setBookingFilter(filter)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                bookingFilter === filter
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {filter}
              <span className="ml-1.5 opacity-70">
                (
                {filter === "all"
                  ? (bookings ?? []).length
                  : filter === "upcoming"
                  ? (bookings ?? []).filter((b) =>
                      ["awaiting_payment", "pending", "confirmed"].includes(b.status),
                    ).length
                  : filter === "completed"
                  ? (bookings ?? []).filter((b) => b.status === "completed").length
                  : (bookings ?? []).filter((b) =>
                      ["cancelled", "rejected"].includes(b.status),
                    ).length}
                )
              </span>
            </button>
          ))}
        </div>

        {renderBookingsList(filteredBookings)}
      </div>
    );
  } else if (tab === "tournaments") {
    section = (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-foreground">
              Esports Tournaments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compete in official arena cups, register your squad, and track leaderboards.
            </p>
          </div>
        </div>

        {/* Sub-tabs: Upcoming, My Tournaments, Leaderboard */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          {(
            [
              { key: "upcoming", label: "Upcoming Tournaments" },
              { key: "my", label: `My Registrations (${myRegs.length})` },
              { key: "leaderboard", label: "Season Leaderboard" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTournamentSubTab(t.key)}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                tournamentSubTab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tournamentSubTab === "upcoming" && <TournamentsSection />}

        {tournamentSubTab === "my" && (
          <div className="space-y-4">
            {myRegs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                You haven't registered for any tournaments yet.
                <button
                  onClick={() => setTournamentSubTab("upcoming")}
                  className="mt-3 block mx-auto text-primary font-bold hover:underline"
                >
                  Browse upcoming tournaments →
                </button>
              </div>
            ) : (
              myRegs.map((reg) => {
                const tournament = tournamentsMap[reg.tournamentId];
                return (
                  <div
                    key={reg.id}
                    className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                        <Check className="h-3 w-3" /> REGISTERED SQUAD
                      </span>
                      <h3 className="mt-2 font-display text-xl font-bold uppercase text-foreground">
                        {tournament?.game ? `${tournament.game} - ${tournament.format}` : "Tournament"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Team: <strong className="text-foreground">{reg.teamName}</strong> · Player:{" "}
                        <strong className="text-foreground">{reg.playerName}</strong>
                      </p>
                      {tournament?.date && (
                        <p className="text-xs text-primary mt-1">Date: {tournament.date}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {tournament?.prize && (
                        <div className="font-display font-bold text-primary text-lg">
                          {tournament.prize}
                        </div>
                      )}
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Registered on {new Date(reg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tournamentSubTab === "leaderboard" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-md">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">
              Arena Season Standings
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">Leaderboard updating soon.</p>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry.id || entry.team}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-primary w-6 text-center">
                        {String(entry.rank || idx + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-foreground">{entry.team}</span>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">
                      {entry.points.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  } else if (tab === "food") {
    section = <FoodOrder />;
  } else if (tab === "rewards") {
    section = (
      <div className="space-y-6">
        <SectionHeading
          title="Rewards & Membership"
          subtitle="Earn points on every hourly session and food order. Redeem for free game time."
        />
        <RewardsCard fallbackPoints={user.rewardPoints ?? 0} />
      </div>
    );
  } else if (tab === "notifications") {
    section = (
      <div className="space-y-6 max-w-3xl">
        <SectionHeading
          title="Notification Center"
          subtitle="Live status updates, booking confirmations, and arena announcements."
        />
        <div className="space-y-3">
          {(bookings ?? []).slice(0, 5).map((b) => (
            <div
              key={`notif-${b.id}`}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-foreground">
                    Booking #{b.id.slice(0, 8)} Status: {STATUS_LABEL[b.status]}
                  </h4>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {b.date}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your reservation for {setupLabel(b)} at {b.slot} is currently {b.status}.
                  Email alerts configured per arena settings.
                </p>
              </div>
            </div>
          ))}

          {/* Welcome Alert */}
          <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-md">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-foreground">Account Active &amp; Verified</h4>
                <span className="font-mono text-[11px] text-muted-foreground">Online</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your gamer profile is active with role <strong className="text-foreground uppercase">{user.role}</strong>.
                Reward accrual is live at 10 pts per ₹100 spent.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (tab === "payment") {
    section = (
      <div>
        <SectionHeading
          title="Payments"
          subtitle="Complete UPI payment for pending bookings — staff confirms your slot."
        />
        {renderBookingsList(bookings ?? [])}
      </div>
    );
  } else if (tab === "profile") {
    section = (
      <div className="max-w-xl space-y-6">
        <SectionHeading title="Gamer Profile" subtitle="Manage your AlphaQ Arena credentials and perks." />
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <Row label="Name" value={user.name || "—"} />
          <Row label="Phone" value={phone ? `+${phone}` : "—"} />
          <Row label="Role" value={user.role} />
          <Row label="Reward points" value={String(user.rewardPoints ?? 0)} />
          <Row label="Membership Tier" value="Alpha Elite Gamer" />
          <Row label="Registered Tournaments" value={String(myRegs.length)} />
        </div>
      </div>
    );
  } else if (tab === "settings") {
    section = (
      <div className="max-w-xl space-y-6">
        <SectionHeading title="Settings" subtitle="System preferences and account controls." />
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>
            Signed in as <span className="text-foreground font-semibold">{user.name}</span> (
            {phone ? `+${phone}` : "—"}).
          </p>
          <div className="border-t border-border pt-3 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Notifications</h4>
            <p className="text-xs">
              Booking notifications and OTP delivery channels are managed dynamically by arena staff via the Admin portal.
            </p>
          </div>
          <p className="text-xs pt-2">To change your phone number or remove your account, please contact AlphaQ staff.</p>
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
