import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { BookSetup } from "@/components/book-setup";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a setup — AlphaQ Gaming" },
      { name: "description", content: "Reserve a gaming PC or PS5 lounge setup at AlphaQ Gaming, Indore. Pick a slot, pay by UPI, and play." },
      { property: "og:title", content: "Book a setup — AlphaQ Gaming" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />
      <main className="relative flex-1 px-4 py-28">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative">
          <BookSetup />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
