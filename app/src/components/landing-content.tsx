import { Link } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  Cpu,
  Wifi,
  Armchair,
  Sparkles,
  Star,
  MapPin,
  Clock,
  UtensilsCrossed,
  Monitor,
  Tv,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { TournamentsSection } from "@/components/tournaments-section";
import { AqEmblem } from "@/components/aq-emblem";
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
  REVIEWS,
  STATS,
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
} from "@/lib/db";
import type { Review, GalleryImage } from "@/lib/db";
import heroImg from "@/assets/hero-arena.jpg";

const FEATURE_ICONS = [Cpu, Wifi, Armchair, Sparkles];

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
      .catch(() => {});
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
      .catch(() => {});
  }, []);
  return food;
}

// Reviews: prefer admin-approved reviews, fall back to static content.
function useReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  useEffect(() => {
    void listReviews()
      .then((list) => {
        if (list.length > 0) setReviews(list);
      })
      .catch(() => {});
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
      .catch(() => {});
  }, []);
  return url;
}

// Gallery: admin-managed photos of the space; empty until admins upload some.
function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  useEffect(() => {
    void listGallery()
      .then((list) => setImages(list))
      .catch(() => {});
  }, []);
  return images;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-primary text-primary" : "text-border"
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
      <h3 className="font-display text-lg font-semibold">Share your experience</h3>
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
                className={`h-6 w-6 ${
                  value <= rating ? "fill-primary text-primary" : "text-border"
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
        className="mt-4 w-full resize-none rounded-lg border border-border bg-background/50 px-4 py-3 text-sm outline-none transition focus:border-primary/60"
      />
      <button
        type="submit"
        disabled={submitting || body.trim().length === 0}
        className="mt-4 flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Submit review"} <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export function LandingContent({ onBook }: { onBook?: () => void }) {
  const avail = useAvailability();
  const games = useGames();
  const food = useFood();
  const reviews = useReviews();
  const gallery = useGallery();
  const arenaImage = useArenaImage();

  // Inside the logged-in shell, `onBook` opens the booking form in-place;
  // on the public landing it falls back to the /book route.
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
      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <img
          src={heroImg}
          alt="AlphaQ Gaming arena — rows of glowing PC battlestations and a PS5 lounge"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 -z-0">
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-[6%] z-[5] hidden items-center lg:flex">
          <AqEmblem className="w-[30vw] max-w-md drop-shadow-[0_0_45px_rgba(30,224,122,0.55)]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.35em] text-primary">
            {"{ Play beyond limits }"}
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Indore's
            <br />
            next-level
            <br />
            <span className="text-primary text-glow">gaming café</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            High-end PC &amp; PS5 setups, low-ping internet and a clean, family-friendly arena for
            every gamer. Book ahead, order food to your seat, and compete.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookLink className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90">
              Book a setup now <ArrowRight className="h-4 w-4" />
            </BookLink>
            <a
              href="#battlestation"
              className="rounded-md border border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              Explore battlestation
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <span className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {avail.pc}/{avail.totalPc} PCs open
            </span>
            <span className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {avail.ps5}/{avail.totalPs5} PS5s open
            </span>
            <span className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Open until 8 PM
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Battlestation / features */}
      <section id="battlestation" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          The battlestation
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Built for serious play
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]!;
            return (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition hover:border-primary/50 hover:card-glow"
              >
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 border-y border-border bg-card/40 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Simple, per-setup rates
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {PRICING.map((p) => (
              <div
                key={p.key}
                className={`rounded-xl border bg-card p-8 ${
                  p.featured ? "border-primary/60 card-glow" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.key === "pc" ? (
                      <Monitor className="h-8 w-8 text-primary" />
                    ) : (
                      <Tv className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <h3 className="font-display text-xl font-bold">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.tagline}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {p.capacity}
                  </span>
                </div>
                <div className="mt-6 space-y-3">
                  {p.tiers.map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground">{t.label}</span>
                      <span className="font-display text-lg font-bold text-primary">
                        {formatINR(t.price)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          / {t.unit}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{p.note}</p>
                <BookLink className="mt-6 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90">
                  Book {p.name} <ArrowRight className="h-4 w-4" />
                </BookLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="games" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Game library
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Installed &amp; ready</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <div
              key={g.title}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
            >
              <h3 className="font-display text-lg font-semibold">{g.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.platform.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary"
                  >
                    {p}
                  </span>
                ))}
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Food */}
      <section id="food" className="scroll-mt-24 border-y border-border bg-card/40 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Café menu
            </p>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Food to your seat
          </h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Order from your setup — staff delivers without pausing your session.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {food.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <h3 className="font-medium">{f.name}</h3>
                  <p className="text-xs text-muted-foreground">{f.category}</p>
                </div>
                <span className="font-display font-bold text-primary">{formatINR(f.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tournaments */}
      <TournamentsSection />

      {/* Reviews + Gallery */}
      <section className="border-y border-border bg-card/40 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            The arena
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Real space, real reviews
          </h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            {/* Gallery — shows 6 photos; scrolls if there are more. */}
            <div>
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-3">
                  {gallery.length > 0
                    ? gallery.map((g) => (
                        <div
                          key={g.id}
                          className="aspect-square overflow-hidden rounded-xl border border-border card-glow"
                        >
                          <img
                            src={g.url}
                            alt={g.caption || "AlphaQ arena"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))
                    : Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex aspect-square items-center justify-center rounded-xl border border-border bg-background/40 p-2 text-center"
                        >
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Photo soon
                          </span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

            {/* Reviews + write-a-review */}
            <div className="space-y-6">
              {/* Shows ~3 reviews; scroll for the rest. */}
              <div className="max-h-[470px] space-y-6 overflow-y-auto pr-1">
              {((reviews ?? REVIEWS) as Array<Review | (typeof REVIEWS)[number]>).map((r, i) => {
                const verified = "verified" in r ? r.verified : false;
                return (
                  <div
                    key={"id" in r ? r.id : `${r.handle}-${i}`}
                    className="rounded-xl border border-border bg-card p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StarRating rating={r.rating} />
                      {verified && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          Verified visit
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">“{r.body}”</p>
                    <p className="mt-4 text-sm font-semibold">
                      {r.name}{" "}
                      <span className="ml-1 text-xs text-primary">{r.handle}</span>
                    </p>
                  </div>
                );
              })}
              </div>

              <ReviewForm />
            </div>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section id="visit" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Visit us
              </p>
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Drop in. Squad up.
            </h2>
            <ul className="mt-8 space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {BRAND.city}
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {BRAND.hours} · {BRAND.closed}
              </li>
            </ul>
            <BookLink className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90">
              Reserve your seat <ArrowRight className="h-4 w-4" />
            </BookLink>
          </div>
          <div className="overflow-hidden rounded-xl border border-border card-glow">
            <img
              src={arenaImage || heroImg}
              alt="Inside the AlphaQ arena"
              loading="lazy"
              width={1920}
              height={1088}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
