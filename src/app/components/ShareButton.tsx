"use client";

import { useState } from "react";
import styles from "./ShareButton.module.css";

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

  const tone = state === "copied" ? styles.copied : state === "error" ? styles.error : styles.idle;

  return (
    <button
      onClick={handleShare}
      className={`${styles.button} ${tone}`}
      aria-label="Share or copy forecast link"
    >
      <span aria-hidden="true">{state === "copied" ? "✓" : "🔗"}</span>
      <span>{state === "copied" ? "Copied!" : state === "error" ? "Failed" : "Share"}</span>
    </button>
  );
}
