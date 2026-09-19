import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Monitor, Tv, Users, Loader2, CheckCircle2, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useAuth } from "@/lib/auth";
import { PRICING, TIME_SLOTS, formatINR } from "@/lib/content";
import { createBooking, payBooking, todayISO, type Booking } from "@/lib/bookings";
import { getSettings, getSetupCounts, type Settings } from "@/lib/db";

function nextDays(n: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate(),
    ).padStart(2, "0")}`;
    const label = day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    out.push({ iso, label });
  }
  return out;
}

type Step = "configure" | "pay" | "done";

export function BookSetup({ onBooked }: { onBooked?: () => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"pc" | "ps5">("pc");
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [tierIdx, setTierIdx] = useState(1);
  const [players, setPlayers] = useState(1);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("configure");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qr, setQr] = useState<string>("");
  const [upiRef, setUpiRef] = useState("");
  const [counts, setCounts] = useState({ pc: 10, ps5: 3 });

  const days = useMemo(() => nextDays(7), []);
  const pricing = PRICING.find((p) => p.key === platform)!;
  const tier = pricing.tiers[tierIdx] ?? pricing.tiers[0]!;

  // Load dynamic setup counts on mount.
  useEffect(() => {
    getSetupCounts().then(setCounts).catch(() => {});
  }, []);

  // Build the UPI QR once we have a booking + settings.
  useEffect(() => {
    if (step !== "pay" || !booking || !settings?.upiId) return;
    const link = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
      settings.upiName || "AlphaQ",
    )}&am=${booking.price}&cu=INR&tn=${encodeURIComponent("AlphaQ booking " + booking.id)}`;
    QRCode.toDataURL(link, { width: 240, margin: 1, color: { dark: "#0b0f0d", light: "#eafff3" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [step, booking, settings]);

  async function confirm() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!slot) {
      toast.error("Pick a time slot.");
      return;
    }
    setBusy(true);
    try {
      const created = await createBooking({
        platform,
        date,
        slot,
        durationLabel: tier.label,
        price: tier.price,
        players: platform === "ps5" ? players : 1,
      });
      setBooking(created);
      const s = await getSettings().catch(() => null);
      setSettings(s);
      setStep("pay");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment() {
    if (!booking) return;
    if (!upiRef.trim()) {
      toast.error("Enter the UPI reference / transaction ID you paid with.");
      return;
    }
    setBusy(true);
    try {
      await payBooking(booking.id, upiRef.trim());
      setStep("done");
      onBooked?.();
      toast.success("Payment submitted! Awaiting admin approval.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit payment.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep("configure");
    setSlot(null);
    setBooking(null);
    setUpiRef("");
    setQr("");
  }

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  } else if (!user) {
    body = (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="font-display text-xl font-semibold">Sign in to book</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in with your phone and password to reserve a setup.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  } else if (step === "pay" && booking) {
    body = (
      <div className="mx-auto max-w-md rounded-xl border border-primary/40 bg-card p-6 text-center card-glow sm:p-8">
        <QrCode className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 font-display text-xl font-bold">Pay {formatINR(booking.price)} by UPI</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {pricing.name} · {days.find((d) => d.iso === date)?.label} at {booking.slot}
        </p>
        {qr ? (
          <img src={qr} alt="UPI QR code" className="mx-auto mt-5 h-56 w-56 rounded-lg" />
        ) : (
          <div className="mx-auto mt-5 flex h-56 w-56 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
            QR unavailable — use the UPI ID below
          </div>
        )}
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(settings?.upiId || "");
            toast.success("UPI ID copied");
          }}
          className="mx-auto mt-4 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
        >
          <Copy className="h-4 w-4 text-primary" /> {settings?.upiId || "UPI ID unavailable"}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          Scan with any UPI app (GPay / PhonePe / Paytm), pay, then enter the reference below.
          Your booking is confirmed once staff verifies the payment.
        </p>
        <input
          value={upiRef}
          onChange={(e) => setUpiRef(e.target.value)}
          placeholder="UPI reference / transaction ID"
          className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={submitPayment}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          I've paid — submit for approval
        </button>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          I'll pay at the counter instead → go to my bookings
        </button>
      </div>
    );
  } else if (step === "done") {
    body = (
      <div className="mx-auto max-w-md rounded-xl border border-primary/50 bg-card p-8 text-center card-glow">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-xl font-bold">Payment submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pricing.name} · {days.find((d) => d.iso === date)?.label} at {booking?.slot} ·{" "}
          {formatINR(booking?.price ?? 0)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pending admin approval. You'll see it confirmed on your dashboard once staff verifies the UPI payment.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            My bookings
          </Link>
          <button onClick={reset} className="rounded-md border border-border px-5 py-2.5 text-sm">
            Book another
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 sm:p-8">
        {/* Platform */}
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
          1 · Choose platform
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {PRICING.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPlatform(p.key);
                setTierIdx(1);
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                platform === p.key
                  ? "border-primary bg-primary/10 card-glow"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {p.key === "pc" ? <Monitor className="h-6 w-6 text-primary" /> : <Tv className="h-6 w-6 text-primary" />}
              <span>
                <span className="block font-display font-semibold">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{counts[p.key]} setups</span>
              </span>
            </button>
          ))}
        </div>

        {/* Date */}
        <h3 className="mt-8 font-display text-sm font-semibold uppercase tracking-widest text-primary">
          2 · Pick a day
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d.iso}
              onClick={() => setDate(d.iso)}
              className={`rounded-md border px-4 py-2 text-sm transition ${
                date === d.iso
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Slot */}
        <h3 className="mt-8 font-display text-sm font-semibold uppercase tracking-widest text-primary">
          3 · Time slot
        </h3>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {TIME_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSlot(s);
                setCustomMode(false);
              }}
              className={`rounded-md border px-2 py-2 text-sm transition ${
                slot === s && !customMode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => {
              setCustomMode(true);
              setSlot(null);
            }}
            className={`rounded-md border px-2 py-2 text-sm transition ${
              customMode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/40"
            }`}
          >
            Custom
          </button>
        </div>
        {customMode && (
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">Pick a custom time (11:00–20:00)</label>
            <input
              type="time"
              min="11:00"
              max="20:00"
              value={slot ?? ""}
              onChange={(e) => setSlot(e.target.value || null)}
              className="mt-1 block w-40 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Duration */}
        <h3 className="mt-8 font-display text-sm font-semibold uppercase tracking-widest text-primary">
          4 · Duration
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {pricing.tiers.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTierIdx(i)}
              className={`rounded-md border px-3 py-3 text-center transition ${
                tierIdx === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
              }`}
            >
              <span className="block text-sm">{t.label}</span>
              <span className="block font-display font-bold text-primary">{formatINR(t.price)}</span>
            </button>
          ))}
        </div>

        {/* Players (PS5) */}
        {platform === "ps5" && (
          <>
            <h3 className="mt-8 font-display text-sm font-semibold uppercase tracking-widest text-primary">
              5 · Players on the couch
            </h3>
            <div className="mt-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayers(n)}
                  className={`h-10 w-10 rounded-md border text-sm transition ${
                    players === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-muted-foreground">same price for 1–4</span>
            </div>
          </>
        )}

        {/* Summary */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background/60 p-4">
          <div className="text-sm text-muted-foreground">
            {pricing.name} · {days.find((d) => d.iso === date)?.label} · {slot ?? "—"} · {tier.label}
          </div>
          <div className="font-display text-2xl font-bold text-primary">{formatINR(tier.price)}</div>
        </div>
        <button
          onClick={confirm}
          disabled={busy || !slot}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue to UPI payment
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-center font-display text-3xl font-bold sm:text-4xl">
        Book a <span className="text-primary">setup</span>
      </h1>
      <p className="mt-2 text-center text-muted-foreground">
        Reserve your rig, pay by UPI, and we'll confirm your slot.
      </p>
      <div className="mt-10">{body}</div>
    </>
  );
}
