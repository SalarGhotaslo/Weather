import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#121f2f",
};

export const metadata: Metadata = {
  title: {
    default: "Salar Weather",
    template: "%s | Salar Weather",
  },
  description:
    "Global city weather — 5-day forecasts, hourly detail, best outdoor times, and an interactive world map.",
  keywords: ["weather", "forecast", "temperature", "cities", "world map"],
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Skip to main content — assistive tech shortcut */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[#2f6fb5] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
