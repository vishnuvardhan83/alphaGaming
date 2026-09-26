import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowRight, LogOut, LayoutDashboard, Shield, Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { label: "HOME", href: "/#top" },
  { label: "GAMES", href: "/#games" },
  { label: "CAFÉ", href: "/#food" },
  { label: "TOURNAMENTS", href: "/#tournaments" },
  { label: "PRICING", href: "/#pricing" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep font-display text-sm font-extrabold text-primary-foreground shadow-[0_0_20px_var(--primary-glow)] transition group-hover:scale-105">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-widest text-foreground leading-none">
              ALPHAQ
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-primary font-semibold">
              Esports Arena
            </span>
          </div>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-display text-xs font-bold tracking-wider text-muted-foreground transition hover:text-foreground hover:text-glow"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right CTA buttons & Theme Toggle */}
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle className="hidden" />

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-foreground transition hover:border-primary/50"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary/20"
                >
                  <Shield className="h-3.5 w-3.5" /> Staff Portal
                </Link>
              )}
              <Link
                to="/book"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[0_0_20px_var(--primary-glow)] transition hover:opacity-90 hover:scale-105 active:scale-95"
              >
                BOOK NOW
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-lg border border-border bg-card/50 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-foreground transition hover:border-primary/50"
              >
                Login
              </Link>
              <Link
                to="/book"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[0_0_20px_var(--primary-glow)] transition hover:opacity-90 hover:scale-105 active:scale-95"
              >
                BOOK NOW
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button & Theme toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle className="hidden" />
          <button
            className="rounded-md p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-background/98 px-6 py-5 lg:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 text-base font-medium text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-border">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-border px-4 py-2 text-center text-sm font-medium text-foreground"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/book"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Book
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

