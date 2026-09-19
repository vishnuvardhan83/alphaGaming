import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/db";

const DEFAULT_NUMBER = "919573976462";
const PREFILL = "Hi AlphaQ! I'd like to know more about booking a setup.";

export function WhatsAppButton() {
  const [number, setNumber] = useState(DEFAULT_NUMBER);

  useEffect(() => {
    void getSettings()
      .then((s) => {
        if (s.whatsapp) setNumber(s.whatsapp.replace(/\D/g, ""));
      })
      .catch(() => {});
  }, []);

  const href = `https://wa.me/${number}?text=${encodeURIComponent(PREFILL)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with AlphaQ on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-black shadow-lg shadow-[#25D366]/30 transition hover:scale-105 hover:shadow-[#25D366]/50"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
