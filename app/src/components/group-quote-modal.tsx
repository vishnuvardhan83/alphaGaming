import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Users, CalendarDays, Gamepad2, Coffee, Trophy, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { submitGroupQuote, type GroupQuoteInput } from "@/lib/db";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select "add mini-tournament" if opened from that CTA */
  prefillTournament?: boolean;
}

export function GroupQuoteModal({ open, onClose, prefillTournament = false }: Props) {
  const { user, profile } = useAuth();

  const [form, setForm] = useState<{
    name: string;
    phone: string;
    email: string;
    groupSize: string;
    eventType: GroupQuoteInput["eventType"];
    preferredDate: string;
    platform: GroupQuoteInput["platform"];
    addFood: boolean;
    addTournament: boolean;
    message: string;
  }>({
    name: profile?.name ?? "",
    phone: "",
    email: "",
    groupSize: "5",
    eventType: "birthday",
    preferredDate: "",
    platform: "pc",
    addFood: false,
    addTournament: prefillTournament,
    message: "",
  });

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefillTournament) {
      setForm((f) => ({ ...f, addTournament: true }));
    }
  }, [prefillTournament]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Enter your name."); return; }
    if (!form.phone.trim()) { toast.error("Enter your phone number."); return; }
    setBusy(true);
    try {
      await submitGroupQuote({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        groupSize: Number(form.groupSize) || 1,
        eventType: form.eventType,
        preferredDate: form.preferredDate,
        platform: form.platform,
        addFood: form.addFood,
        addTournament: form.addTournament,
        message: form.message.trim(),
      });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-[#06090b] px-4 py-2.5 text-sm text-white outline-none placeholder:text-[#8ba095]/60 focus:border-primary/60 transition";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-[#8ba095] mb-1";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative my-auto flex w-full max-w-lg max-h-[88vh] flex-col rounded-2xl border border-white/[0.12] bg-[#0c1114] shadow-2xl card-glow overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Always visible at top */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[#0c1114] p-5 sm:p-6 shrink-0">
          <div>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Birthdays &amp; Groups
            </p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-white sm:text-2xl">
              Request a group quote
            </h2>
            <p className="mt-1 text-xs text-[#8ba095]">
              Fill in the details — we'll tailor a quote and get back to you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#8ba095] hover:border-white/20 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {done ? (
            /* ---- Success state ---- */
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h2 className="font-display text-2xl font-bold text-white">Request sent!</h2>
              <p className="text-sm text-[#8ba095] max-w-xs">
                We've got your group quote request. Our team will reach out within 24 hours to confirm the details.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-full bg-primary px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-[#04140b] hover:bg-[#6bffab] transition"
              >
                Done
              </button>
            </div>
          ) : (
            /* ---- Form ---- */
            <form onSubmit={submit} className="space-y-4">
              {/* Event type chips */}
              <div>
                <label className={labelCls}>Event type</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(["birthday", "group", "corporate", "other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("eventType", t)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${form.eventType === t
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/[0.02] text-[#8ba095] hover:border-white/20 hover:text-white"
                        }`}
                    >
                      {t === "birthday" ? "🎂 Birthday" : t === "group" ? "👾 Group" : t === "corporate" ? "🏢 Corporate" : "✨ Other"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Your name</label>
                  <input
                    className={inputCls}
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    className={inputCls}
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              {!user && (
                <div>
                  <label className={labelCls}>Email <span className="normal-case text-white/30">(optional)</span></label>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="hello@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              )}

              {/* Group size + Preferred date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    <Users className="inline h-3 w-3 mr-1" />
                    Group size
                  </label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    max={50}
                    value={form.groupSize}
                    onChange={(e) => set("groupSize", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <CalendarDays className="inline h-3 w-3 mr-1" />
                    Preferred date
                  </label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => set("preferredDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className={labelCls}>
                  <Gamepad2 className="inline h-3 w-3 mr-1" />
                  Setup preference
                </label>
                <div className="flex gap-2 mt-1">
                  {(["pc", "ps5", "both"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("platform", p)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${form.platform === p
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/[0.02] text-[#8ba095] hover:text-white"
                        }`}
                    >
                      {p === "pc" ? "PC" : p === "ps5" ? "PS5" : "PC + PS5"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              <div>
                <label className={labelCls}>Add-ons</label>
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => set("addFood", !form.addFood)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${form.addFood
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-white/10 bg-white/[0.02] text-[#8ba095] hover:text-white"
                      }`}
                  >
                    <Coffee className="h-3.5 w-3.5" /> Food & drinks
                  </button>
                  <button
                    type="button"
                    onClick={() => set("addTournament", !form.addTournament)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${form.addTournament
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-white/10 bg-white/[0.02] text-[#8ba095] hover:text-white"
                      }`}
                  >
                    <Trophy className="h-3.5 w-3.5" /> Mini-tournament
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className={labelCls}>Anything else?</label>
                <textarea
                  className={inputCls + " resize-none"}
                  rows={3}
                  placeholder="Game preferences, dietary restrictions, special requests…"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_4px_20px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab] disabled:opacity-60 cursor-pointer"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send quote request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
