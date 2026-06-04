"use client";

import { useState } from "react";

export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setState("copied");
        setTimeout(() => setState("idle"), 2500);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
        state === "copied"
          ? "bg-green-500/20 border-green-500/40 text-green-400"
          : state === "error"
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-[#162535] border-[#2a4055] text-[var(--text-muted)] hover:text-white hover:border-[#3b87d6]"
      }`}
      aria-label="Share or copy forecast link"
    >
      <span aria-hidden="true">{state === "copied" ? "✓" : "🔗"}</span>
      <span>{state === "copied" ? "Copied!" : state === "error" ? "Failed" : "Share"}</span>
    </button>
  );
}
