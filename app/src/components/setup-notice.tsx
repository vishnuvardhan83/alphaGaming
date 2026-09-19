import { Settings2 } from "lucide-react";

/** Shown in place of login/booking until the real Firebase web config is pasted in. */
export function SetupNotice({ feature }: { feature: string }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center">
      <Settings2 className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-4 font-display text-lg font-semibold">One setup step left</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {feature} runs on Firebase. Create a free Firebase project, enable the{" "}
        <strong className="text-foreground">Phone</strong> sign-in provider and a{" "}
        <strong className="text-foreground">Firestore</strong> database, then share your web app
        config (apiKey, authDomain, projectId…) and it gets wired in — no other changes needed.
      </p>
    </div>
  );
}
