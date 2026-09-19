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
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modal";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SetupNotice } from "@/components/setup-notice";
import { useAuth } from "@/lib/auth";
import { AppShell, type ShellNavItem } from "@/components/app-shell";
import { LandingContent } from "@/components/landing-content";
import {
  listAllBookings,
  approveBooking,
  rejectBooking,
  completeBooking,
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
  deleteTournament,
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
  type Game,
  type FoodItem,
  type Tournament,
  type TournamentStatus,
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
  | "bookings"
  | "games"
  | "food"
  | "tournaments"
  | "orders"
  | "reviews"
  | "photos"
  | "settings"
  | "rewards"
  | "users";

const TABS: { key: TabKey; label: string; icon: typeof Monitor }[] = [
  { key: "bookings", label: "Bookings", icon: CalendarClock },
  { key: "games", label: "Games", icon: Gamepad2 },
  { key: "food", label: "Food", icon: UtensilsCrossed },
  { key: "tournaments", label: "Tournaments", icon: Trophy },
  { key: "orders", label: "Food orders", icon: ShoppingBag },
  { key: "reviews", label: "Reviews", icon: MessageSquare },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "rewards", label: "Rewards", icon: Gift },
  { key: "users", label: "Users", icon: Users },
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
    const reason = window.prompt("Reason for rejecting this booking?", "");
    if (reason === null) return;
    void run(b.id, () => rejectBooking(b.id, reason.trim() || "Rejected by staff"), "Booking rejected.");
  }
  function onComplete(b: Booking) {
    void run(b.id, () => completeBooking(b.id), "Booking marked completed.");
  }
  function onCancel(b: Booking) {
    if (!window.confirm("Cancel this booking?")) return;
    void run(b.id, () => cancelBooking(b.id), "Booking cancelled.");
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
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              filter === f
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
                  <p className="text-xs text-muted-foreground">
                    {b.phone}
                    {b.platform === "ps5" ? ` · ${b.players} players` : ""}
                    {b.upiRef ? ` · UPI ref ${b.upiRef}` : ""}
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
                {b.status === "confirmed" && (
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

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      await createFood({
        name: name.trim(),
        category: category.trim(),
        price: Number(price) || 0,
        image,
        active,
        sortOrder: Number(sortOrder) || 0,
      });
      toast.success("Item added.");
      setName("");
      setCategory("");
      setPrice(0);
      setSortOrder(0);
      setActive(true);
      setImage("");
      setOpen(false);
      reload();
    } catch {
      toast.error("Couldn't add item.");
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
      <ListHeader title="Food menu" addLabel="Add item" onAdd={() => setOpen(true)} />
      <div className="space-y-3">
        {items === null ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty>No food items yet.</Empty>
        ) : (
          items.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {f.name} · {formatINR(f.price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {f.category || "Uncategorised"} · #{f.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(f)} className={f.active ? primaryBtn : ghostBtn}>
                  {f.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => remove(f)} className={dangerBtn} aria-label="Delete item">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add item">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Chicken wings" />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Snacks" />
          </div>
          <div>
            <label className={labelCls}>Price (₹)</label>
            <input type="number" min={0} className={inputCls} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Sort order</label>
            <input type="number" min={0} className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Photo (optional)</label>
            {image && (
              <img
                src={image}
                alt="preview"
                className="mt-1 h-28 w-full rounded-md border border-border object-cover"
              />
            )}
            <label className={`${ghostBtn} mt-2 inline-flex cursor-pointer items-center gap-2`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : image ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" onChange={onImageFile} disabled={uploading} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
          </label>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add item
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

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!game.trim()) {
      toast.error("Game is required.");
      return;
    }
    setSaving(true);
    try {
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
      setGame("");
      setFormat("");
      setDate("");
      setPrize("");
      setStatus("open");
      setCapacity(0);
      setDescription("");
      setOpen(false);
      reload();
    } catch {
      toast.error("Couldn't add tournament.");
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
      <ListHeader title="Tournaments" addLabel="Add tournament" onAdd={() => setOpen(true)} />
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
                    {t.capacity ? ` · cap ${t.capacity}` : ""}
                  </p>
                  {t.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <button onClick={() => remove(t)} className={dangerBtn} aria-label="Delete tournament">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add tournament">
          <form onSubmit={add} className="space-y-4">
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
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Prize</label>
              <input className={inputCls} value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="₹10,000 pool" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as TournamentStatus)}>
                {TOURNAMENT_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-background capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Capacity (0 = unlimited)</label>
              <input type="number" min={0} className={inputCls} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                className={`${inputCls} min-h-[72px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Doors 6pm. BYO peripherals."
              />
            </div>
            <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add tournament
            </button>
          </form>
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      r.approved
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

const SETTINGS_FIELDS: { key: string; label: string; hint?: string; placeholder?: string; type?: string }[] = [
  { key: "brandName", label: "Brand name", placeholder: "AlphaQ Gaming" },
  { key: "whatsapp", label: "WhatsApp", hint: "Powers the floating chat button.", placeholder: "919876543210" },
  { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { key: "email", label: "Email", placeholder: "hello@alphaq.gg" },
  { key: "instagram", label: "Instagram", placeholder: "@alphaqgaming" },
  { key: "city", label: "City", placeholder: "Bengaluru" },
  { key: "hours", label: "Hours", placeholder: "10:00 – 20:00 daily" },
  { key: "upiId", label: "UPI ID", hint: "Powers the booking UPI QR.", placeholder: "alphaq@upi" },
  { key: "upiName", label: "UPI name", hint: "Payee name shown in the booking UPI QR.", placeholder: "AlphaQ Gaming" },
  { key: "pcCount", label: "Gaming PCs (total)", hint: "Sets availability + booking counts.", placeholder: "10", type: "number" },
  { key: "ps5Count", label: "PS5 setups (total)", hint: "Sets availability + booking counts.", placeholder: "3", type: "number" },
];

function SettingsTab() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingArena, setUploadingArena] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

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
      toast.success("Dashboard background updated.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingBg(false);
    }
  }

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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const partial: Record<string, string> = {};
      for (const f of SETTINGS_FIELDS) partial[f.key] = values?.[f.key] ?? "";
      const next = await updateSettings(partial);
      setValues(next);
      toast.success("Settings saved.");
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <FormCard title="Arena settings">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {SETTINGS_FIELDS.map((f) => (
              <div key={f.key} className={f.key === "brandName" ? "sm:col-span-2" : ""}>
                <label className={labelCls}>{f.label}</label>
                <input
                  type={f.type ?? "text"}
                  className={inputCls}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
                {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-2.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
          </button>
        </form>
      </FormCard>

      <div className="mt-6">
        <FormCard title="Arena image">
          <p className="text-xs text-muted-foreground">
            The "Inside the AlphaQ arena" photo on the landing page. Upload to replace it.
          </p>
          {values.arenaImage ? (
            <img
              src={values.arenaImage}
              alt="Current arena"
              className="mt-3 h-40 w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Using the bundled default image.</p>
          )}
          <label className={`${ghostBtn} mt-4 inline-flex cursor-pointer items-center gap-2`}>
            {uploadingArena ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingArena ? "Uploading…" : "Upload new arena image"}
            <input type="file" accept="image/*" className="hidden" onChange={onArenaFile} disabled={uploadingArena} />
          </label>
        </FormCard>
      </div>

      <div className="mt-6">
        <FormCard title="Dashboard background">
          <p className="text-xs text-muted-foreground">
            Background image behind the logged-in dashboard/portal. Upload to replace it.
          </p>
          {values.appBg ? (
            <img
              src={values.appBg}
              alt="Current background"
              className="mt-3 h-40 w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Using the bundled default image.</p>
          )}
          <label className={`${ghostBtn} mt-4 inline-flex cursor-pointer items-center gap-2`}>
            {uploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingBg ? "Uploading…" : "Upload background image"}
            <input type="file" accept="image/*" className="hidden" onChange={onBgFile} disabled={uploadingBg} />
          </label>
        </FormCard>
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
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "admin">("customer");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setUsers(null);
    void listUsers().then(setUsers);
  };
  useEffect(reload, []);

  async function toggleRole(u: AdminUser) {
    const next = u.role === "admin" ? "customer" : "admin";
    setBusy(u.id);
    try {
      const updated = await setUserRole(u.id, next);
      setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? updated : x)) : prev));
      toast.success(next === "admin" ? "Granted admin access." : "Removed admin access.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createUser({ phone, name, password, role });
      toast.success(role === "admin" ? "Admin user created." : "User created.");
      setPhone("");
      setName("");
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
          users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {u.name}{" "}
                  <span
                    className={`ml-1 rounded-full border px-2 py-0.5 text-xs ${
                      u.role === "admin"
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {u.role}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  +{u.phone} · {u.rewardPoints} pts
                </p>
              </div>
              <button
                onClick={() => toggleRole(u)}
                disabled={busy === u.id}
                className={u.role === "admin" ? dangerBtn : primaryBtn}
              >
                {busy === u.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : u.role === "admin" ? (
                  "Remove admin"
                ) : (
                  "Make admin"
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add user">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Staff name" />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters" />
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <select
              className={inputCls}
              value={role}
              onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "customer")}
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin / staff</option>
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
  const [tab, setTab] = useState<TabKey | "home">("bookings");

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
      {tab === "home" && <LandingContent />}
      {tab === "bookings" && <BookingsTab />}
      {tab === "games" && <GamesTab />}
      {tab === "food" && <FoodTab />}
      {tab === "tournaments" && <TournamentsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "photos" && <PhotosTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "rewards" && <RewardsTab />}
      {tab === "users" && <UsersTab />}
    </AppShell>
  );
}
