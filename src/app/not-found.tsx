import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6 weather-foggy inline-block" aria-hidden="true">🌫️</div>
          <h1 className="text-5xl font-bold text-white mb-2">404</h1>
          <h2 className="text-xl text-[#7ea8c2] mb-4">Lost in the fog</h2>
          <p className="text-[#78a8c4] mb-8 leading-relaxed">
            This page seems to have drifted off. The weather is still great though —
            let us help you find your way back.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="bg-[#3b87d6] hover:bg-[#2d6fb8] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ← Back to weather
            </Link>
            <Link
              href="/countries"
              className="bg-[#162535] hover:bg-[#1c2f3f] text-[#7ea8c2] hover:text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse countries
            </Link>
            <Link
              href="/map"
              className="bg-[#162535] hover:bg-[#1c2f3f] text-[#7ea8c2] hover:text-white px-6 py-3 rounded-lg transition-colors"
            >
              World map
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
