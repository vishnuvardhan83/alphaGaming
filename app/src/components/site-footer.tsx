import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, CalendarX } from "lucide-react";
import { BRAND } from "@/lib/content";
import { getSettings, type Settings } from "@/lib/db";

// Instagram icon SVG component
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "h-4 w-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}


export function SiteFooter() {
  const [s, setS] = useState<Partial<Settings>>({});
  useEffect(() => {
    void getSettings()
      .then(setS)
      .catch(() => { });
  }, []);

  const city = s.city || BRAND.city;
  const hours = s.hours || BRAND.hours;
  const phone = s.phone || BRAND.phone;
  const email = s.email || BRAND.email;
  const instagram = s.instagram || BRAND.instagram;
  const address = s.address || "";

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="border-t border-white/[0.08] bg-[#06090b] text-[#e9f2ec]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
            {/* Column 1: Brand & Bio */}
            <div className="lg:col-span-5">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6bffab] to-[#0fb866] font-display text-sm font-extrabold text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.45)]">
                  AQ
                </span>
                <span className="font-display text-2xl font-bold tracking-wider text-white">
                  ALPHAQ GAMING
                </span>
              </Link>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#8ba095]">
                Indore's next-level gaming café. High-end PC &amp; PS5 setups, low-ping internet and a clean, family-friendly arena.
              </p>
              {/* Social icons */}
              <div className="mt-5 flex items-center gap-2.5">
                <a
                  href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/80 transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href={`mailto:${email}`}
                  aria-label="Email"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/80 transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <a
                  href={`tel:${phone}`}
                  aria-label="Phone"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/80 transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                </a>
                {/* Chat with us — email */}
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Chat with AlphaQ Gaming")}`}
                  className="ml-1 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 hover:border-primary"
                >
                  <Mail className="h-3.5 w-3.5" /> Chat with us
                </a>
              </div>
            </div>

            {/* Column 2: Explore */}
            <div className="lg:col-span-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[#8ba095]">
                Explore
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href="#battlestation" className="text-[#8ba095] transition hover:text-white">
                    Setups
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-[#8ba095] transition hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#games" className="text-[#8ba095] transition hover:text-white">
                    Games
                  </a>
                </li>
                <li>
                  <a href="#food" className="text-[#8ba095] transition hover:text-white">
                    Food
                  </a>
                </li>
                <li>
                  <a href="#tournaments" className="text-[#8ba095] transition hover:text-white">
                    Events
                  </a>
                </li>
                <li>
                  <a href="#visit" className="text-[#8ba095] transition hover:text-white">
                    Visit
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Account */}
            <div className="lg:col-span-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[#8ba095]">
                Account
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link to="/auth" className="text-[#8ba095] transition hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/book" className="text-[#8ba095] transition hover:text-white">
                    Book a setup
                  </Link>
                </li>
                <li>
                  <a href="#food" className="text-[#8ba095] transition hover:text-white">
                    Order food
                  </a>
                </li>
                <li>
                  <a href="#tournaments" className="text-[#8ba095] transition hover:text-white">
                    Tournaments
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Visit Us */}
            <div className="lg:col-span-3">
              <h3 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[#8ba095]">
                Visit Us
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-[#8ba095]">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{address || city + ", India"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{hours}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{BRAND.closed}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{phone}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row text-xs text-[#8ba095]">
            <p>© {currentYear} {BRAND.full} · Est. {BRAND.est} · {city}</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Terms</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Refund policy</a>
            </div>
          </div>
        </div>
      </footer>

    </>
  );
}

