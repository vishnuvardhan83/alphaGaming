import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { getSettings } from "@/lib/db";
import { BRAND } from "@/lib/content";

/** Floating "Chat with us" button — bottom-right corner on all pages. */
export function ChatButton() {
  const [email, setEmail] = useState(BRAND.email);

  useEffect(() => {
    void getSettings()
      .then((s) => {
        if (s.email) setEmail(s.email);
      })
      .catch(() => {});
  }, []);

  const href = `mailto:${email}?subject=${encodeURIComponent("Hi AlphaQ! I'd like to know more.")}`;

  return (
    <a
      href={href}
      aria-label="Chat with us"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-primary px-4 py-3.5 font-display text-sm font-bold text-[#04140b] shadow-[0_6px_24px_rgba(30,224,122,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_32px_rgba(30,224,122,0.6)] hover:pr-5"
    >
      {/* Pulsing ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20 pointer-events-none" />
      <Mail className="relative h-5 w-5 shrink-0" />
      <span className="relative hidden sm:inline whitespace-nowrap">Chat with us</span>
    </a>
  );
}
