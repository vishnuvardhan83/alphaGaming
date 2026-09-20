import { useEffect, useState, type ReactNode, type ComponentType } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AqEmblem } from "@/components/aq-emblem";
import heroImg from "@/assets/hero-arena.jpg";

export interface ShellNavItem {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string; // if set, renders as a router link (e.g. Home → "/")
}

/** Authenticated app shell: full-height role-based sidebar + top header. */
export function AppShell({
  nav,
  active,
  onSelect,
  children,
}: {
  nav: ShellNavItem[];
  active: string;
  onSelect: (key: string) => void;
  children: ReactNode;
}) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bg, setBg] = useState<string>(heroImg);

  const loadBg = () => {
    void getSettings()
      .then((s) => setBg(s.appBg || heroImg))
      .catch(() => { });
  };

  useEffect(() => {
    loadBg();
    const handleUpdate = () => loadBg();
    window.addEventListener("settings-updated", handleUpdate);
    window.addEventListener("app-bg-changed", handleUpdate);
    return () => {
      window.removeEventListener("settings-updated", handleUpdate);
      window.removeEventListener("app-bg-changed", handleUpdate);
    };
  }, []);

  async function logout() {
    await signOut();
    navigate({ to: "/" });
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2 px-6 py-5" onClick={() => setOpen(false)}>
        <AqEmblem className="h-8 w-8" />
        <span className="font-display text-xl font-bold tracking-wide">
          ALPHA<span className="text-primary">Q</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const cls = `flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition`;
          const Icon = item.icon;
          if (item.to) {
            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`${cls} text-muted-foreground hover:bg-primary/10 hover:text-primary`}
              >
                <Icon className="h-5 w-5" /> {item.label}
              </Link>
            );
          }
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onSelect(item.key);
                setOpen(false);
              }}
              className={`${cls} ${isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
            >
              <Icon className="h-5 w-5" /> {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 border-t border-border px-6 py-4 text-sm font-medium text-muted-foreground transition hover:text-destructive"
      >
        <LogOut className="h-5 w-5" /> Logout
      </button>
    </div>
  );

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/30 md:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-background">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-muted-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <button className="text-foreground md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 sm:gap-4">
            {user && isAdmin && (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/dashboard"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  Admin
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary">
                {initial}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{user?.name || "Guest"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        <main className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 -z-0">
            <img src={bg} alt="" className="h-full w-full object-cover opacity-[0.08]" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          </div>
          <div className="relative z-10 p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
