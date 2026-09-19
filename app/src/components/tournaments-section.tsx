import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  listTournaments,
  registerForTournament,
  listMyRegistrations,
  type Tournament,
} from "@/lib/db";
import { TOURNAMENTS } from "@/lib/content";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-primary/15 text-primary",
  soon: "border border-border text-muted-foreground",
  full: "bg-destructive/10 text-destructive",
  closed: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Registrations open",
  soon: "Coming soon",
  full: "Full",
  closed: "Closed",
};

export function TournamentsSection() {
  const { user, profile, phone } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [openForm, setOpenForm] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const list = await listTournaments();
        if (!active) return;
        if (list.length > 0) {
          setTournaments(list);
        } else {
          // Fallback: normalize static content to the DB Tournament shape.
          setTournaments(
            TOURNAMENTS.map((t, i) => ({
              id: `static-${i}`,
              game: t.game,
              format: t.format,
              date: t.date,
              prize: t.prize,
              status: t.status,
              description: "",
              capacity: 0,
              createdAt: 0,
            })),
          );
        }
      } catch {
        if (active) setTournaments([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setRegisteredIds(new Set());
      return;
    }
    let active = true;
    void listMyRegistrations(user.uid).then((regs) => {
      if (active) setRegisteredIds(new Set(regs.map((r) => r.tournamentId)));
    });
    return () => {
      active = false;
    };
  }, [user]);

  const list = useMemo(() => tournaments ?? [], [tournaments]);

  return (
    <section id="tournaments" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Tournaments
        </p>
      </div>
      <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Compete at AlphaQ</h2>

      {tournaments === null ? (
        <div className="mt-12 flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          No tournaments scheduled right now — check back soon.
        </p>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {list.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              signedIn={!!user}
              registered={registeredIds.has(t.id)}
              formOpen={openForm === t.id}
              defaultName={profile?.name ?? ""}
              onToggleForm={() => setOpenForm((cur) => (cur === t.id ? null : t.id))}
              onRegistered={() => {
                setRegisteredIds((prev) => new Set(prev).add(t.id));
                setOpenForm(null);
              }}
              userId={user?.uid ?? ""}
              phone={phone ?? ""}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TournamentCard({
  tournament: t,
  signedIn,
  registered,
  formOpen,
  defaultName,
  onToggleForm,
  onRegistered,
  userId,
  phone,
}: {
  tournament: Tournament;
  signedIn: boolean;
  registered: boolean;
  formOpen: boolean;
  defaultName: string;
  onToggleForm: () => void;
  onRegistered: () => void;
  userId: string;
  phone: string;
}) {
  const [playerName, setPlayerName] = useState(defaultName);
  const [teamName, setTeamName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPlayerName(defaultName);
  }, [defaultName]);

  const canRegister = t.status === "open";

  async function submit() {
    if (!playerName.trim()) {
      toast.error("Enter your player name.");
      return;
    }
    setBusy(true);
    try {
      await registerForTournament({
        tournamentId: t.id,
        userId,
        phone,
        playerName: playerName.trim(),
        teamName: teamName.trim(),
      });
      toast.success("Registered! See you at the arena.");
      onRegistered();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold">{t.game}</h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[t.status] ?? STATUS_STYLES["soon"]
          }`}
        >
          {STATUS_LABELS[t.status] ?? t.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t.format}</p>
      {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t.date}</span>
        <span className="font-display font-bold text-primary">{t.prize}</span>
      </div>

      <div className="mt-5">
        {registered ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            Registered ✓
          </span>
        ) : !canRegister ? (
          <span className="text-xs text-muted-foreground">Registration is not open yet.</span>
        ) : !signedIn ? (
          <Link
            to="/auth"
            className="inline-block rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
          >
            Register / Compete
          </Link>
        ) : !formOpen ? (
          <button
            onClick={onToggleForm}
            className="rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
          >
            Register / Compete
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Player name
              </label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your in-game name"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Team name <span className="normal-case">(optional)</span>
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Squad name"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
              <button
                onClick={onToggleForm}
                className="rounded-md border border-border px-5 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
