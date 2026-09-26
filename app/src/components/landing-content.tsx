import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  Cpu,
  Wifi,
  Armchair,
  Sparkles,
  Star,
  MapPin,
  Clock,
  Coffee,
  Monitor,
  Tv,
  ArrowRight,
  ArrowDown,
  Headphones,
  Keyboard,
  Mouse,
  Map as MapIcon,
  CheckCircle2,
  Phone,
  MessageCircle,
  Gamepad2,
  Gauge,
  Trophy,
  Zap,
} from "lucide-react";

import { toast } from "sonner";
import { TournamentsSection } from "@/components/tournaments-section";
import { GroupQuoteModal } from "@/components/group-quote-modal";
import { useAuth } from "@/lib/auth";
const Hero3D = lazy(() =>
  import("@/components/hero-3d").then((m) => ({ default: m.Hero3D })),
);
import {
  BRAND,
  PRICING,
  FEATURES,
  HOTSPOTS,
  formatINR,
} from "@/lib/content";
import { countBookings, SETUP_TOTALS, todayISO } from "@/lib/bookings";
import { getSetupCounts } from "@/lib/db";
import {
  listGames,
  listFood,
  listReviews,
  submitReview,
  listGallery,
  getSettings,
  type Settings,
} from "@/lib/db";
import type { Review, GalleryImage } from "@/lib/db";
import heroImg from "@/assets/hero-arena.jpg";

function useAvailability() {
  const [avail, setAvail] = useState<{
    pc: number;
    ps5: number;
    totalPc: number;
    totalPs5: number;
  }>({
    pc: 6,
    ps5: 2,
    totalPc: SETUP_TOTALS.pc,
    totalPs5: SETUP_TOTALS.ps5,
  });
  useEffect(() => {
    void (async () => {
      try {
        const today = todayISO();
        const counts = await getSetupCounts();
        const [pcUsed, ps5Used] = await Promise.all([
          countBookings("pc", today),
          countBookings("ps5", today),
        ]);
        setAvail({
          pc: Math.max(0, counts.pc - pcUsed),
          ps5: Math.max(0, counts.ps5 - ps5Used),
          totalPc: counts.pc,
          totalPs5: counts.ps5,
        });
      } catch {
        /* keep illustrative defaults if the API is unreachable */
      }
    })();
  }, []);
  return avail;
}

// Games grid: exclusively uses admin-managed catalogue from the backend database.
function useGames() {
  const [games, setGames] = useState<{ title: string; platform: string[]; tags: string[] }[]>([]);
  useEffect(() => {
    void listGames(true)
      .then((list) => {
        setGames(list.map((g) => ({ title: g.title, platform: g.platform, tags: g.tags })));
      })
      .catch(() => { setGames([]); });
  }, []);
  return games;
}

// Food preview grid: exclusively uses admin-managed menu from the backend database.
function useFood() {
  const [food, setFood] = useState<{ name: string; category: string; price: number; image?: string }[]>([]);
  useEffect(() => {
    void listFood(true)
      .then((list) => {
        setFood(list.map((f) => ({ name: f.name, category: f.category, price: f.price, image: f.image })));
      })
      .catch(() => { setFood([]); });
  }, []);
  return food;
}

// Reviews: only show admin-approved reviews — no hardcoded fallback.
function useReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  useEffect(() => {
    void listReviews()
      .then((list) => {
        setReviews(list); // empty array = no reviews yet
      })
      .catch(() => { setReviews([]); });
  }, []);
  return reviews;
}

// Arena photo: admin-managed via Settings; falls back to the bundled image.
function useArenaImage() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    void getSettings()
      .then((s) => {
        if (s.arenaImage) setUrl(s.arenaImage);
      })
      .catch(() => { });
  }, []);
  return url;
}

// Gallery: admin-managed photos of the space; empty until admins upload some.
function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  useEffect(() => {
    void listGallery()
      .then((list) => setImages(list))
      .catch(() => { });
  }, []);
  return images;
}

// Admin-managed settings: stats, pricing, address — all fall back to BRAND/PRICING defaults.
function useAdminSettings() {
  const [s, setS] = useState<Partial<Settings>>({});
  useEffect(() => {
    void getSettings().then(setS).catch(() => { });
  }, []);

  // Stats — use admin values if set, otherwise BRAND/default
  const stats = [
    { value: s.statSetups || "13", label: "Pro setups" },
    { value: s.statRefresh || "240Hz", label: "Refresh rate" },
    { value: s.statPing || "<20ms", label: "Local ping" },
    { value: s.statTitles || "7+", label: "Titles installed" },
  ];

  // Pricing — use admin values if set, otherwise fall back to PRICING defaults
  const pricing = PRICING.map((p) => ({
    ...p,
    tiers:
      p.key === "pc"
        ? [
          { label: "30 minutes", price: Number(s.pcPrice30m) || p.tiers[0]!.price, unit: "30 min" },
          { label: "Per hour", price: Number(s.pcPrice1h) || p.tiers[1]!.price, unit: "hour" },
          { label: "Full-day pass", price: Number(s.pcPriceDay) || p.tiers[2]!.price, unit: "day" },
        ]
        : p.key === "ps5"
        ? [
          { label: "30 minutes", price: Number(s.ps5Price30m) || p.tiers[0]!.price, unit: "30 min" },
          { label: "Per hour", price: Number(s.ps5Price1h) || p.tiers[1]!.price, unit: "hour" },
          { label: "Full-day pass", price: Number(s.ps5PriceDay) || p.tiers[2]!.price, unit: "day" },
        ]
        : [
          { label: "30 minutes", price: p.tiers[0]!.price, unit: "30 min" },
          { label: "Per hour", price: p.tiers[1]!.price, unit: "hour" },
          { label: "Full-day pass", price: p.tiers[2]!.price, unit: "day" },
        ],
  }));

  const address = s.address || "";
  const city = s.city || BRAND.city;
  const hours = s.hours || BRAND.hours;
  const phone = s.phone || BRAND.phone;

  return { stats, pricing, address, city, hours, phone };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "text-border"
            }`}
        />
      ))}
    </div>
  );
}

// Compact "share your experience" form. Signed-out users get a sign-in prompt.
function ReviewForm() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || body.trim().length === 0) return;
    setSubmitting(true);
    void submitReview(rating, body.trim())
      .then((res) => {
        toast.success(res.message);
        setBody("");
        setRating(5);
      })
      .catch(() => {
        toast.error("Could not submit your review. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="font-display text-lg font-semibold text-foreground">Share your experience</h3>
      <div className="mt-4 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              className="transition hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                  }`}
              />
            </button>
          );
        })}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="How was your session at AlphaQ?"
        className="mt-4 w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/60"
      />
      <button
        type="submit"
        disabled={submitting || body.trim().length === 0}
        className="mt-4 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-[0_4px_14px_var(--primary-shadow-glow)] transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Submit review"} <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

const SPOT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  display: Monitor,
  cabinet: Cpu,
  headset: Headphones,
  keyboard: Keyboard,
  mouse: Mouse,
  network: Wifi,
};

export function LandingContent({
  onBook,
  onFood,
}: {
  onBook?: () => void;
  onFood?: () => void;
}) {
  const { user } = useAuth();
  const avail = useAvailability();
  const games = useGames();
  const food = useFood();
  const reviews = useReviews();
  const gallery = useGallery();
  const arenaImage = useArenaImage();
  const adminSettings = useAdminSettings();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefillTournament, setQuotePrefillTournament] = useState(false);

  const filteredGames = games.filter((g) => {
    if (selectedFilter === "All") return true;
    return g.platform.includes(selectedFilter) || g.tags.includes(selectedFilter);
  });

  const BookLink = ({ className, children }: { className: string; children: React.ReactNode }) =>
    onBook ? (
      <button type="button" onClick={onBook} className={className}>
        {children}
      </button>
    ) : (
      <Link to="/book" className={className}>
        {children}
      </Link>
    );

  return (
    <>
      {/* 1 · HERO SECTION (Screenshot 1) */}
      <section id="top" className="relative flex min-h-[92vh] items-center overflow-hidden pt-20">
        {/* Background arena image */}
        <img
          src={(heroImg || arenaImage) ?? undefined}
          alt="AlphaQ Gaming arena"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />

        {/* Ambient gradients — adapt smoothly to background */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        {/* 3D stage with rotating metallic Q emblem on the right */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-0 hidden w-full lg:block lg:w-[58%]">
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl py-12 lg:py-20">
            {/* Wireframe Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="aq-pulse-dot" />
              <span>ENTER THE ULTIMATE GAMING ARENA</span>
            </div>

            {/* Display Heading - LEVEL UP YOUR GAME */}
            <h1 className="mt-5 font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tight text-foreground leading-[0.95]">
              LEVEL UP
              <br />
              <span className="text-primary text-glow">YOUR GAME</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-xl font-sans text-base sm:text-lg leading-relaxed text-muted-foreground">
              Experience Indore's premier esports lounge equipped with ultra-fast 240Hz esports PCs, PlayStation 5 consoles, and direct-drive racing cockpits with ultra-low ping gigabit fiber.
            </p>

            {/* Buttons matching wireframe */}
            <div className="mt-8 flex flex-wrap gap-4">
              <BookLink className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-[0_10px_28px_var(--primary-shadow-glow)] transition hover:opacity-90 hover:scale-105 active:scale-95">
                [ BOOK A STATION ] <ArrowRight className="h-4 w-4" />
              </BookLink>
              <a
                href="#tournaments"
                className="rounded-full border border-border bg-card/70 px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-foreground transition hover:border-primary/60 hover:text-primary hover:scale-105 active:scale-95"
              >
                [ VIEW TOURNAMENTS ]
              </a>
            </div>

            {/* Stat Counters matching wireframe: 🟢 20+ PCs | 🟢 50+ Games | 🟢 10+ Tournaments */}
            <div className="mt-10 grid grid-cols-3 max-w-lg gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center border-r border-border/60 pr-2 text-center last:border-0">
                <div className="flex items-center gap-1.5 font-display text-2xl font-black text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#25D366]" />
                  <span>20+</span>
                </div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  PCs
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-r border-border/60 px-2 text-center last:border-0">
                <div className="flex items-center gap-1.5 font-display text-2xl font-black text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#25D366]" />
                  <span>50+</span>
                </div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Games
                </div>
              </div>

              <div className="flex flex-col items-center justify-center pl-2 text-center">
                <div className="flex items-center gap-1.5 font-display text-2xl font-black text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#25D366]" />
                  <span>10+</span>
                </div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tournaments
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom Footer row */}
          <div className="flex items-center justify-between border-t border-border pt-6 pb-4 text-xs text-muted-foreground">
            <a href="#zones" className="inline-flex items-center gap-1.5 hover:text-foreground transition">
              Explore Gaming Zones <ArrowDown className="h-3.5 w-3.5 text-primary" />
            </a>
            <span className="font-display font-semibold uppercase tracking-widest text-muted-foreground">
              EST. {BRAND.est} · INDORE
            </span>
          </div>
        </div>
      </section>

      {/* 2 · GAMING ZONES (Wireframe Core Section) */}
      <section id="zones" className="scroll-mt-20 border-t border-border py-20 sm:py-24 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> GAMING ZONES <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground">
              CHOOSE YOUR BATTLEGROUND
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              Engineered for uncompromising competitive performance and immersive entertainment. Pick your zone and claim your seat.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {/* PC ZONE */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_12px_40px_rgba(0,168,255,0.15)]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    20 PCS
                  </span>
                </div>

                <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                  PC ZONE
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ultra-competitive esports battlestations
                </p>

                <div className="mt-5 space-y-2.5 text-xs text-muted-foreground border-y border-border/60 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Graphics</span>
                    <span className="font-mono text-foreground font-semibold">RTX 4070 Ti 12GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Display</span>
                    <span className="font-mono text-foreground font-semibold">240Hz 0.5ms Fast IPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Peripherals</span>
                    <span className="font-mono text-foreground font-semibold">Optical Mechanical + 8K Mouse</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Network</span>
                    <span className="font-mono text-emerald-400 font-semibold">&lt;5ms Low Ping Fiber</span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Rate</span>
                  <div className="font-display text-2xl font-black text-primary">
                    ₹70 <span className="text-xs font-normal text-muted-foreground">/ hr</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <BookLink className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90 active:scale-98">
                  BOOK NOW <ArrowRight className="h-4 w-4" />
                </BookLink>
              </div>
            </div>

            {/* PS5 ZONE */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-primary/40 bg-card/90 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:shadow-[0_12px_40px_rgba(30,224,122,0.2)] card-glow">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Tv className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    6 CONSOLES
                  </span>
                </div>

                <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                  PS5 ZONE
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Living-room style 4K lounge with plush couches
                </p>

                <div className="mt-5 space-y-2.5 text-xs text-muted-foreground border-y border-border/60 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Console</span>
                    <span className="font-mono text-foreground font-semibold">PlayStation 5 Disc</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Screen</span>
                    <span className="font-mono text-foreground font-semibold">65" 4K 120Hz OLED HDR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Controllers</span>
                    <span className="font-mono text-foreground font-semibold">Up to 4 DualSense / Rig</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Group</span>
                    <span className="font-mono text-primary font-semibold">1-4 Players Same Flat Rate</span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Rate</span>
                  <div className="font-display text-2xl font-black text-primary">
                    ₹120 <span className="text-xs font-normal text-muted-foreground">/ hr</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <BookLink className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90 active:scale-98">
                  BOOK NOW <ArrowRight className="h-4 w-4" />
                </BookLink>
              </div>
            </div>

            {/* RACING ZONE */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_12px_40px_rgba(255,68,0,0.15)]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Gauge className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    2 SIM RIGS
                  </span>
                </div>

                <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                  RACING ZONE
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Direct-drive motion &amp; force feedback simulator
                </p>

                <div className="mt-5 space-y-2.5 text-xs text-muted-foreground border-y border-border/60 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Wheelbase</span>
                    <span className="font-mono text-foreground font-semibold">Fanatec Direct Drive 8Nm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Pedals</span>
                    <span className="font-mono text-foreground font-semibold">Load-Cell Hydraulic Feel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Rig Cockpit</span>
                    <span className="font-mono text-foreground font-semibold">Sparco Bucket Seat</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Displays</span>
                    <span className="font-mono text-foreground font-semibold">Triple Curved Ultrawide</span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Rate</span>
                  <div className="font-display text-2xl font-black text-primary">
                    ₹150 <span className="text-xs font-normal text-muted-foreground">/ hr</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <BookLink className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90 active:scale-98">
                  BOOK NOW <ArrowRight className="h-4 w-4" />
                </BookLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · BATTLESTATION */}
      <section id="battlestation" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground flex items-center gap-2">
                <span className="h-0.5 w-6 bg-primary" /> The battlestation
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
                Every part, dialled in
              </h2>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
                Scroll the hero to assemble a full rig in 3D — or explore each component right here. Every card is a keyboard-accessible equivalent of the interactive hotspots.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Mouse className="h-3.5 w-3.5 text-primary" /> Hover, tap or Tab to explore
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOTSPOTS.map((spot) => {
              const Icon = SPOT_ICONS[spot.key] || Cpu;
              return (
                <div
                  key={spot.title}
                  className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{spot.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{spot.body}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            * Exact hardware models &amp; specs are verified before publishing.
          </p>
        </div>
      </section>

      {/* 3 · PRICING */}
      <section id="pricing" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Simple, honest pricing
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
              Pick your platform
            </h2>
            <p className="mt-3 mx-auto max-w-lg text-sm sm:text-base text-muted-foreground">
              Pay by the half-hour, the hour, or grab a heavily-discounted full-day pass. You choose the platform and quantity — we assign the exact setup on arrival.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {adminSettings.pricing.map((p) => (
              <div
                key={p.key}
                className={`rounded-2xl border bg-card/90 p-6 sm:p-8 backdrop-blur-md transition hover:-translate-y-1 ${p.featured ? "border-primary/50 card-glow" : "border-border"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      {p.key === "pc" ? (
                        <Monitor className="h-6 w-6" />
                      ) : p.key === "racing" ? (
                        <Gauge className="h-6 w-6 text-amber-400" />
                      ) : (
                        <Tv className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.tagline}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {p.capacity}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {p.tiers.map((t, i) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {t.label}
                        {i === p.tiers.length - 1 && (
                          <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Best value
                          </span>
                        )}
                      </span>
                      <span className="font-display text-xl font-bold text-foreground">
                        {formatINR(t.price)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">/ {t.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> {p.note}
                </p>

                <BookLink className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90">
                  Book {p.name} <ArrowRight className="h-4 w-4" />
                </BookLink>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Advance bookings require full online payment and are confirmed after a quick manual approval — payment alone is never a final confirmation.
          </p>
        </div>
      </section>

      {/* 4 · WHY ALPHAQ */}
      <section id="why" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Why AlphaQ
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
                Built for gamers who care
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                Performance hardware, fast internet and a genuinely clean, welcoming space — the details that turn a session into a habit.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {adminSettings.stats.map((s) => (
                  <div key={s.label} className="border-l-2 border-primary pl-4">
                    <div className="font-display text-3xl font-extrabold text-primary">{s.value}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f, i) => {
                const ICONS = [Cpu, Wifi, Armchair, Sparkles];
                const Icon = ICONS[i % ICONS.length]!;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-md"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5 · GAMES */}
      <section id="games" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        {/* Wireframe Ticker Bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-12">
          <div className="rounded-2xl border border-border bg-card/90 p-4 sm:p-5 backdrop-blur-md overflow-hidden relative shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary shrink-0">
                <Gamepad2 className="h-4 w-4" />
                <span>TOP PLAYED TITLES</span>
              </div>
              <div className="flex items-center gap-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground/90 overflow-x-auto py-1 scrollbar-none">
                <span className="text-primary hover:text-primary transition cursor-pointer">VALORANT</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="hover:text-primary transition cursor-pointer">CS2</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="hover:text-primary transition cursor-pointer">GTA V</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="hover:text-primary transition cursor-pointer">FC 26</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="hover:text-primary transition cursor-pointer">TEKKEN 8</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="hover:text-primary transition cursor-pointer">FORZA HORIZON 5</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="hover:text-primary transition cursor-pointer">APEX LEGENDS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Ready to play
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
                GAMES LIBRARY
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "PC", "PS5", "Competitive", "Casual"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No games currently match this filter. Titles can be managed via the admin panel.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGames.map((g) => (
                <div
                  key={g.title}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md transition hover:border-primary/40 min-h-[140px]"
                >
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
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {g.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            More titles are added regularly — full library published once staff verifies availability.
          </p>
        </div>
      </section>

      {/* 6 · PS5 LOUNGE BAND */}
      <section id="ps5" className="scroll-mt-20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-border bg-gradient-to-r from-card to-muted p-8 sm:p-12 overflow-hidden relative">
            <div className="max-w-xl">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                PS5 couch lounge
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground">
                Big TV. Comfy couch. Four controllers of chaos.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Grab the squad and settle into the PS5 lounge — one flat price per console, whether it's just you or all four of you.
              </p>
              <div className="mt-6 flex flex-wrap gap-8">
                <div>
                  <div className="font-display text-3xl font-extrabold text-primary">₹120<span className="text-sm font-normal text-muted-foreground">/hr</span></div>
                  <div className="text-xs text-muted-foreground">per console</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-extrabold text-primary">1–4</div>
                  <div className="text-xs text-muted-foreground">players, same price</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-extrabold text-primary">₹600</div>
                  <div className="text-xs text-muted-foreground">full-day pass</div>
                </div>
              </div>
              <a
                href="#pricing"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
              >
                Book the PS5 lounge <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="pointer-events-none absolute -right-8 -bottom-8 hidden lg:block opacity-10 text-primary">
              <Tv className="h-80 w-80" />
            </div>
          </div>
        </div>
      </section>

      {/* 7 · FOOD & DRINKS */}
      <section id="food" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Fuel the grind
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
                Food &amp; Drinks, to your seat
              </h2>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
                Order from your PC desk or PS5 couch — it's delivered straight to your setup. Logged-in gamers only; pay online, by reward points or at the counter.
              </p>
            </div>
            {user ? (
              onFood ? (
                <button
                  type="button"
                  onClick={onFood}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 cursor-pointer"
                >
                  Order from your setup <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href="/dashboard#food"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50"
                >
                  Order from your setup <ArrowRight className="h-4 w-4" />
                </a>
              )
            ) : (
              <a
                href="/auth?redirect=/dashboard#food"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50"
              >
                Order from your setup <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* food cards */}
          {food.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Café menu items will be updated soon. Items can be managed via the admin panel.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {food.slice(0, 6).map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/80 p-5 text-center backdrop-blur-md transition hover:-translate-y-1 hover:border-primary/40"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="mb-3 h-10 w-10 rounded-xl object-cover border border-primary/20 bg-muted"
                    />
                  ) : (
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Coffee className="h-5 w-5" />
                    </div>
                  )}
                  <div className="text-sm font-semibold text-foreground">{item.name}</div>
                  <div className="my-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.category}
                  </div>
                  <div className="mt-1 font-display text-base font-bold text-primary">
                    {formatINR(item.price)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8 · BIRTHDAYS & GROUPS */}
      <section id="birthdays" className="scroll-mt-20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-card to-background p-8 sm:p-14 text-center card-glow">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Birthdays &amp; groups
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
              Throw the party they'll screenshot
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Reserve a cluster of PCs or the PS5 lounge, add food and a mini-tournament, and we'll tailor a quote. A small deposit locks it in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => { setQuotePrefillTournament(false); setQuoteOpen(true); }}
                className="rounded-full bg-primary px-8 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
              >
                Request a group quote
              </button>
              <button
                type="button"
                onClick={() => { setQuotePrefillTournament(true); setQuoteOpen(true); }}
                className="rounded-full border border-border bg-card/60 px-8 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary/50"
              >
                Add a mini-tournament
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments — pass onQuoteOpen so Register your team opens modal */}
      <TournamentsSection onGroupQuote={() => { setQuotePrefillTournament(false); setQuoteOpen(true); }} />

      {/* 10 · THE ARENA (Gallery + Reviews) */}
      <section id="reviews" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          {/* Main Reviews + Gallery */}
          <div className="grid gap-12 lg:grid-cols-12">

            {/* Gallery Column */}
            <div className="lg:col-span-5">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                The arena
              </p>

              <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl">
                Real space, real reviews
              </h2>

              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                A peek inside AlphaQ, plus verified words from gamers who've booked and played.
              </p>

              {/* Exactly 4 images */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {gallery.length > 0 ? (
                  gallery.slice(0, 4).map((g) => (
                    <div
                      key={g.id}
                      className="aspect-[4/3] overflow-hidden rounded-xl border border-border card-glow"
                    >
                      <img
                        src={g.url}
                        alt={g.caption || "AlphaQ arena"}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  [1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-card p-4 text-center"
                    >
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Arena photo
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reviews Column */}
            <div className="lg:col-span-7">

              {/* Fixed review viewport */}
              <div className="h-[620px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-primary/30">
                {reviews === null ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      Loading reviews…
                    </span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-card/80 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No reviews yet — be the first to share your experience!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r, i) => {
                      const initial = r.name.charAt(0).toUpperCase();

                      return (
                        <div
                          key={r.id || `${r.handle}-${i}`}
                          className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-xs font-bold text-primary-foreground">
                                {initial}
                              </span>

                              <div>
                                <div className="text-sm font-semibold text-foreground">
                                  {r.name}
                                </div>

                                <div className="text-[11px] text-primary">
                                  {r.handle}
                                </div>
                              </div>
                            </div>

                            <StarRating rating={r.rating} />
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            "{r.body}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Full Width Share Your Experience */}
          <div className="mt-10">
            <ReviewForm />
          </div>

        </div>
      </section>

      {/* 11 · VISIT US (Screenshot 4) */}
      <section id="visit" className="scroll-mt-20 border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-12 items-stretch">
            {/* Left info column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Visit us
                </p>
                <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-foreground">
                  Come play
                </h2>

                <ul className="mt-8 space-y-5 text-sm">
                  <li className="flex items-start gap-4">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{BRAND.full}</div>
                      {adminSettings.address ? (
                        <div className="text-xs text-muted-foreground mt-0.5">{adminSettings.address}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">{adminSettings.city}, India</div>
                      )}
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{adminSettings.hours}</div>
                      <div className="text-xs text-muted-foreground">Closed Mondays</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <a href={`tel:${adminSettings.phone}`} className="font-medium text-foreground hover:text-primary transition">
                        {adminSettings.phone}
                      </a>
                      <div className="text-xs text-muted-foreground">Call for urgent changes</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={
                    adminSettings.address
                      ? (adminSettings.address.startsWith("http")
                        ? adminSettings.address  // direct Google Maps link
                        : `https://maps.google.com/?q=${encodeURIComponent(adminSettings.address)}`)
                      : `https://maps.google.com/?q=${encodeURIComponent("AlphaQ Gaming " + adminSettings.city)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-primary px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_4px_14px_rgba(30,224,122,0.4)] transition hover:opacity-90 flex items-center gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5" /> Get directions
                </a>
              </div>
            </div>

            {/* Right dark grid map card with arena image background */}
            <div className="lg:col-span-7">
              <div className="relative min-h-[340px] h-full rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center">
                {/* Arena image as background */}
                <img
                  src={(arenaImage || heroImg) ?? undefined}
                  alt="AlphaQ Gaming arena"
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Grid overlay with dark tint */}
                <div className="absolute inset-0 bg-background/70 bg-hairline-grid" />

                {/* Normal map pin */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>

                {/* Bottom badge matching Screenshot 4 */}
                <div className="absolute left-4 bottom-4 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-md">
                    <MapIcon className="h-3 w-3" /> Google Maps embed — location marker added at launch
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <GroupQuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        prefillTournament={quotePrefillTournament}
      />
    </>
  );
}
