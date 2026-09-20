import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "@/lib/theme";
import { Check, Sun, Moon, Sparkles, Zap } from "lucide-react";

const THEME_ICONS: Record<Theme, typeof Sparkles> = {
  green: Sparkles,
  dark: Moon,
  light: Sun,
  blue: Zap,
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (className.includes("hidden")) {
    return <div className="hidden" style={{ display: "none" }} aria-hidden="true" />;
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const currentTheme = themes.find((t) => t.key === theme) || themes[0];
  const CurrentIcon = THEME_ICONS[theme] || Sparkles;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition-all hover:border-primary/50 hover:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        title="Change theme"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-colors"
          style={{ backgroundColor: currentTheme.dotColor, color: currentTheme.dotColor }}
        />
        <CurrentIcon className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline-block font-display tracking-wide uppercase text-[11px]">
          {theme}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Select theme
          </div>
          <div className="space-y-1">
            {themes.map((t) => {
              const Icon = THEME_ICONS[t.key];
              const isSelected = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTheme(t.key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full border border-white/10"
                      style={{
                        backgroundColor: t.dotColor,
                        boxShadow: isSelected ? `0 0 10px ${t.glowColor}` : undefined,
                      }}
                    />
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
