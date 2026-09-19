import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gamepad2, AtSign, Mail, Phone } from "lucide-react";
import { BRAND } from "@/lib/content";
import { getSettings, type Settings } from "@/lib/db";

function prettyPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d ? `+${d}` : "";
}

export function SiteFooter() {
  const [s, setS] = useState<Partial<Settings>>({});
  useEffect(() => {
    void getSettings()
      .then(setS)
      .catch(() => {});
  }, []);

  const city = s.city || BRAND.city;
  const hours = s.hours || BRAND.hours;
  const phone = prettyPhone(s.phone || BRAND.phone);
  const email = s.email || BRAND.email;
  const instagram = s.instagram || BRAND.instagram;

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-widest">
              ALPHA<span className="text-primary">Q</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {BRAND.tagline}. Premium gaming café in {city} — high-end PCs, PS5 lounge,
            low-ping internet and great food.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">Visit</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{city}</li>
            <li>{hours}</li>
            <li>{BRAND.closed}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> {phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> {email}
            </li>
            <li className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-primary" /> @{instagram}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND.full} · Est. {BRAND.est} ·{" "}
        <Link to="/" className="hover:text-primary">
          {BRAND.tagline}
        </Link>
      </div>
    </footer>
  );
}
