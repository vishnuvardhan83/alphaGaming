import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { LandingContent } from "@/components/landing-content";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlphaQ Gaming — Indore's Next-Level Gaming Café" },
      {
        name: "description",
        content:
          "Premium gaming café in Indore with high-end PC & PS5 setups, low-ping internet, food to your seat and weekly tournaments. Book a setup online.",
      },
      { property: "og:title", content: "AlphaQ Gaming — Indore's Next-Level Gaming Café" },
      {
        property: "og:description",
        content:
          "High-end PC & PS5 setups, low-ping internet and a clean, family-friendly arena. Book ahead, order food to your seat, and compete.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: isAdmin ? "/admin" : "/dashboard" });
  }, [user, isAdmin, navigate]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <LandingContent />
      <SiteFooter />
    </div>
  );
}
