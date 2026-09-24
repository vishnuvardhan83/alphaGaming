import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  UtensilsCrossed,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getActiveBooking, setupLabel, type Booking } from "@/lib/bookings";
import {
  listFood,
  createFoodOrder,
  listMyFoodOrders,
  type FoodItem,
  type FoodOrder,
} from "@/lib/db";
import { formatINR } from "@/lib/content";

type MenuItem = Pick<FoodItem, "id" | "name" | "category" | "price" | "image">;

const ALL = "All";

const STATUS_STYLES: Record<string, string> = {
  placed: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  preparing: "border-primary/50 bg-primary/10 text-primary",
  delivered: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/50 bg-destructive/10 text-destructive",
};

/** Placeholder "photo" for items that have no image. */
function FoodImage() {
  return (
    <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-background">
      <UtensilsCrossed className="h-8 w-8 text-primary/60" />
    </div>
  );
}

function FoodItemPhoto({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <FoodImage />;
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className="aspect-video w-full rounded-lg object-cover bg-muted"
    />
  );
}

export function FoodOrder() {
  const { user, phone } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [category, setCategory] = useState<string>(ALL);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const b = await getActiveBooking(user.uid);
        if (!active) return;
        setBooking(b);
        if (b) {
          const [food, myOrders] = await Promise.all([
            listFood(true),
            listMyFoodOrders(user.uid),
          ]);
          if (!active) return;
          const items: MenuItem[] = food.map((f) => ({
            id: f.id,
            name: f.name,
            category: f.category,
            price: f.price,
            image: f.image,
          }));
          setMenu(items);
          setOrders(myOrders.filter((o) => o.bookingId === b.id));
        }
      } catch {
        if (active) toast.error("Could not load the food menu. Try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const categories = useMemo(
    () => [ALL, ...new Set(menu.map((m) => m.category))],
    [menu],
  );
  const visible = useMemo(
    () => (category === ALL ? menu : menu.filter((m) => m.category === category)),
    [menu, category],
  );
  const cartLines = useMemo(
    () =>
      menu
        .filter((m) => (cart[m.id] ?? 0) > 0)
        .map((m) => ({ item: m, qty: cart[m.id]! })),
    [menu, cart],
  );
  const total = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.item.price * l.qty, 0),
    [cartLines],
  );

  function setQty(id: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  async function placeOrder() {
    if (!user || !booking) return;
    const items = cartLines.map((l) => ({
      foodId: l.item.id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
    }));
    if (items.length === 0) return;
    setPlacing(true);
    try {
      await createFoodOrder({
        userId: user.uid,
        phone: phone ?? "",
        bookingId: booking.id,
        setupLabel: setupLabel(booking),
        items,
      });
      toast.success("Order placed! Staff will deliver to your setup.");
      setCart({});
      const myOrders = await listMyFoodOrders(user.uid);
      setOrders(myOrders.filter((o) => o.bookingId === booking.id));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not place order. Try again.",
      );
    } finally {
      setPlacing(false);
    }
  }

  if (!user) return null;

  const header = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card card-glow">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            <span className="text-primary">Food</span> to your seat
          </h1>
          <p className="text-sm text-muted-foreground">
            Order from your setup — staff delivers without pausing your session.
          </p>
        </div>
      </div>
      {booking && (
        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          🎮 Delivering to {setupLabel(booking)}
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex justify-center rounded-xl border border-border bg-card py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // No live session → gate ordering behind an active booking.
  if (!booking) {
    return (
      <div className="space-y-6">
        {header}
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card/60 p-8 text-center card-glow">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Order food once your booked session starts. Food is delivered to your
            setup — no need to pause your game.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const selected = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Body: menu grid + sticky cart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — menu (shows ~6 cards, scrolls for the rest) */}
        <div className="lg:col-span-2 lg:h-[640px] lg:overflow-y-auto lg:pr-1">
          {visible.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
              Nothing on the menu here yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {visible.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-xl border border-border bg-card p-3 card-glow"
                  >
                    <FoodItemPhoto src={item.image} name={item.name} />
                    <p className="mt-3 font-medium leading-tight">{item.name}</p>
                    <p className="mt-1 font-display font-bold text-primary">
                      {formatINR(item.price)}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setQty(item.id, qty - 1)}
                        disabled={qty === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-40"
                        aria-label={`Remove one ${item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-display font-semibold">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(item.id, qty + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
                        aria-label={`Add one ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — cart */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 flex flex-col rounded-xl border border-border bg-card p-5 card-glow lg:h-[640px]">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Your Order</h2>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {cartLines.length === 0 ? (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Your cart is empty
              </p>
            ) : (
              <div className="space-y-3">
                {cartLines.map(({ item, qty }) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          onClick={() => setQty(item.id, qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                          aria-label={`Remove one ${item.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-semibold">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(item.id, qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                          aria-label={`Add one ${item.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatINR(item.price * qty)}
                    </span>
                    <button
                      onClick={() => setQty(item.id, 0)}
                      className="text-muted-foreground transition hover:text-destructive"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-primary">
                {formatINR(total)}
              </span>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing || cartLines.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              Place Order
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              Food will be delivered to your setup
            </p>
          </div>
        </div>
      </div>

      {/* Your orders today */}
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
          Your orders today
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No orders yet. Add items above and place your first order.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {new Date(o.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLES[o.status] ?? STATUS_STYLES.placed
                    }`}
                  >
                    {o.status}
                  </span>
                  <span className="font-display font-bold text-primary">
                    {formatINR(o.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
