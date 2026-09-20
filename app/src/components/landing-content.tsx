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
  GAMES,
  FOOD,
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

// Games grid: prefer admin-managed catalogue, fall back to static content.
function useGames() {
  const [games, setGames] = useState<{ title: string; platform: string[]; tags: string[] }[]>(GAMES);
  useEffect(() => {
    void listGames(true)
      .then((list) => {
        if (list.length > 0) {
          setGames(list.map((g) => ({ title: g.title, platform: g.platform, tags: g.tags })));
        }
      })
      .catch(() => { });
  }, []);
  return games;
}

// Food preview grid: prefer admin-managed menu, fall back to static content.
function useFood() {
  const [food, setFood] = useState<{ name: string; category: string; price: number }[]>(FOOD);
  useEffect(() => {
    void listFood(true)
      .then((list) => {
        if (list.length > 0) {
          setFood(list.map((f) => ({ name: f.name, category: f.category, price: f.price })));
        }
      })
      .catch(() => { });
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
        : [
          { label: "30 minutes", price: Number(s.ps5Price30m) || p.tiers[0]!.price, unit: "30 min" },
          { label: "Per hour", price: Number(s.ps5Price1h) || p.tiers[1]!.price, unit: "hour" },
          { label: "Full-day pass", price: Number(s.ps5PriceDay) || p.tiers[2]!.price, unit: "day" },
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
      <div className="rounded-xl border border-white/10 bg-[#0c1114] p-6 text-center">
        <p className="text-sm text-[#8ba095]">
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
      className="rounded-xl border border-white/10 bg-[#0c1114] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-white">Share your experience</h3>
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
                className={`h-6 w-6 ${value <= rating ? "fill-primary text-primary" : "text-white/20"
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
        className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-[#06090b] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60"
      />
      <button
        type="submit"
        disabled={submitting || body.trim().length === 0}
        className="mt-4 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-[#04140b] shadow-[0_4px_14px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab] disabled:opacity-50"
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
        {/* Background arena image from before */}
        <img
          src={(heroImg || arenaImage) ?? undefined}
          alt="AlphaQ Gaming arena"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />

        {/* Ambient gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06090b] via-[#06090b]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06090b] to-transparent" />

        {/* 3D stage with rotating metallic green Q emblem on the right */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-0 hidden w-full lg:block lg:w-[58%]">
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl py-12 lg:py-20">
            {/* Eyebrow */}
            <p className="font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-[#8ba095] flex items-center gap-2">
              <span className="text-primary font-bold">&#123;</span> Play beyond limits <span className="text-primary font-bold">&#125;</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </p>

            {/* Display Heading */}
            <h1 className="mt-4 font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold uppercase tracking-tight text-white leading-[0.92]">
              Indore's
              <br />
              next-level
              <br />
              <span className="text-primary text-glow">gaming café</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#8ba095]">
              High-end PC &amp; PS5 setups, low-ping internet and a clean, family-friendly arena for every gamer. Book ahead, order food to your seat, and compete.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <BookLink className="flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-[#04140b] shadow-[0_10px_28px_rgba(30,224,122,0.45)] transition hover:bg-[#6bffab] hover:scale-105 active:scale-95">
                Book a setup now <ArrowRight className="h-4 w-4" />
              </BookLink>
              <a
                href="#battlestation"
                className="rounded-full border border-white/20 bg-white/[0.02] px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:border-primary/60 hover:text-primary hover:scale-105 active:scale-95"
              >
                Explore battlestation
              </a>
            </div>

            {/* Availability Badges */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="aq-pulse-dot" />
                {avail.pc}/{avail.totalPc} PCS OPEN
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="aq-pulse-dot" />
                {avail.ps5}/{avail.totalPs5} PS5S OPEN
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#8ba095]">
                OPEN UNTIL 8 PM
              </span>
            </div>
          </div>

          {/* Hero Bottom Footer row */}
          <div className="flex items-center justify-between border-white/[0.08] pt-6 pb-4 text-xs text-[#8ba095]">
            <a href="#battlestation" className="inline-flex items-center gap-1.5 hover:text-white transition">
              Scroll for more <ArrowDown className="h-3.5 w-3.5" />
            </a>
            <span className="font-display font-semibold uppercase tracking-widest text-[#8ba095]">
              EST. {BRAND.est}
            </span>
          </div>
        </div>
      </section>

      {/* 2 · BATTLESTATION */}
      <section id="battlestation" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095] flex items-center gap-2">
                <span className="h-0.5 w-6 bg-primary" /> The battlestation
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
                Every part, dialled in
              </h2>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-[#8ba095]">
                Scroll the hero to assemble a full rig in 3D — or explore each component right here. Every card is a keyboard-accessible equivalent of the interactive hotspots.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-[#8ba095]">
              <Mouse className="h-3.5 w-3.5 text-primary" /> Hover, tap or Tab to explore
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOTSPOTS.map((spot) => {
              const Icon = SPOT_ICONS[spot.key] || Cpu;
              return (
                <div
                  key={spot.title}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{spot.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#8ba095] leading-relaxed">{spot.body}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[#8ba095]">
            * Exact hardware models &amp; specs are verified before publishing.
          </p>
        </div>
      </section>

      {/* 3 · PRICING */}
      <section id="pricing" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
              Simple, honest pricing
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
              Pick your platform
            </h2>
            <p className="mt-3 mx-auto max-w-lg text-sm sm:text-base text-[#8ba095]">
              Pay by the half-hour, the hour, or grab a heavily-discounted full-day pass. You choose the platform and quantity — we assign the exact setup on arrival.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {adminSettings.pricing.map((p) => (
              <div
                key={p.key}
                className={`rounded-2xl border bg-[#0c1114]/90 p-8 backdrop-blur-md transition hover:-translate-y-1 ${p.featured ? "border-primary/50 card-glow" : "border-white/[0.08]"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      {p.key === "pc" ? <Monitor className="h-6 w-6" /> : <Tv className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-[#8ba095]">{p.tagline}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#8ba095]">
                    {p.capacity}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {p.tiers.map((t, i) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between border-b border-white/[0.06] pb-3 last:border-0"
                    >
                      <span className="text-sm text-[#8ba095]">
                        {t.label}
                        {i === p.tiers.length - 1 && (
                          <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Best value
                          </span>
                        )}
                      </span>
                      <span className="font-display text-xl font-bold text-white">
                        {formatINR(t.price)}
                        <span className="ml-1 text-xs font-normal text-[#8ba095]">/ {t.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-[#8ba095] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> {p.note}
                </p>

                <BookLink className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab]">
                  Book {p.name} <ArrowRight className="h-4 w-4" />
                </BookLink>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[#8ba095]">
            Advance bookings require full online payment and are confirmed after a quick manual approval — payment alone is never a final confirmation.
          </p>
        </div>
      </section>

      {/* 4 · WHY ALPHAQ */}
      <section id="why" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
                Why AlphaQ
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
                Built for gamers who care
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#8ba095]">
                Performance hardware, fast internet and a genuinely clean, welcoming space — the details that turn a session into a habit.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {adminSettings.stats.map((s) => (
                  <div key={s.label} className="border-l-2 border-primary pl-4">
                    <div className="font-display text-3xl font-extrabold text-primary">{s.value}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8ba095]">
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
                    className="rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-6 backdrop-blur-md"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">{f.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#8ba095] leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5 · GAMES */}
      <section id="games" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
                Ready to play
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
                The library
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "PC", "PS5", "Competitive", "Casual"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedFilter === filter
                    ? "bg-primary text-[#04140b]"
                    : "border border-white/10 text-[#8ba095] hover:text-white hover:border-white/20"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((g) => (
              <div
                key={g.title}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-5 backdrop-blur-md transition hover:border-primary/40 min-h-[140px]"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-bold text-white">{g.title}</h3>
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
                      className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] text-[#8ba095]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#8ba095]">
            More titles are added regularly — full library published once staff verifies availability.
          </p>
        </div>
      </section>

      {/* 6 · PS5 LOUNGE BAND */}
      <section id="ps5" className="scroll-mt-20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1114] to-[#141f19] p-8 sm:p-12 overflow-hidden relative">
            <div className="max-w-xl">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
                PS5 couch lounge
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Big TV. Comfy couch. Four controllers of chaos.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#8ba095] leading-relaxed">
                Grab the squad and settle into the PS5 lounge — one flat price per console, whether it's just you or all four of you.
              </p>
              <div className="mt-6 flex flex-wrap gap-8">
                <div>
                  <div className="font-display text-3xl font-extrabold text-primary">₹120<span className="text-sm font-normal text-[#8ba095]">/hr</span></div>
                  <div className="text-xs text-[#8ba095]">per console</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-extrabold text-primary">1–4</div>
                  <div className="text-xs text-[#8ba095]">players, same price</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-extrabold text-primary">₹600</div>
                  <div className="text-xs text-[#8ba095]">full-day pass</div>
                </div>
              </div>
              <a
                href="#pricing"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab]"
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

      {/* 7 · FOOD & DRINKS (Screenshot 2) */}
      <section id="food" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
                Fuel the grind
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
                Food &amp; Drinks, to your seat
              </h2>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-[#8ba095]">
                Order from your PC desk or PS5 couch — it's delivered straight to your setup. Logged-in gamers only; pay online, by reward points or at the counter.
              </p>
            </div>
            {user ? (
              onFood ? (
                <button
                  type="button"
                  onClick={onFood}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-primary/50 hover:text-white cursor-pointer"
                >
                  Order from your setup <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href="/dashboard#food"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-primary/50 hover:text-white"
                >
                  Order from your setup <ArrowRight className="h-4 w-4" />
                </a>
              )
            ) : (
              <a
                href="/auth?redirect=/dashboard#food"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-primary/50 hover:text-white"
              >
                Order from your setup <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* 6 food cards matching Screenshot 2 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {food.slice(0, 6).map((item) => (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-5 text-center backdrop-blur-md transition hover:-translate-y-1 hover:border-primary/40"
              >
                {/* Green cup line icon */}
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Coffee className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                <div className="my-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ba095]">
                  {item.category}
                </div>
                <div className="mt-1 font-display text-base font-bold text-primary">
                  {formatINR(item.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · BIRTHDAYS & GROUPS */}
      <section id="birthdays" className="scroll-mt-20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-[#0c1114] to-[#06090b] p-8 sm:p-14 text-center card-glow">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
              Birthdays &amp; groups
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
              Throw the party they'll screenshot
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-sm sm:text-base text-[#8ba095] leading-relaxed">
              Reserve a cluster of PCs or the PS5 lounge, add food and a mini-tournament, and we'll tailor a quote. A small deposit locks it in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => { setQuotePrefillTournament(false); setQuoteOpen(true); }}
                className="rounded-full bg-primary px-8 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab]"
              >
                Request a group quote
              </button>
              <button
                type="button"
                onClick={() => { setQuotePrefillTournament(true); setQuoteOpen(true); }}
                className="rounded-full border border-white/20 bg-white/[0.02] px-8 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-white transition hover:border-primary/50"
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
      <section id="reviews" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          {/* Main Reviews + Gallery */}
          <div className="grid gap-12 lg:grid-cols-12">

            {/* Gallery Column */}
            <div className="lg:col-span-5">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
                The arena
              </p>

              <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
                Real space, real reviews
              </h2>

              <p className="mt-3 text-sm text-[#8ba095] sm:text-base">
                A peek inside AlphaQ, plus verified words from gamers who've booked and played.
              </p>

              {/* Exactly 4 images */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {gallery.length > 0 ? (
                  gallery.slice(0, 4).map((g) => (
                    <div
                      key={g.id}
                      className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 card-glow"
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
                      className="flex aspect-[4/3] items-center justify-center rounded-xl border border-white/10 bg-[#0c1114] p-4 text-center"
                    >
                      <span className="text-xs uppercase tracking-wider text-[#8ba095]">
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
              <div className="h-[620px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-primary/30">
                {reviews === null ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-[#8ba095]">
                      Loading reviews…
                    </span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-6 text-center">
                    <p className="text-sm text-[#8ba095]">
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
                          className="rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-5 backdrop-blur-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6bffab] to-[#0fb866] font-display text-xs font-bold text-[#04140b]">
                                {initial}
                              </span>

                              <div>
                                <div className="text-sm font-semibold text-white">
                                  {r.name}
                                </div>

                                <div className="text-[11px] text-primary">
                                  {r.handle}
                                </div>
                              </div>
                            </div>

                            <StarRating rating={r.rating} />
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-[#8ba095]">
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
      <section id="visit" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-12 items-stretch">
            {/* Left info column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
                  Visit us
                </p>
                <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
                  Come play
                </h2>

                <ul className="mt-8 space-y-5 text-sm">
                  <li className="flex items-start gap-4">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium text-white">{BRAND.full}</div>
                      {adminSettings.address ? (
                        <div className="text-xs text-[#8ba095] mt-0.5">{adminSettings.address}</div>
                      ) : (
                        <div className="text-xs text-[#8ba095]">{adminSettings.city}, India</div>
                      )}
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium text-white">{adminSettings.hours}</div>
                      <div className="text-xs text-[#8ba095]">Closed Mondays</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <a href={`tel:${adminSettings.phone}`} className="font-medium text-white hover:text-primary transition">
                        {adminSettings.phone}
                      </a>
                      <div className="text-xs text-[#8ba095]">Call for urgent changes</div>
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
                  className="rounded-full bg-primary px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_4px_14px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab] flex items-center gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5" /> Get directions
                </a>
              </div>
            </div>

            {/* Right dark grid map mockup matching Screenshot 4 */}
            <div className="lg:col-span-7">
              <div className="relative min-h-[340px] h-full rounded-2xl border border-white/[0.08] bg-[#080c0a] overflow-hidden flex items-center justify-center bg-hairline-grid">
                {/* Glowing green location pin */}
                <div className="flex flex-col items-center justify-center">
                  <MapPin className="h-12 w-12 text-primary aq-bob-pin drop-shadow-[0_8px_24px_rgba(30,224,122,0.7)]" />
                </div>

                {/* Bottom badge matching Screenshot 4 */}
                <div className="absolute left-4 bottom-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0c1114]/90 px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-wider text-[#8ba095] backdrop-blur-md">
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
