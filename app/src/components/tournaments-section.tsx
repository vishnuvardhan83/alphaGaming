import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Trophy, ArrowRight, Users, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  listTournaments,
  registerForTournament,
  listMyRegistrations,
  listLeaderboard,
  listTournamentRegistrations,
  type Tournament,
  type LeaderboardEntry,
  type TournamentRegistration,
} from "@/lib/db";

export function TournamentsSection({ onGroupQuote }: { onGroupQuote?: () => void }) {
  const { user, profile, phone } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [openForm, setOpenForm] = useState<string | null>(null);

  const reloadTournaments = () => {
    void listTournaments()
      .then((tList) => setTournaments(tList))
      .catch(() => setTournaments([]));
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [tList, lbList] = await Promise.all([
          listTournaments(),
          listLeaderboard(),
        ]);
        if (!active) return;
        setTournaments(tList);
        setLeaderboard(lbList);
      } catch {
        if (active) {
          setTournaments([]);
          setLeaderboard([]);
        }
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
    <section id="tournaments" className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba095]">
              Compete
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
              Tournaments &amp; Leaderboards
            </h2>
          </div>
          {onGroupQuote ? (
            <button
              type="button"
              onClick={onGroupQuote}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-primary/50 hover:text-white cursor-pointer"
            >
              Register your team <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-primary/50 hover:text-white"
            >
              Register your team <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Tournaments Grid */}
        {tournaments === null ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground">
            No tournaments scheduled right now — check back soon.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
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
                  reloadTournaments();
                }}
                userId={user?.uid ?? ""}
                phone={phone ?? ""}
              />
            ))}
          </div>
        )}

        {/* Season Leaderboard card */}
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="font-sans text-base font-semibold text-white">
                Season leaderboard
              </h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-wider text-[#8ba095]">
              Preview
            </span>
          </div>

          <ol className="divide-y divide-white/[0.06] text-sm">
            {leaderboard.slice(0, 5).map((entry, index) => {
              const rankStr = String(entry.rank || index + 1).padStart(2, "0");
              return (
                <li
                  key={entry.id || entry.team}
                  className="flex items-center justify-between py-3.5"
                >
                  <span className="flex items-center gap-3 text-white">
                    <span className="font-display font-bold text-primary">
                      {rankStr}
                    </span>
                    <span className="font-medium text-white/95">{entry.team}</span>
                  </span>
                  <span className="font-mono text-sm text-[#8ba095]">
                    {entry.points.toLocaleString()} pts
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
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

  // Participants roster
  const [viewParticipants, setViewParticipants] = useState(false);
  const [participants, setParticipants] = useState<TournamentRegistration[] | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    setPlayerName(defaultName);
  }, [defaultName]);

  const regCount = t.registeredCount ?? 0;
  const capacity = t.capacity || 0;
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - regCount) : null;
  const isFull = capacity > 0 ? spotsLeft === 0 : t.status === "full";
  const isOpen = t.status === "open" && !isFull;
  const isSoon = t.status === "soon";

  function loadParticipants() {
    setLoadingParticipants(true);
    listTournamentRegistrations(t.id)
      .then(setParticipants)
      .catch(() => setParticipants([]))
      .finally(() => setLoadingParticipants(false));
  }

  function toggleParticipants() {
    if (!viewParticipants && participants === null) {
      loadParticipants();
    }
    setViewParticipants(!viewParticipants);
  }

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
      loadParticipants();
      onRegistered();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1114]/80 p-6 backdrop-blur-md transition hover:border-primary/40 flex flex-col justify-between">
      <div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-display text-xl font-bold text-white">{t.game}</h3>
              {isFull ? (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-0.5 text-xs font-semibold text-red-400">
                  Full
                </span>
              ) : isOpen ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  Registration open
                </span>
              ) : isSoon ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-400">
                  Coming soon
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                  Closed
                </span>
              )}
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[#8ba095]">
              {t.format} · {t.date} · {t.prize}
            </p>
            {t.description && (
              <p className="mt-1 text-xs text-white/70">{t.description}</p>
            )}
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {registered ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                Registered ✓
              </span>
            ) : isOpen ? (
              signedIn ? (
                <button
                  onClick={onToggleForm}
                  className="rounded-full bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_4px_14px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab] cursor-pointer"
                >
                  Register
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="inline-block rounded-full bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_4px_14px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab]"
                >
                  Register
                </Link>
              )
            ) : (
              <button
                onClick={() => toast.info(`We'll notify you when ${t.game} registrations open.`)}
                className="rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-xs font-medium text-white/80 transition hover:border-white/20 hover:text-white cursor-pointer"
              >
                Notify me
              </button>
            )}
          </div>
        </div>

        {/* Capacity & Spots available meter */}
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8ba095]">
              <strong className="text-white font-semibold">{regCount}</strong>
              {capacity > 0 ? ` / ${capacity}` : ""} teams registered
            </span>
            {capacity > 0 ? (
              <span className={spotsLeft! > 0 ? "text-primary font-semibold" : "text-red-400 font-semibold"}>
                {spotsLeft! > 0 ? `${spotsLeft} spots left` : "0 spots left (Full)"}
              </span>
            ) : (
              <span className="text-[#8ba095]">Unlimited capacity</span>
            )}
          </div>
          {capacity > 0 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  spotsLeft === 0 ? "bg-red-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, Math.round((regCount / capacity) * 100))}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Toggle registered participants list */}
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={toggleParticipants}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[#6bffab] transition cursor-pointer"
          >
            <Users className="h-3.5 w-3.5" />
            <span>
              {viewParticipants ? "Hide registered teams" : `View registered teams / players (${regCount})`}
            </span>
            {viewParticipants ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Registered Participants Roster */}
        {viewParticipants && (
          <div className="mt-3 rounded-xl border border-white/10 bg-[#06090b] p-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2">
              <span className="font-display text-[11px] font-bold uppercase tracking-wider text-white">
                Registered teams &amp; players
              </span>
              <span className="text-[11px] font-mono text-[#8ba095]">
                {participants?.length ?? regCount} registered
              </span>
            </div>

            {loadingParticipants ? (
              <div className="flex items-center justify-center py-4 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : !participants || participants.length === 0 ? (
              <p className="py-3 text-center text-xs text-[#8ba095]">
                No teams registered yet. Be the first to register!
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-white">{p.playerName}</span>
                        {p.teamName && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/30 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            <Shield className="h-2.5 w-2.5" />
                            {p.teamName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#8ba095] font-mono">
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expanded registration form if toggled */}
        {formOpen && (
          <div className="mt-4 space-y-3 border-t border-white/[0.08] pt-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-xs font-semibold text-white">
                Register for {t.game}
              </p>
              {capacity > 0 && (
                <span className="text-[11px] text-[#8ba095]">
                  {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} remaining
                </span>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8ba095]">
                Player name
              </label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your in-game handle"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#06090b] px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8ba095]">
                Team name <span className="normal-case text-muted-foreground">(optional)</span>
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Squad / Clan name"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#06090b] px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={submit}
                disabled={busy}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#04140b] shadow-[0_4px_14px_rgba(30,224,122,0.4)] transition hover:bg-[#6bffab] disabled:opacity-50 cursor-pointer"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm registration
              </button>
              <button
                onClick={onToggleForm}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-[#8ba095] hover:text-white cursor-pointer"
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
