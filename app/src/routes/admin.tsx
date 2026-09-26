import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  Monitor,
  Tv,
  CalendarClock,
  Users,
  Gamepad2,
  UtensilsCrossed,
  Trophy,
  ShoppingBag,
  Trash2,
  Plus,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Gift,
  Save,
  Upload,
  Home,
  Pencil,
  Phone,
  Ban,
  X,
  Check,
  Building,
  MapPin,
  Palette,
  CreditCard,
  BarChart3,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  XCircle,
  KeyRound,
  Database,
  Sliders,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modal";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SetupNotice } from "@/components/setup-notice";
import { useAuth } from "@/lib/auth";
import { AppShell, type ShellNavItem } from "@/components/app-shell";
import { LandingContent } from "@/components/landing-content";
import { ThemeToggle } from "@/components/theme-toggle";
import { CryptoTab } from "@/components/admin/crypto-tab";
import { DatabaseTab } from "@/components/admin/database-tab";
import { RailwayTab } from "@/components/admin/railway-tab";
import { NotificationsTab } from "@/components/admin/notifications-tab";
import { TodayLiveArenaTab } from "@/components/admin/today-tab";
import { RewardsManagementTab } from "@/components/admin/rewards-management-tab";
import {
  listAllBookings,
  approveBooking,
  rejectBooking,
  completeBooking,
  updateBookingUpiRef,
  cancelBooking,
  setupLabel,
  STATUS_LABEL,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import {
  listGames,
  createGame,
  updateGame,
  deleteGame,
  listFood,
  createFood,
  updateFood,
  deleteFood,
  listTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  listTournamentRegistrations,
  deleteTournamentRegistration,
  listAllFoodOrders,
  updateFoodOrderStatus,
  listAllReviews,
  createReview,
  setReviewApproved,
  deleteReview,
  listGallery,
  uploadGalleryImage,
  deleteGalleryImage,
  getAdminSettings,
  updateSettings,
  uploadArenaImage,
  uploadAppBg,
  uploadImage,
  listUsers,
  adjustReward,
  createUser,
  setUserRole,
  setUserBlocked,
  deleteUser,
  adminUpdateUserPassword,
  type Game,
  type FoodItem,
  type Tournament,
  type TournamentStatus,
  type TournamentRegistration,
  type FoodOrder,
  type FoodOrderStatus,
  type Review,
  type GalleryImage,
  type AdminUser,
} from "@/lib/db";
import { formatINR } from "@/lib/content";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin portal — AlphaQ Gaming" },
      { name: "description", content: "AlphaQ Gaming staff portal: manage bookings and track the arena." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin portal — AlphaQ Gaming" },
      { property: "og:description", content: "AlphaQ Gaming staff portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

/* ---------------------------------------------------------------- shared -- */

type TabKey =
  | "today"
  | "bookings"
  | "games"
  | "food"
  | "tournaments"
  | "orders"
  | "reviews"
  | "photos"
  | "settings"
  | "rewards"
  | "users"
  | "crypto"
  | "database"
  | "railway"
  | "notifications";

const TABS: { key: TabKey; label: string; icon: typeof Monitor }[] = [
  { key: "today", label: "Today's Live Arena", icon: BarChart3 },
  { key: "bookings", label: "Bookings", icon: CalendarClock },
  { key: "tournaments", label: "Tournaments", icon: Trophy },
  { key: "games", label: "Games", icon: Gamepad2 },
  { key: "food", label: "Food", icon: UtensilsCrossed },
  { key: "orders", label: "Food orders", icon: ShoppingBag },
  { key: "rewards", label: "Rewards & Offers", icon: Gift },
  { key: "users", label: "Users / Staff", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "reviews", label: "Reviews", icon: MessageSquare },
  { key: "crypto", label: "Crypto Tool", icon: KeyRound },
  { key: "database", label: "SQL Explorer", icon: Database },
  { key: "railway", label: "Railway Config", icon: Sliders },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground">
      {status}
    </span>
  );
}

const primaryBtn =
  "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50";
const ghostBtn =
  "rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary";
const dangerBtn =
  "rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive";
const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 card-glow">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

/** List header row: title on the left, an "Add …" button on the right. */
function ListHeader({ title, addLabel, onAdd }: { title: string; addLabel: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <button onClick={onAdd} className={`${primaryBtn} flex items-center gap-1.5`}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/* ================================================================ Bookings */

const BOOKING_FILTERS: (BookingStatus | "all")[] = [
  "all",
  "awaiting_payment",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
];

/** Whether a booking can still be cancelled by staff. */
const CANCELLABLE: BookingStatus[] = ["awaiting_payment", "pending", "confirmed"];

function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [upiModalBooking, setUpiModalBooking] = useState<Booking | null>(null);
  const [upiInput, setUpiInput] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [rejectModalBooking, setRejectModalBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [savingReject, setSavingReject] = useState(false);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [savingCancel, setSavingCancel] = useState(false);

  const reload = () => {
    setBookings(null);
    void listAllBookings()
      .then((list) => setBookings([...list].sort((a, b) => b.createdAt - a.createdAt)))
      .catch(() => {
        setBookings([]);
        toast.error("Couldn't load bookings.");
      });
  };
  useEffect(reload, []);

  function onEditUpi(b: Booking) {
    setUpiModalBooking(b);
    setUpiInput(b.upiRef || "");
  }

  async function handleSaveUpi(e: React.FormEvent) {
    e.preventDefault();
    if (!upiModalBooking) return;
    try {
      setSavingUpi(true);
      await updateBookingUpiRef(upiModalBooking.id, upiInput.trim());
      toast.success("UPI reference updated successfully.");
      setUpiModalBooking(null);
      reload();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update UPI reference.");
    } finally {
      setSavingUpi(false);
    }
  }

  if (bookings === null) return <Spinner />;

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const revenue = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((s, b) => s + b.price, 0);
  const uniqueGamers = new Set(bookings.map((b) => b.userId)).size;

  const shown = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  async function run(id: string, action: () => Promise<unknown>, ok: string) {
    setBusy(id);
    try {
      await action();
      toast.success(ok);
      reload();
    } catch {
      toast.error("Update failed. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function onApprove(b: Booking) {
    void run(b.id, () => approveBooking(b.id), "Booking approved — reward points awarded.");
  }
  function onReject(b: Booking) {
    setRejectModalBooking(b);
    setRejectReason("Slot already booked or overlap with an active session.");
  }
  async function handleConfirmReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModalBooking) return;
    setSavingReject(true);
    try {
      await rejectBooking(rejectModalBooking.id, rejectReason.trim() || "Rejected by staff");
      toast.success("Booking rejected. Reason recorded for customer.");
      setRejectModalBooking(null);
      reload();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject booking.");
    } finally {
      setSavingReject(false);
    }
  }
  function onComplete(b: Booking) {
    void run(b.id, () => completeBooking(b.id), "Booking marked completed.");
  }
  function onCancel(b: Booking) {
    setCancelModalBooking(b);
    setCancelReason("Cancelled by staff");
  }
  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelModalBooking) return;
    setSavingCancel(true);
    try {
      await cancelBooking(cancelModalBooking.id, cancelReason.trim() || "Cancelled by staff");
      toast.success("Booking cancelled.");
      setCancelModalBooking(null);
      reload();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel booking.");
    } finally {
      setSavingCancel(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: CalendarClock, label: "Today's sessions", value: String(todayBookings.length) },
          { icon: Monitor, label: "Total bookings", value: String(bookings.length) },
          { icon: Users, label: "Unique gamers", value: String(uniqueGamers) },
          { icon: Trophy, label: "Booked value", value: formatINR(revenue) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <s.icon className="h-6 w-6 text-primary" />
            <div className="mt-3 font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {BOOKING_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${filter === f
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:text-primary"
              }`}
          >
            {f === "all" ? "All" : STATUS_LABEL[f as BookingStatus]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && <Empty>No bookings in this view yet.</Empty>}
        {shown.map((b) => {
          const isBusy = busy === b.id;
          return (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {b.platform === "pc" ? <Monitor className="h-5 w-5" /> : <Tv className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">
                    {setupLabel(b)} · {b.date} {b.slot} · {b.durationLabel} · {formatINR(b.price)}
                  </p>
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span>{b.phone}</span>
                    {b.platform === "ps5" ? <span>· {b.players} players</span> : null}
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary/50 px-1.5 py-0.5 text-[11px]">
                      <span>UPI: <strong className="font-mono text-foreground">{b.upiRef || "None"}</strong></span>
                      {(b.status === "pending" || b.status === "awaiting_payment") && (
                        <button
                          type="button"
                          onClick={() => onEditUpi(b)}
                          className="ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition"
                          title="Change customer UPI reference"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Edit
                        </button>
                      )}
                    </span>
                  </p>
                  {b.decisionReason && (
                    <p className="mt-1 text-xs text-destructive">Reason: {b.decisionReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={STATUS_LABEL[b.status]} />
                {b.status === "pending" && (
                  <>
                    <button onClick={() => onApprove(b)} disabled={isBusy} className={primaryBtn}>
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                    </button>
                    <button onClick={() => onReject(b)} disabled={isBusy} className={dangerBtn}>
                      Reject
                    </button>
                  </>
                )}
                {(b.status === "confirmed" || b.status === "awaiting_payment") && (
                  <button onClick={() => onComplete(b)} disabled={isBusy} className={primaryBtn}>
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Mark completed"}
                  </button>
                )}
                {CANCELLABLE.includes(b.status) && (
                  <button onClick={() => onCancel(b)} disabled={isBusy} className={dangerBtn}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(upiModalBooking)}
        onClose={() => setUpiModalBooking(null)}
        title="Change UPI Reference"
      >
        <form onSubmit={handleSaveUpi} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Update the UPI transaction reference for customer{" "}
            <strong className="text-foreground">{upiModalBooking?.phone}</strong> (Booking #{upiModalBooking?.id}):
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              UPI Reference Number / Transaction ID
            </label>
            <input
              type="text"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              placeholder="e.g. 423456789012 or UPI-REF-XYZ"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUpiModalBooking(null)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingUpi}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingUpi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save UPI Ref
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Booking Modal with Reason */}
      <Modal
        open={Boolean(rejectModalBooking)}
        onClose={() => {
          if (!savingReject) setRejectModalBooking(null);
        }}
        title={`Reject Booking #${rejectModalBooking?.id}`}
      >
        {rejectModalBooking && (
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="rounded-xl border border-border bg-background/50 p-3.5 text-xs space-y-1">
              <p className="font-semibold text-foreground">
                {setupLabel(rejectModalBooking)} · {rejectModalBooking.date} {rejectModalBooking.slot}
              </p>
              <p className="text-muted-foreground">
                Customer: <strong className="text-foreground">{rejectModalBooking.phone}</strong> · {formatINR(rejectModalBooking.price)}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Rejection Reason <span className="text-muted-foreground font-normal">(displayed to customer on their dashboard)</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this booking is being rejected..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Quick chips */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Quick reasons:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Slot already booked or overlap with an active session.",
                  "UPI payment reference could not be verified.",
                  "Hardware station currently under maintenance.",
                  "Arena is reserved for a tournament during this time.",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectReason(chip)}
                    className="rounded-md border border-border bg-card/60 px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition cursor-pointer text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={savingReject}
                onClick={() => setRejectModalBooking(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingReject || !rejectReason.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition cursor-pointer disabled:opacity-50"
              >
                {savingReject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        open={Boolean(cancelModalBooking)}
        onClose={() => {
          if (!savingCancel) setCancelModalBooking(null);
        }}
        title={`Cancel Booking #${cancelModalBooking?.id}`}
      >
        {cancelModalBooking && (
          <form onSubmit={handleConfirmCancel} className="space-y-4">
            <div className="rounded-xl border border-border bg-background/50 p-3.5 text-xs space-y-1">
              <p className="font-semibold text-foreground">
                {setupLabel(cancelModalBooking)} · {cancelModalBooking.date} {cancelModalBooking.slot}
              </p>
              <p className="text-muted-foreground">
                Customer: <strong className="text-foreground">{cancelModalBooking.phone}</strong> · {formatINR(cancelModalBooking.price)}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Cancellation Reason / Note
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Cancelled by customer request or slot conflict"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={savingCancel}
                onClick={() => setCancelModalBooking(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                type="submit"
                disabled={savingCancel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition cursor-pointer disabled:opacity-50"
              >
                {savingCancel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Confirm Cancellation
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* =================================================================== Games */

function GamesTab() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pc, setPc] = useState(true);
  const [ps5, setPs5] = useState(false);
  const [tags, setTags] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setGames(null);
    void listGames().then(setGames);
  };
  useEffect(reload, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const platform = [pc ? "PC" : null, ps5 ? "PS5" : null].filter(Boolean) as string[];
    if (platform.length === 0) {
      toast.error("Pick at least one platform.");
      return;
    }
    setSaving(true);
    try {
      await createGame({
        title: title.trim(),
        platform,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        active,
        sortOrder: Number(sortOrder) || 0,
      });
      toast.success("Game added.");
      setTitle("");
      setTags("");
      setSortOrder(0);
      setPc(true);
      setPs5(false);
      setActive(true);
      setOpen(false);
      reload();
    } catch {
      toast.error("Couldn't add game.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(g: Game) {
    try {
      await updateGame(g.id, { active: !g.active });
      setGames((prev) => (prev ? prev.map((x) => (x.id === g.id ? { ...x, active: !x.active } : x)) : prev));
    } catch {
      toast.error("Toggle failed.");
    }
  }

  async function remove(g: Game) {
    try {
      await deleteGame(g.id);
      setGames((prev) => (prev ? prev.filter((x) => x.id !== g.id) : prev));
      toast.success("Game deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <ListHeader title="Games library" addLabel="Add game" onAdd={() => setOpen(true)} />
      <div className="space-y-3">
        {games === null ? (
          <Spinner />
        ) : games.length === 0 ? (
          <Empty>No games in the library yet.</Empty>
        ) : (
          games.map((g) => (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-display text-sm font-semibold">{g.title}</p>
                <p className="text-xs text-muted-foreground">
                  {g.platform.join(" · ")}
                  {g.tags.length ? ` · ${g.tags.join(", ")}` : ""} · #{g.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(g)} className={g.active ? primaryBtn : ghostBtn}>
                  {g.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => remove(g)} className={dangerBtn} aria-label="Delete game">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add game">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Valorant" />
          </div>
          <div>
            <span className={labelCls}>Platforms</span>
            <div className="mt-2 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={pc} onChange={(e) => setPc(e.target.checked)} /> PC
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ps5} onChange={(e) => setPs5(e.target.checked)} /> PS5
              </label>
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fps, competitive" />
          </div>
          <div>
            <label className={labelCls}>Sort order</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
          </label>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add game
          </button>
        </form>
      </Modal>
    </div>
  );
}

/* ==================================================================== Food */

function FoodTab() {
  const [items, setItems] = useState<FoodItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setItems(null);
    void listFood().then(setItems);
  };
  useEffect(reload, []);

  function startAdd() {
    setEditingItem(null);
    setName("");
    setCategory("");
    setPrice(0);
    setSortOrder(items ? items.length : 0);
    setActive(true);
    setImage("");
    setOpen(true);
  }

  function startEdit(f: FoodItem) {
    setEditingItem(f);
    setName(f.name);
    setCategory(f.category);
    setPrice(f.price);
    setSortOrder(f.sortOrder);
    setActive(f.active);
    setImage(f.image || "");
    setOpen(true);
  }

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setImage(url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateFood(editingItem.id, {
          name: name.trim(),
          category: category.trim(),
          price: Number(price) || 0,
          image,
          active,
          sortOrder: Number(sortOrder) || 0,
        });
        toast.success("Food item updated.");
      } else {
        await createFood({
          name: name.trim(),
          category: category.trim(),
          price: Number(price) || 0,
          image,
          active,
          sortOrder: Number(sortOrder) || 0,
        });
        toast.success("Item added.");
      }
      setOpen(false);
      reload();
    } catch {
      toast.error(editingItem ? "Couldn't update item." : "Couldn't add item.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(f: FoodItem) {
    try {
      await updateFood(f.id, { active: !f.active });
      setItems((prev) => (prev ? prev.map((x) => (x.id === f.id ? { ...x, active: !x.active } : x)) : prev));
    } catch {
      toast.error("Toggle failed.");
    }
  }

  async function remove(f: FoodItem) {
    if (!confirm(`Delete "${f.name}" from food menu?`)) return;
    try {
      await deleteFood(f.id);
      setItems((prev) => (prev ? prev.filter((x) => x.id !== f.id) : prev));
      toast.success("Item deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <ListHeader title="Food menu" addLabel="Add item" onAdd={startAdd} />
      <div className="space-y-3">
        {items === null ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty>No food items yet.</Empty>
        ) : (
          items.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
            >
              <div className="flex items-center gap-3.5">
                {f.image ? (
                  <img
                    src={f.image}
                    alt={f.name}
                    className="h-14 w-14 rounded-lg border border-border object-cover shrink-0 bg-muted"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground shrink-0">
                    <UtensilsCrossed className="h-6 w-6 opacity-40" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {f.name}
                    </p>
                    <span className="font-display text-xs font-bold text-primary">
                      {formatINR(f.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.category || "Uncategorised"} · Order: #{f.sortOrder}
                    {f.image && <span className="ml-2 text-primary font-medium">✓ Photo set</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                    f.active
                      ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.active ? "Active" : "Inactive"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(f)}
                  className={`${ghostBtn} text-xs px-2.5 py-1.5`}
                  title="Edit item & photo"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className={dangerBtn}
                  aria-label="Delete item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingItem ? "Edit food item" : "Add item"}>
        <form onSubmit={saveItem} className="space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Chicken wings" required />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Snacks" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (₹)</label>
              <input type="number" min={0} className={inputCls} value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
            </div>
            <div>
              <label className={labelCls}>Sort order</label>
              <input type="number" min={0} className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Photo</label>
            {image && (
              <div className="relative mt-1 mb-2">
                <img
                  src={image}
                  alt="preview"
                  className="h-32 w-full rounded-lg border border-border object-cover bg-muted"
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute top-2 right-2 rounded-full bg-black/75 p-1.5 text-white hover:bg-black transition cursor-pointer"
                  title="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <label className={`${ghostBtn} inline-flex cursor-pointer items-center justify-center gap-2 text-xs shrink-0`}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : image ? "Change file" : "Upload file"}
                <input type="file" accept="image/*" className="hidden" onChange={onImageFile} disabled={uploading} />
              </label>
              <input
                className={inputCls + " text-xs"}
                placeholder="Or paste image URL (https://... or /uploads/...)"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-primary"
            />
            <span>Active on customer menu</span>
          </label>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingItem ? "Save changes" : "Add item"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================= Tournaments */

const TOURNAMENT_STATUSES: TournamentStatus[] = ["open", "soon", "full", "closed"];

function TournamentsTab() {
  const [items, setItems] = useState<Tournament[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [regs, setRegs] = useState<TournamentRegistration[] | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);
  const [game, setGame] = useState("");
  const [format, setFormat] = useState("");
  const [date, setDate] = useState("");
  const [prize, setPrize] = useState("");
  const [status, setStatus] = useState<TournamentStatus>("open");
  const [capacity, setCapacity] = useState(0);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setItems(null);
    void listTournaments().then(setItems);
  };
  useEffect(reload, []);

  function openAdd() {
    setEditingTournament(null);
    setGame("");
    setFormat("");
    setDate("");
    setPrize("");
    setStatus("open");
    setCapacity(0);
    setDescription("");
    setOpen(true);
  }

  function openEdit(t: Tournament) {
    setEditingTournament(t);
    setGame(t.game);
    setFormat(t.format);
    setDate(t.date);
    setPrize(t.prize);
    setStatus(t.status);
    setCapacity(t.capacity || 0);
    setDescription(t.description || "");
    setOpen(true);
  }

  function viewRegistrations(t: Tournament) {
    setActiveTournament(t);
    setRegs(null);
    setRegsLoading(true);
    listTournamentRegistrations(t.id)
      .then(setRegs)
      .catch(() => setRegs([]))
      .finally(() => setRegsLoading(false));
  }

  async function deleteReg(regId: string) {
    try {
      await deleteTournamentRegistration(regId);
      toast.success("Participant removed.");
      setRegs((prev) => (prev ? prev.filter((r) => r.id !== regId) : prev));
      reload();
    } catch {
      toast.error("Could not remove participant.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!game.trim()) {
      toast.error("Game is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingTournament) {
        await updateTournament(editingTournament.id, {
          game: game.trim(),
          format: format.trim(),
          date: date.trim(),
          prize: prize.trim(),
          status,
          description: description.trim(),
          capacity: Number(capacity) || 0,
        });
        toast.success(`Tournament "${game.trim()}" updated successfully.`);
      } else {
        await createTournament({
          game: game.trim(),
          format: format.trim(),
          date: date.trim(),
          prize: prize.trim(),
          status,
          description: description.trim(),
          capacity: Number(capacity) || 0,
        });
        toast.success("Tournament added.");
      }
      setOpen(false);
      setEditingTournament(null);
      reload();
    } catch {
      toast.error(editingTournament ? "Couldn't update tournament." : "Couldn't add tournament.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: Tournament) {
    try {
      await deleteTournament(t.id);
      setItems((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev));
      toast.success("Tournament deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-sm text-muted-foreground">
        Compete at <span className="text-primary">AlphaQ</span>
      </p>
      <ListHeader title="Tournaments" addLabel="Add tournament" onAdd={openAdd} />
      <div className="space-y-3">
        {items === null ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty>No tournaments scheduled yet.</Empty>
        ) : (
          items.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {t.game} · {t.format}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.date} · {t.prize}
                  {t.capacity ? ` · cap ${t.capacity}` : " · Unlimited"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground font-mono">
                    <Users className="h-3 w-3 text-primary" />
                    {t.registeredCount ?? 0} / {t.capacity || "∞"} registered
                  </span>
                  <button
                    type="button"
                    onClick={() => viewRegistrations(t)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    View roster ({t.registeredCount ?? 0})
                  </button>
                </div>
                {t.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                <button
                  onClick={() => openEdit(t)}
                  className={ghostBtn}
                  aria-label="Edit tournament"
                  title="Edit tournament or change status (Coming Soon/Open/Full/Closed)"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => remove(t)} className={dangerBtn} aria-label="Delete tournament">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingTournament(null);
        }}
        title={editingTournament ? `Edit Tournament: ${editingTournament.game}` : "Add tournament"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Game</label>
            <input className={inputCls} value={game} onChange={(e) => setGame(e.target.value)} placeholder="Valorant" />
          </div>
          <div>
            <label className={labelCls}>Format</label>
            <input className={inputCls} value={format} onChange={(e) => setFormat(e.target.value)} placeholder="5v5 · Single elim" />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="text" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. Sat, 27 Sep or 2026-10-15" />
          </div>
          <div>
            <label className={labelCls}>Prize Pool</label>
            <input className={inputCls} value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="₹10,000 pool" />
          </div>
          <div>
            <label className={labelCls}>Status (e.g. Open / Coming Soon / Full / Closed)</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as TournamentStatus)}>
              <option value="open">Open (Accepting Registrations)</option>
              <option value="soon">Coming Soon (Registration opens soon)</option>
              <option value="full">Full (Capacity reached)</option>
              <option value="closed">Closed (Event concluded)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Capacity (0 = unlimited)</label>
            <input type="number" min={0} className={inputCls} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Description / Rules</label>
            <textarea
              className={`${inputCls} min-h-[72px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Registration opens soon — get your team ready. Doors 6pm."
            />
          </div>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingTournament ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingTournament ? "Save Tournament Changes" : "Add Tournament"}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!activeTournament}
        onClose={() => setActiveTournament(null)}
        title={activeTournament ? `${activeTournament.game} — Registered participants` : "Participants"}
      >
        {regsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : !regs || regs.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No participants or teams have registered for this tournament yet.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
              <span>{regs.length} participant{regs.length === 1 ? "" : "s"} registered</span>
              {activeTournament && activeTournament.capacity > 0 && (
                <span className="font-mono text-primary font-semibold">
                  {Math.max(0, activeTournament.capacity - regs.length)} spots left
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {regs.map((r, idx) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-primary">#{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-foreground">{r.playerName}</p>
                      {r.teamName && (
                        <p className="text-xs text-primary font-medium">Team: {r.teamName}</p>
                      )}
                      {r.phone && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground font-mono mt-0.5">
                          <Phone className="h-3 w-3" /> +{r.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteReg(r.id)}
                      className={dangerBtn}
                      title="Remove participant"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================================================= Food orders */

const NEXT_ORDER_STATUS: Record<string, { label: string; to: FoodOrderStatus }[]> = {
  placed: [
    { label: "Start prep", to: "preparing" },
    { label: "Cancel", to: "cancelled" },
  ],
  preparing: [
    { label: "Delivered", to: "delivered" },
    { label: "Cancel", to: "cancelled" },
  ],
  delivered: [],
  cancelled: [],
};

function OrdersTab() {
  const [orders, setOrders] = useState<FoodOrder[] | null>(null);

  const reload = () => {
    setOrders(null);
    void listAllFoodOrders().then((list) =>
      setOrders([...list].sort((a, b) => b.createdAt - a.createdAt)),
    );
  };
  useEffect(reload, []);

  async function advance(o: FoodOrder, to: FoodOrderStatus) {
    try {
      await updateFoodOrderStatus(o.id, to);
      setOrders((prev) => (prev ? prev.map((x) => (x.id === o.id ? { ...x, status: to } : x)) : prev));
      toast.success(`Order marked ${to}.`);
    } catch {
      toast.error("Update failed. Try again.");
    }
  }

  if (orders === null) return <Spinner />;

  return (
    <div className="space-y-3">
      {orders.length === 0 && <Empty>No food orders yet.</Empty>}
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">
                {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")} · {formatINR(o.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {o.setupLabel} · {o.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={o.status} />
            {(NEXT_ORDER_STATUS[o.status] ?? []).map((a) => (
              <button
                key={a.to}
                onClick={() => advance(o, a.to)}
                className={a.to === "cancelled" ? dangerBtn : primaryBtn}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================= Reviews */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      ))}
    </span>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setReviews(null);
    void listAllReviews()
      .then((list) => setReviews([...list].sort((a, b) => b.createdAt - a.createdAt)))
      .catch(() => {
        setReviews([]);
        toast.error("Couldn't load reviews.");
      });
  };
  useEffect(reload, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      toast.error("Name and review text are required.");
      return;
    }
    setSaving(true);
    try {
      await createReview({
        name: name.trim(),
        handle: handle.trim() || undefined,
        rating: Number(rating) || 5,
        body: body.trim(),
      });
      toast.success("Review added.");
      setName("");
      setHandle("");
      setRating(5);
      setBody("");
      setOpen(false);
      reload();
    } catch {
      toast.error("Couldn't add review.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(r: Review) {
    try {
      await setReviewApproved(r.id, !r.approved);
      setReviews((prev) =>
        prev ? prev.map((x) => (x.id === r.id ? { ...x, approved: !x.approved } : x)) : prev,
      );
      toast.success(r.approved ? "Review unapproved." : "Review approved.");
    } catch {
      toast.error("Update failed.");
    }
  }

  async function remove(r: Review) {
    try {
      await deleteReview(r.id);
      setReviews((prev) => (prev ? prev.filter((x) => x.id !== r.id) : prev));
      toast.success("Review deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <ListHeader title="Reviews" addLabel="Add review" onAdd={() => setOpen(true)} />
      <div className="space-y-3">
        {reviews === null ? (
          <Spinner />
        ) : reviews.length === 0 ? (
          <Empty>No reviews yet.</Empty>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Stars rating={r.rating} />
                  <p className="font-display text-sm font-semibold">
                    {r.name}
                    {r.handle ? <span className="text-muted-foreground"> · {r.handle}</span> : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${r.approved
                      ? "bg-primary/10 text-primary"
                      : "border border-border text-muted-foreground"
                      }`}
                  >
                    {r.approved ? "Approved" : "Pending"}
                  </span>
                  <button onClick={() => toggle(r)} className={r.approved ? ghostBtn : primaryBtn}>
                    {r.approved ? "Unapprove" : "Approve"}
                  </button>
                  <button onClick={() => remove(r)} className={dangerBtn} aria-label="Delete review">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add review">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul S." />
          </div>
          <div>
            <label className={labelCls}>Handle (optional)</label>
            <input className={inputCls} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@rahulplays" />
          </div>
          <div>
            <label className={labelCls}>Rating</label>
            <input
              type="number"
              min={1}
              max={5}
              className={inputCls}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Review</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Insane setup, buttery-smooth 240Hz…"
            />
          </div>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add review
          </button>
        </form>
      </Modal>
    </div>
  );
}

/* ================================================================== Photos */

function PhotosTab() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setImages(null);
    void listGallery()
      .then(setImages)
      .catch(() => {
        setImages([]);
        toast.error("Couldn't load gallery.");
      });
  };
  useEffect(reload, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Pick an image first.");
      return;
    }
    setSaving(true);
    try {
      await uploadGalleryImage(file, caption.trim());
      toast.success("Photo uploaded.");
      setFile(null);
      setCaption("");
      setOpen(false);
      reload();
    } catch {
      toast.error("Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(g: GalleryImage) {
    try {
      await deleteGalleryImage(g.id);
      setImages((prev) => (prev ? prev.filter((x) => x.id !== g.id) : prev));
      toast.success("Photo deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These photos appear on the landing{" "}
        <span className="text-primary">“Real space, real reviews”</span> section.
      </p>

      <ListHeader title="Gallery" addLabel="Add photo" onAdd={() => setOpen(true)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Upload photo">
        <form onSubmit={upload} className="space-y-4">
          <div>
            <label className={labelCls}>Image file</label>
            <input
              type="file"
              accept="image/*"
              className={`${inputCls} file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground`}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className={labelCls}>Caption (optional)</label>
            <input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Main PC bay" />
          </div>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload photo
          </button>
        </form>
      </Modal>

      {images === null ? (
        <Spinner />
      ) : images.length === 0 ? (
        <Empty>No gallery photos yet.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((g) => (
            <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border bg-card">
              <img src={g.url} alt={g.caption || "Gallery photo"} className="aspect-square w-full object-cover" />
              {g.caption && (
                <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{g.caption}</p>
              )}
              <button
                onClick={() => remove(g)}
                className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                aria-label="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================ Settings */

const SETTINGS_FIELDS: { key: string; label: string; hint?: string; placeholder?: string; type?: string; section?: string }[] = [
  // — Brand & Contact —
  { key: "brandName", label: "Brand name", placeholder: "AlphaQ Gaming", section: "Brand & Contact" },
  { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { key: "email", label: "Email", placeholder: "hello@alphaq.gg" },
  { key: "instagram", label: "Instagram handle", placeholder: "@alphaqgaming" },
  { key: "city", label: "City / Area", placeholder: "Indore, Madhya Pradesh" },
  { key: "address", label: "Full address / Google Maps link", hint: "Paste the venue address or Google Maps share link — shown in the footer and contact section.", placeholder: "Shop No. 12, ABC Mall, Vijay Nagar, Indore 452001", section: "Venue" },
  { key: "hours", label: "Opening hours", placeholder: "Tue–Sun · 11:00 AM – 8:00 PM" },
  // — UPI / Payment —
  { key: "upiId", label: "UPI ID", hint: "Powers the booking UPI QR code.", placeholder: "alphaq@upi", section: "Payments" },
  { key: "upiName", label: "UPI payee name", hint: "Name shown in the UPI QR.", placeholder: "AlphaQ Gaming" },
  { key: "upiPhone", label: "UPI phone number", hint: "Direct phone number for GPay/PhonePe payments.", placeholder: "e.g. 9876543210" },
  // — Setup counts —
  { key: "pcCount", label: "Gaming PCs (total)", hint: "Sets availability and booking counts.", placeholder: "10", type: "number", section: "Setup counts" },
  { key: "ps5Count", label: "PS5 setups (total)", hint: "Sets availability and booking counts.", placeholder: "3", type: "number" },
  { key: "racingCount", label: "Racing Sim rigs (total)", hint: "Sets availability and booking counts for Racing Sim.", placeholder: "2", type: "number" },
  // — PC Pricing —
  { key: "pcPrice30m", label: "PC — 30-minute price (₹)", hint: "e.g. 50", placeholder: "50", type: "number", section: "PC Pricing" },
  { key: "pcPrice1h", label: "PC — Per hour price (₹)", placeholder: "100", type: "number" },
  { key: "pcPriceDay", label: "PC — Full-day pass (₹)", placeholder: "500", type: "number" },
  // — PS5 Pricing —
  { key: "ps5Price30m", label: "PS5 — 30-minute price (₹)", placeholder: "60", type: "number", section: "PS5 Pricing" },
  { key: "ps5Price1h", label: "PS5 — Per hour price (₹)", placeholder: "120", type: "number" },
  { key: "ps5PriceDay", label: "PS5 — Full-day pass (₹)", placeholder: "600", type: "number" },
  // — Racing Sim Pricing —
  { key: "racingPrice30m", label: "Racing — 30-minute price (₹)", placeholder: "80", type: "number", section: "Racing Pricing" },
  { key: "racingPrice1h", label: "Racing — Per hour price (₹)", placeholder: "150", type: "number" },
  { key: "racingPriceDay", label: "Racing — Full-day pass (₹)", placeholder: "750", type: "number" },
  // — Stats (\"Why AlphaQ\" section) —
  { key: "statSetups", label: "Stat: Pro setups count", placeholder: "13", section: "Stats" },
  { key: "statRefresh", label: "Stat: Refresh rate", placeholder: "240Hz" },
  { key: "statPing", label: "Stat: Local ping", placeholder: "<20ms" },
  { key: "statTitles", label: "Stat: Game titles count", placeholder: "7+" },
];

type SettingsSectionKey = "brand" | "venue" | "theme" | "pricing" | "payments" | "stats";

interface SettingsNavSection {
  key: SettingsSectionKey;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_NAV_SECTIONS: SettingsNavSection[] = [
  {
    key: "brand",
    label: "Brand & Contact",
    subtitle: "Name, phone, email & social links",
    icon: Building,
  },
  {
    key: "venue",
    label: "Venue & Arena",
    subtitle: "Address, timings & arena photo",
    icon: MapPin,
  },
  {
    key: "theme",
    label: "Theme & Look",
    subtitle: "Color palette & dashboard wallpaper",
    icon: Palette,
  },
  {
    key: "pricing",
    label: "Setups & Pricing",
    subtitle: "PC/PS5 inventory & hourly pass rates",
    icon: Monitor,
  },
  {
    key: "payments",
    label: "Payments & UPI",
    subtitle: "UPI ID & payee for booking QR",
    icon: CreditCard,
  },
  {
    key: "stats",
    label: "Stats & Metrics",
    subtitle: "Refresh rate, ping & titles counter",
    icon: BarChart3,
  },
];

function SettingsTab() {
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("brand");
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingArena, setUploadingArena] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    void getAdminSettings()
      .then((s) => setValues(s))
      .catch(() => {
        setValues({});
        toast.error("Couldn't load settings.");
      });
  }, []);

  if (values === null) return <Spinner />;

  function set(key: string, v: string) {
    setValues((prev) => ({ ...(prev ?? {}), [key]: v }));
  }

  async function saveSection(sectionLabel: string) {
    setSaving(true);
    try {
      const partial: Record<string, string> = {};
      for (const f of SETTINGS_FIELDS) partial[f.key] = values?.[f.key] ?? "";
      const next = await updateSettings(partial);
      setValues(next);
      toast.success(`${sectionLabel} saved.`);
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onArenaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingArena(true);
    try {
      const { arenaImage } = await uploadArenaImage(file);
      setValues((prev) => ({ ...(prev ?? {}), arenaImage }));
      toast.success("Arena image updated.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingArena(false);
    }
  }

  async function onBgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBg(true);
    try {
      const { appBg } = await uploadAppBg(file);
      setValues((prev) => ({ ...(prev ?? {}), appBg }));
      window.dispatchEvent(new CustomEvent("app-bg-changed", { detail: appBg }));
      toast.success("Dashboard background updated.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingBg(false);
    }
  }

  async function onResetBg() {
    setUploadingBg(true);
    try {
      await updateSettings({ appBg: "" });
      setValues((prev) => ({ ...(prev ?? {}), appBg: "" }));
      window.dispatchEvent(new CustomEvent("app-bg-changed", { detail: "" }));
      toast.success("Reset to default background.");
    } catch {
      toast.error("Failed to reset background.");
    } finally {
      setUploadingBg(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Arena Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure branding, venue information, appearance themes, pricing tiers, and payments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Child Side Menu Navigation */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-20 flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 rounded-2xl border border-border bg-card p-2">
            {SETTINGS_NAV_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key)}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition cursor-pointer shrink-0 md:shrink ${
                    isActive
                      ? "border border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_rgba(30,224,122,0.1)]"
                      : "border border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-primary text-black font-bold"
                        : "bg-background border border-border group-hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xs font-bold leading-tight truncate">{sec.label}</p>
                    <p className="hidden lg:block text-[10px] text-muted-foreground opacity-80 leading-tight mt-0.5 truncate">
                      {sec.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Child Render Panel */}
        <main className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* SECTION: Brand & Contact */}
          {activeSection === "brand" && (
            <FormCard title="Brand & Contact">
              <p className="text-xs text-muted-foreground mb-4">
                Public branding and customer support contacts shown in headers, footers, and quote receipts.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveSection("Brand & Contact");
                }}
                className="space-y-4"
              >
                <div>
                  <label className={labelCls}>Brand name</label>
                  <input
                    className={inputCls}
                    value={values.brandName ?? ""}
                    onChange={(e) => set("brandName", e.target.value)}
                    placeholder="AlphaQ Gaming"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contact Phone</label>
                    <input
                      className={inputCls}
                      value={values.phone ?? ""}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Support Email</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={values.email ?? ""}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="hello@alphaq.gg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Instagram handle</label>
                    <input
                      className={inputCls}
                      value={values.instagram ?? ""}
                      onChange={(e) => set("instagram", e.target.value)}
                      placeholder="@alphaqgaming"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>City / Area</label>
                    <input
                      className={inputCls}
                      value={values.city ?? ""}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Indore, Madhya Pradesh"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${primaryBtn} inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Brand &amp; Contact
                  </button>
                </div>
              </form>
            </FormCard>
          )}

          {/* SECTION: Venue & Arena */}
          {activeSection === "venue" && (
            <div className="space-y-6">
              <FormCard title="Venue & Location">
                <p className="text-xs text-muted-foreground mb-4">
                  Arena operating address, Google Maps location share URL, and opening schedules.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveSection("Venue Details");
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className={labelCls}>Full Address / Google Maps Share Link</label>
                    <textarea
                      rows={3}
                      className={`${inputCls} resize-none`}
                      value={values.address ?? ""}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Shop No. 12, ABC Mall, Vijay Nagar, Indore 452001"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Paste the arena address or Google Maps location link — linked in navigation and contact sections.
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>Opening Hours</label>
                    <input
                      className={inputCls}
                      value={values.hours ?? ""}
                      onChange={(e) => set("hours", e.target.value)}
                      placeholder="Tue–Sun · 11:00 AM – 8:00 PM"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`${primaryBtn} inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-50`}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Venue Details
                    </button>
                  </div>
                </form>
              </FormCard>

              <FormCard title="Inside Arena Image">
                <p className="text-xs text-muted-foreground">
                  The flagship "Inside the AlphaQ arena" photo featured prominently on the landing page and venue cards.
                </p>
                {values.arenaImage ? (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-border aspect-video max-h-56">
                    <img
                      src={values.arenaImage}
                      alt="Current arena"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground italic">Currently using the default bundled arena photo.</p>
                )}
                <div className="mt-4">
                  <label className={`${ghostBtn} inline-flex cursor-pointer items-center gap-2`}>
                    {uploadingArena ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingArena ? "Uploading photo…" : "Upload new arena photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={onArenaFile} disabled={uploadingArena} />
                  </label>
                </div>
              </FormCard>
            </div>
          )}

          {/* SECTION: Theme & Look */}
          {activeSection === "theme" && (
            <div className="space-y-6">
              <FormCard title="Color Theme Palette">
                <p className="text-xs text-muted-foreground">
                  Choose the active visual appearance for the AlphaQ portal and public marketing pages.
                </p>
                <div className="mt-4">
                  <ThemeToggle />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#1ee07a]" />
                      <strong className="text-foreground">Green (Default)</strong>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      AlphaQ flagship neon green on deep charcoal canvas.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#a855f7]" />
                      <strong className="text-foreground">Dark (Obsidian)</strong>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Stealth obsidian canvas with subtle violet neon accents.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#0ea5e9]" />
                      <strong className="text-foreground">Light Mode</strong>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Clean daytime high contrast with dark slate text and emerald accents.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#00e5ff]" />
                      <strong className="text-foreground">Blue (Cyberpunk)</strong>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Electric cyan and electric blue on dark navy obsidian.
                    </p>
                  </div>
                </div>
              </FormCard>

              <FormCard title="Dashboard Background Wallpaper">
                <p className="text-xs text-muted-foreground">
                  Custom wallpaper shown behind the authenticated player portal and setup booking panels.
                </p>
                {values.appBg ? (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-border aspect-video max-h-56">
                    <img
                      src={values.appBg}
                      alt="Current background"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground italic">Using the bundled default background.</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className={`${ghostBtn} inline-flex cursor-pointer items-center gap-2`}>
                    {uploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingBg ? "Uploading wallpaper…" : "Upload wallpaper image"}
                    <input type="file" accept="image/*" className="hidden" onChange={onBgFile} disabled={uploadingBg} />
                  </label>
                  {values.appBg && (
                    <button
                      type="button"
                      onClick={onResetBg}
                      disabled={uploadingBg}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset to default
                    </button>
                  )}
                </div>
              </FormCard>
            </div>
          )}

          {/* SECTION: Setups & Pricing */}
          {activeSection === "pricing" && (
            <FormCard title="Setups & Pricing">
              <p className="text-xs text-muted-foreground mb-4">
                Available physical hardware inventories and hourly session pricing for PC &amp; PS5 stations.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveSection("Setups & Pricing");
                }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1 mb-3">
                    Available Hardware Units
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Gaming PCs (total count)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.pcCount ?? ""}
                        onChange={(e) => set("pcCount", e.target.value)}
                        placeholder="10"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Controls total PC slot bookings and availability strip.</p>
                    </div>
                    <div>
                      <label className={labelCls}>PS5 Setups (total count)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.ps5Count ?? ""}
                        onChange={(e) => set("ps5Count", e.target.value)}
                        placeholder="3"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Controls total console stations available.</p>
                    </div>
                    <div>
                      <label className={labelCls}>Racing Sim Rigs (total count)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.racingCount ?? ""}
                        onChange={(e) => set("racingCount", e.target.value)}
                        placeholder="2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Controls total pro direct-drive racing simulators.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1 mb-3">
                    PC Hourly Pricing Tiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>PC — 30-min price (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.pcPrice30m ?? ""}
                        onChange={(e) => set("pcPrice30m", e.target.value)}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>PC — 1-hour price (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.pcPrice1h ?? ""}
                        onChange={(e) => set("pcPrice1h", e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>PC — Full-day pass (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.pcPriceDay ?? ""}
                        onChange={(e) => set("pcPriceDay", e.target.value)}
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1 mb-3">
                    PS5 Hourly Pricing Tiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>PS5 — 30-min price (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.ps5Price30m ?? ""}
                        onChange={(e) => set("ps5Price30m", e.target.value)}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>PS5 — 1-hour price (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.ps5Price1h ?? ""}
                        onChange={(e) => set("ps5Price1h", e.target.value)}
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>PS5 — Full-day pass (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.ps5PriceDay ?? ""}
                        onChange={(e) => set("ps5PriceDay", e.target.value)}
                        placeholder="600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1 mb-3">
                    Racing Sim Hourly Pricing Tiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Racing — 30-min price (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.racingPrice30m ?? ""}
                        onChange={(e) => set("racingPrice30m", e.target.value)}
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Racing — 1-hour price (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.racingPrice1h ?? ""}
                        onChange={(e) => set("racingPrice1h", e.target.value)}
                        placeholder="150"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Racing — Full-day pass (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={values.racingPriceDay ?? ""}
                        onChange={(e) => set("racingPriceDay", e.target.value)}
                        placeholder="750"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${primaryBtn} inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Setups &amp; Pricing
                  </button>
                </div>
              </form>
            </FormCard>
          )}

          {/* SECTION: Payments & UPI */}
          {activeSection === "payments" && (
            <FormCard title="Payments & UPI">
              <p className="text-xs text-muted-foreground mb-4">
                Merchant UPI ID and Payee Name used to dynamically generate booking QR codes and payment intents.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveSection("Payments & UPI");
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>UPI ID (VPA)</label>
                    <input
                      className={inputCls}
                      value={values.upiId ?? ""}
                      onChange={(e) => set("upiId", e.target.value)}
                      placeholder="alphaq@upi"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">The receiver UPI VPA address.</p>
                  </div>
                  <div>
                    <label className={labelCls}>UPI Payee Name</label>
                    <input
                      className={inputCls}
                      value={values.upiName ?? ""}
                      onChange={(e) => set("upiName", e.target.value)}
                      placeholder="AlphaQ Gaming"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Business or merchant name shown in banking apps.</p>
                  </div>
                  <div>
                    <label className={labelCls}>UPI Phone Number</label>
                    <input
                      className={inputCls}
                      value={values.upiPhone ?? ""}
                      onChange={(e) => set("upiPhone", e.target.value)}
                      placeholder="e.g. 9876543210"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Mobile number for GPay/PhonePe/Paytm direct payments.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" /> Instant Dynamic QR Generation
                  </p>
                  <p className="mt-1 leading-relaxed">
                    When customers book a setup or food order, an exact amount UPI QR code is created with transaction notes. Once they scan &amp; transfer, they enter their 12-digit UPI reference number for admin verification.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${primaryBtn} inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Payments &amp; UPI
                  </button>
                </div>
              </form>
            </FormCard>
          )}

          {/* SECTION: Stats & Metrics */}
          {activeSection === "stats" && (
            <FormCard title="Stats & Highlight Metrics">
              <p className="text-xs text-muted-foreground mb-4">
                Headline hardware performance figures featured in the "Why AlphaQ" strip on the homepage.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveSection("Stats & Metrics");
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Stat: Pro Setups Count</label>
                    <input
                      className={inputCls}
                      value={values.statSetups ?? ""}
                      onChange={(e) => set("statSetups", e.target.value)}
                      placeholder="13"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stat: Refresh Rate</label>
                    <input
                      className={inputCls}
                      value={values.statRefresh ?? ""}
                      onChange={(e) => set("statRefresh", e.target.value)}
                      placeholder="240Hz"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stat: Local Ping</label>
                    <input
                      className={inputCls}
                      value={values.statPing ?? ""}
                      onChange={(e) => set("statPing", e.target.value)}
                      placeholder="<20ms"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stat: Game Titles Count</label>
                    <input
                      className={inputCls}
                      value={values.statTitles ?? ""}
                      onChange={(e) => set("statTitles", e.target.value)}
                      placeholder="7+"
                    />
                  </div>
                </div>

                {/* Preview strip */}
                <div className="rounded-xl border border-border bg-background/60 p-4 mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Landing Page Strip Preview
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-lg bg-card border border-border p-2.5">
                      <p className="font-display text-lg font-bold text-primary">{values.statSetups || "13"}</p>
                      <p className="text-[10px] text-muted-foreground">Pro Setups</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-2.5">
                      <p className="font-display text-lg font-bold text-primary">{values.statRefresh || "240Hz"}</p>
                      <p className="text-[10px] text-muted-foreground">High Refresh</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-2.5">
                      <p className="font-display text-lg font-bold text-primary">{values.statPing || "<20ms"}</p>
                      <p className="text-[10px] text-muted-foreground">Ultra-Low Ping</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-2.5">
                      <p className="font-display text-lg font-bold text-primary">{values.statTitles || "7+"}</p>
                      <p className="text-[10px] text-muted-foreground">Esports Titles</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${primaryBtn} inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Stats &amp; Metrics
                  </button>
                </div>
              </form>
            </FormCard>
          )}
        </main>
      </div>
    </div>
  );
}

/* ================================================================= Rewards */

function RewardsTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const reload = () => {
    setUsers(null);
    void listUsers()
      .then(setUsers)
      .catch(() => {
        setUsers([]);
        toast.error("Couldn't load users.");
      });
  };
  useEffect(reload, []);

  async function adjust(u: AdminUser, delta: number) {
    setBusy(u.id);
    try {
      const updated = await adjustReward(u.id, delta, "Staff adjustment");
      setUsers((prev) =>
        prev ? prev.map((x) => (x.id === u.id ? { ...x, rewardPoints: updated.rewardPoints } : x)) : prev,
      );
      toast.success(`Adjusted by ${delta > 0 ? "+" : ""}${delta} points.`);
    } catch {
      toast.error("Adjustment failed.");
    } finally {
      setBusy(null);
    }
  }

  const DELTAS = [-10, -5, -1, 1, 5, 10];

  if (users === null) return <Spinner />;
  if (users.length === 0) return <Empty>No users yet.</Empty>;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="px-4 py-3 text-right">Adjust</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-display font-semibold">{u.name || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-display font-bold text-primary">{u.rewardPoints}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  {busy === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    DELTAS.map((d) => (
                      <button
                        key={d}
                        onClick={() => adjust(u, d)}
                        disabled={busy === u.id}
                        className={d < 0 ? dangerBtn : primaryBtn}
                        aria-label={`${d > 0 ? "Add" : "Remove"} ${Math.abs(d)} points`}
                      >
                        {d > 0 ? `+${d}` : d}
                      </button>
                    ))
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =================================================================== Users */

function UsersTab() {
  const { phone: currentPhone } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "staff" | "admin">("customer");
  const [saving, setSaving] = useState(false);

  // In-app confirmation dialog state for Block and Delete actions
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "block" | "delete";
    user: AdminUser;
  } | null>(null);

  const [passwordModalUser, setPasswordModalUser] = useState<AdminUser | null>(null);
  const [newDirectPassword, setNewDirectPassword] = useState("");
  const [showDirectPass, setShowDirectPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (newDirectPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setUpdatingPass(true);
    try {
      const res = await adminUpdateUserPassword(passwordModalUser.id, newDirectPassword);
      toast.success(res.message);
      setPasswordModalUser(null);
      setNewDirectPassword("");
      reload();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password.");
    } finally {
      setUpdatingPass(false);
    }
  }

  const reload = () => {
    setUsers(null);
    void listUsers().then(setUsers);
  };
  useEffect(reload, []);

  async function changeRole(u: AdminUser, nextRole: "customer" | "staff" | "admin") {
    if (u.role === nextRole) return;
    setBusy(u.id);
    try {
      const updated = await setUserRole(u.id, nextRole);
      setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? updated : x)) : prev));
      toast.success(`Role changed to ${nextRole}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Role update failed.");
    } finally {
      setBusy(null);
    }
  }

  function handleToggleBlock(u: AdminUser) {
    if (u.blocked) {
      // Unblocking immediately executes
      void performBlock(u, false);
    } else {
      // Blocking prompts in-app confirmation modal
      setConfirmDialog({ type: "block", user: u });
    }
  }

  function handleDeleteClick(u: AdminUser) {
    setConfirmDialog({ type: "delete", user: u });
  }

  async function performBlock(u: AdminUser, nextState: boolean) {
    setBusy(u.id);
    try {
      const updated = await setUserBlocked(u.id, nextState);
      setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? updated : x)) : prev));
      toast.success(nextState ? `User "${u.name}" blocked.` : `User "${u.name}" unblocked.`);
      setConfirmDialog(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Block update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function performDelete(u: AdminUser) {
    setBusy(u.id);
    try {
      await deleteUser(u.id);
      setUsers((prev) => (prev ? prev.filter((x) => x.id !== u.id) : prev));
      toast.success(`User "${u.name}" deleted.`);
      setConfirmDialog(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      await createUser({ phone, name, email: cleanEmail, password, role });
      toast.success(
        role === "admin"
          ? "Admin user created. Verification email sent."
          : role === "staff"
          ? "Staff user created. Verification email sent."
          : "User created. Verification email sent.",
      );
      setPhone("");
      setName("");
      setEmail("");
      setPassword("");
      setRole("customer");
      setOpen(false);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ListHeader title="Users & staff" addLabel="Add user" onAdd={() => setOpen(true)} />
      <div className="space-y-3">
        {users === null ? (
          <Spinner />
        ) : users.length === 0 ? (
          <Empty>No users yet.</Empty>
        ) : (
          users.map((u) => {
            const isSelf = currentPhone && (u.phone === currentPhone || u.phone.endsWith(currentPhone.slice(-10)));
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {u.name}
                    </p>
                    {isSelf && (
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        You
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        u.role === "admin"
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : u.role === "staff"
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-border bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                    {u.blocked && (
                      <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-400">
                        Blocked
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>+{u.phone}</span>
                    <span>·</span>
                    <span>{u.rewardPoints} points</span>
                    {u.email && (
                      <>
                        <span>·</span>
                        <span className="opacity-90">{u.email}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                            u.emailVerified
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {u.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Role selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">Role:</span>
                    <select
                      value={u.role}
                      disabled={busy === u.id || !!isSelf}
                      onChange={(e) => changeRole(u, e.target.value as "customer" | "staff" | "admin")}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none hover:border-primary/50 focus:border-primary cursor-pointer disabled:opacity-50"
                      title="Change user role"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Set Password button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalUser(u);
                      setNewDirectPassword("");
                    }}
                    disabled={busy === u.id}
                    className={`${ghostBtn} inline-flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer`}
                    title="Directly update password for this user"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Password
                  </button>

                  {/* Block / Unblock button */}
                  <button
                    type="button"
                    onClick={() => handleToggleBlock(u)}
                    disabled={busy === u.id || !!isSelf}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
                      u.blocked
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    }`}
                    title={u.blocked ? "Unblock account" : "Block account"}
                  >
                    {busy === u.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Ban className="h-3.5 w-3.5" />
                    )}
                    {u.blocked ? "Unblock" : "Block"}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(u)}
                    disabled={busy === u.id || !!isSelf}
                    className={`${dangerBtn} inline-flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer disabled:opacity-40`}
                    title="Delete user"
                    aria-label={`Delete ${u.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Block / Delete */}
      <Modal
        open={Boolean(confirmDialog)}
        onClose={() => {
          if (busy === null) setConfirmDialog(null);
        }}
        title={confirmDialog?.type === "delete" ? "Delete User" : "Block User"}
      >
        {confirmDialog && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  confirmDialog.type === "delete"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {confirmDialog.type === "delete" ? (
                  <Trash2 className="h-5 w-5" />
                ) : (
                  <Ban className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground text-sm">
                  {confirmDialog.type === "delete"
                    ? `Permanently delete "${confirmDialog.user.name}"?`
                    : `Block "${confirmDialog.user.name}"?`}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {confirmDialog.type === "delete"
                    ? `This will remove ${confirmDialog.user.name} (+${confirmDialog.user.phone}) along with their bookings and records. This action cannot be undone.`
                    : `${confirmDialog.user.name} (+${confirmDialog.user.phone}) will be immediately barred from logging in or booking setups.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmDialog(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  if (confirmDialog.type === "delete") {
                    void performDelete(confirmDialog.user);
                  } else {
                    void performBlock(confirmDialog.user, true);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                  confirmDialog.type === "delete"
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_10px_rgba(239,68,68,0.3)]"
                    : "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.3)]"
                }`}
              >
                {busy === confirmDialog.user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : confirmDialog.type === "delete" ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                <span>
                  {confirmDialog.type === "delete" ? "Delete permanently" : "Block user"}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Direct Password Update Modal */}
      <Modal
        open={Boolean(passwordModalUser)}
        onClose={() => {
          if (!updatingPass) setPasswordModalUser(null);
        }}
        title={passwordModalUser ? `Direct Password Update — ${passwordModalUser.name}` : "Set Password"}
      >
        {passwordModalUser && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="rounded-lg border border-border bg-background/60 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">{passwordModalUser.name}</p>
              <p className="text-muted-foreground">Phone: +{passwordModalUser.phone}</p>
              <p className="text-muted-foreground">Email: {passwordModalUser.email || "No email"}</p>
              <p className="text-[11px] text-primary">
                As admin, you can directly set a new password without needing the user's old password.
              </p>
            </div>

            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative mt-1">
                <input
                  type={showDirectPass ? "text" : "password"}
                  className={`${inputCls} pr-10`}
                  placeholder="min 6 characters"
                  value={newDirectPassword}
                  onChange={(e) => setNewDirectPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowDirectPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDirectPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
                  let pass = "";
                  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
                  setNewDirectPassword(pass);
                  setShowDirectPass(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                Quick Suggest Strong Password
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={updatingPass}
                onClick={() => setPasswordModalUser(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button type="submit" disabled={updatingPass} className={primaryBtn}>
                {updatingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update Password
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Add user">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required />
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Staff name" required />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              A welcome email with a verification OTP will be sent to this email address.
            </p>
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`${inputCls} pr-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <select
              className={inputCls}
              value={role}
              onChange={(e) => setRole(e.target.value as "customer" | "staff" | "admin")}
            >
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add user
          </button>
        </form>
      </Modal>
    </div>
  );
}

/* ================================================================== shell -- */

const ADMIN_NAV: ShellNavItem[] = [
  { key: "home", label: "Home", icon: Home },
  ...TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon })),
];

function AdminPage() {
  const { user, phone, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<TabKey | "home">("today");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Shield className="h-10 w-10 text-primary" />
        <h2 className="font-display text-2xl font-semibold">Staff sign-in required</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in with a staff phone number to open the admin portal.
        </p>
        <Link
          to="/auth"
          className="rounded-md bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Shield className="h-10 w-10 text-destructive" />
        <h2 className="font-display text-2xl font-semibold">Admins only</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {phone ? `+${phone}` : "This account"} isn't on the staff list. Ask the owner to add
          this number to the admin phone list.
        </p>
        <Link to="/dashboard" className="text-sm text-primary hover:underline">
          Go to my dashboard →
        </Link>
      </div>
    );
  }

  return (
    <AppShell nav={ADMIN_NAV} active={tab} onSelect={(k) => setTab(k as TabKey | "home")}>
      {tab === "home" && <LandingContent onFood={() => setTab("food")} />}
      {tab === "today" && <TodayLiveArenaTab />}
      {tab === "bookings" && <BookingsTab />}
      {tab === "games" && <GamesTab />}
      {tab === "food" && <FoodTab />}
      {tab === "tournaments" && <TournamentsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "photos" && <PhotosTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "rewards" && <RewardsManagementTab />}
      {tab === "users" && <UsersTab />}
      {tab === "crypto" && <CryptoTab />}
      {tab === "database" && <DatabaseTab />}
      {tab === "railway" && <RailwayTab />}
      {tab === "notifications" && <NotificationsTab />}
    </AppShell>
  );
}
