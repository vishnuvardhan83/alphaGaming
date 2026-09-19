import { useEffect, useMemo, useState } from "react";
import { Loader2, UtensilsCrossed, Minus, Plus, ShoppingBag } from "lucide-react";
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
import { FOOD, formatINR } from "@/lib/content";
import { Modal } from "@/components/modal";

// FoodItem shape used inside this panel. Static FOOD has no id, so we synthesize one.
type MenuItem = Pick<FoodItem, "id" | "name" | "category" | "price">;

const FOOD_ORDER_STATUS_STYLES: Record<string, string> = {
  placed: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  preparing: "border-primary/50 bg-primary/10 text-primary",
  delivered: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/50 bg-destructive/10 text-destructive",
};

export function FoodOrderPanel() {
  const { user, phone } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placing, setPlacing] = useState(false);
  const [orders, setOrders] = useState<FoodOrder[] | null>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const booking = await getActiveBooking(user.uid);
        if (!active) return;
        setActiveBooking(booking);
        if (booking) {
          const [food, myOrders] = await Promise.all([
            listFood(true),
            listMyFoodOrders(user.uid),
          ]);
          if (!active) return;
          const items: MenuItem[] =
            food.length > 0
              ? food.map((f) => ({ id: f.id, name: f.name, category: f.category, price: f.price }))
              : FOOD.map((f) => ({ id: f.name, name: f.name, category: f.category, price: f.price }));
          setMenu(items);
          setCategory(items[0]?.category ?? "");
          setOrders(myOrders.filter((o) => o.bookingId === booking.id));
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
    () => [...new Set(menu.map((m) => m.category))],
    [menu],
  );
  const inCategory = useMemo(
    () => menu.filter((m) => m.category === category),
    [menu, category],
  );

  const total = useMemo(
    () => menu.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0),
    [menu, cart],
  );
  const cartCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
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
    if (!user || !activeBooking) return;
    const items = menu
      .filter((m) => (cart[m.id] ?? 0) > 0)
      .map((m) => ({ foodId: m.id, name: m.name, price: m.price, qty: cart[m.id]! }));
    if (items.length === 0) {
      toast.error("Add something to your order first.");
      return;
    }
    setPlacing(true);
    try {
      await createFoodOrder({
        userId: user.uid,
        phone: phone ?? "",
        bookingId: activeBooking.id,
        setupLabel: setupLabel(activeBooking),
        items,
      });
      toast.success("Order placed! Staff will deliver to your setup.");
      setCart({});
      setOpen(false);
      const myOrders = await listMyFoodOrders(user.uid);
      setOrders(myOrders.filter((o) => o.bookingId === activeBooking.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order. Try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center rounded-xl border border-border bg-card py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No live session — gate ordering behind an active booking.
  if (!activeBooking) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-6 text-center">
        <UtensilsCrossed className="mx-auto h-9 w-9 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Order food once your booked session starts. Food is delivered to your setup — no need to
          pause your game.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header + Order button */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-display text-xl font-bold">Food to your seat</h2>
            <p className="text-sm text-muted-foreground">
              Order from your setup — staff delivers without pausing your session.
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-primary">
              Delivering to {setupLabel(activeBooking)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Order
        </button>
      </div>

      {/* Your orders today */}
      {orders && orders.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            Your orders today
          </h3>
          <div className="mt-3 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border border-border bg-background/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      FOOD_ORDER_STATUS_STYLES[o.status] ?? FOOD_ORDER_STATUS_STYLES["placed"]
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="mt-2 font-display font-bold text-primary">{formatINR(o.total)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No orders yet. Tap <span className="text-primary">Order</span> to pick from the menu.
        </p>
      )}

      {/* Order dialog: pick a category, then add items from it */}
      <Modal open={open} onClose={() => setOpen(false)} title="Order food">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {inCategory.map((item) => {
              const qty = cart[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-primary">{formatINR(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(item.id, qty - 1)}
                      disabled={qty === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-40"
                      aria-label={`Remove one ${item.name}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-display font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty(item.id, qty + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                      aria-label={`Add one ${item.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-3">
            <span className="text-sm text-muted-foreground">
              {cartCount} item{cartCount === 1 ? "" : "s"}
            </span>
            <span className="font-display text-xl font-bold text-primary">{formatINR(total)}</span>
          </div>
          <button
            onClick={placeOrder}
            disabled={placing || cartCount === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
            Place order
          </button>
        </div>
      </Modal>
    </div>
  );
}
