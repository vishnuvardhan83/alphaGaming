import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Phone, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SetupNotice } from "./setup-notice";

type Mode = "login" | "register";

export function AuthForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const { user, configured, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (redirectTo.includes("#") || redirectTo.includes("?")) {
        window.location.href = redirectTo;
      } else {
        navigate({ to: redirectTo as any });
      }
    }
  }, [user, navigate, redirectTo]);

  if (!configured) return <SetupNotice feature="Accounts & sign-in" />;

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ phone, password });
      } else {
        await register({ phone, name, password });
      }
      if (redirectTo.includes("#") || redirectTo.includes("?")) {
        window.location.href = redirectTo;
      } else {
        navigate({ to: redirectTo as any });
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 card-glow">
      <div className="mb-5 flex rounded-lg border border-border p-1 text-sm">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-md px-3 py-2 font-medium transition ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        <Field icon={<Phone className="h-4 w-4" />}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (e.g. 9573976462)"
            autoComplete="tel"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </Field>

        {mode === "register" && (
          <Field icon={<UserIcon className="h-4 w-4" />}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>
        )}

        <Field icon={<Lock className="h-4 w-4" />}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "login"
          ? "New to AlphaQ? Switch to Create account above."
          : "We use your phone number as your login. No OTP needed."}
      </p>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5 focus-within:border-primary">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("email-already-in-use"))
    return "An account with this number already exists. Try signing in.";
  if (msg.includes("invalid-credential") || msg.includes("wrong-password"))
    return "Incorrect phone number or password.";
  if (msg.includes("user-not-found"))
    return "No account found for this number. Create one first.";
  if (msg.includes("weak-password")) return "Password must be at least 6 characters.";
  if (msg.includes("too-many-requests"))
    return "Too many attempts. Please wait a moment and try again.";
  return msg;
}
