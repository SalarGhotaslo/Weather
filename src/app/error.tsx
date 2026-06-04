"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6 weather-thunder inline-block" aria-hidden="true">⛈️</div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-[#7ea8c2] mb-6 leading-relaxed">
          Weather data couldn&apos;t be loaded right now. This is usually temporary.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#3b87d6] hover:bg-[#2d6fb8] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-[#162535] hover:bg-[#1c2f3f] text-[#7ea8c2] hover:text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
