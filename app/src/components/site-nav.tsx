import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowRight, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { label: "Setups", href: "/#battlestation" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Games", href: "/#games" },
  { label: "Food", href: "/#food" },
  { label: "Events", href: "/#tournaments" },
  { label: "Visit", href: "/#visit" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary font-display text-sm font-extrabold text-primary-foreground shadow-[0_4px_16px_var(--primary-shadow-glow)]">
            AQ
          </span>
          <span className="font-display text-xl font-bold tracking-wider text-foreground">
            ALPHAQ
          </span>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
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
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/50"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/50"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <Link
                to="/book"
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
              >
                Book a setup
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-full border border-border bg-card/40 px-5 py-1.5 text-sm font-semibold text-foreground/90 transition hover:border-primary/50 hover:text-foreground"
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground shadow-[0_6px_20px_var(--primary-shadow-glow)] transition hover:opacity-90"
              >
                Sign up <ArrowRight className="h-4 w-4" />
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

