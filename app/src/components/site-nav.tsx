import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowRight, LogOut, LayoutDashboard, Shield } from "lucide-react";
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#06090b]/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand logo matching Screenshot 1 */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6bffab] to-[#0fb866] font-display text-sm font-extrabold text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.45)]">
            AQ
          </span>
          <span className="font-display text-xl font-bold tracking-wider text-white">
            ALPHAQ
          </span>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right CTA buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-white transition hover:border-primary/50"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-white transition hover:border-primary/50"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <Link
                to="/book"
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.35)] transition hover:bg-[#6bffab]"
              >
                Book a setup
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-full border border-white/10 bg-white/[0.02] px-5 py-1.5 text-sm font-semibold text-white/90 transition hover:border-primary/50 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-[#04140b] shadow-[0_6px_20px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab]"
              >
                Sign up <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-md p-2 text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-white/[0.08] bg-[#06090b]/98 px-6 py-5 lg:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 text-base font-medium text-muted-foreground hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-white/10">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-white/10 px-4 py-2 text-center text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/book"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-[#04140b]"
                  >
                    Book
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-white/10 px-4 py-2 text-center text-sm font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-[#04140b]"
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

