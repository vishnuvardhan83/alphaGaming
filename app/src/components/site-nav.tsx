import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Gamepad2, Menu, X, LogOut, LayoutDashboard, Shield, CalendarClock } from "lucide-react";
import { useAuth } from "@/lib/auth";

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-widest">
            ALPHA<span className="text-primary">Q</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link
                to="/book"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Book a setup
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:border-primary/50"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:border-primary/50"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-md px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/book"
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <CalendarClock className="h-4 w-4" /> Book a setup
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-wrap gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await signOut();
                      navigate({ to: "/" });
                    }}
                    className="rounded-md px-4 py-2 text-sm text-muted-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">
                  Sign in
                </Link>
              )}
              <Link
                to="/book"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Book a setup
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
