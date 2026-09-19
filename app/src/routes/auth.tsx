import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AlphaQ Gaming" },
      { name: "description", content: "Sign in to AlphaQ Gaming with your phone number to book setups and manage sessions." },
      { property: "og:title", content: "Sign in — AlphaQ Gaming" },
      { property: "og:description", content: "Sign in to AlphaQ Gaming with your phone number to book setups and manage sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />
      <main className="relative flex flex-1 items-center justify-center px-4 py-28">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative w-full">
          <p className="mb-8 text-center font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Gamer portal
          </p>
          <AuthForm redirectTo="/dashboard" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
