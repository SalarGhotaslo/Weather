import { getRequestConfig } from "next-intl/server";

// ── i18n phase 1: single-locale scaffold (no URL routing) ──────────────────
// next-intl is wired end-to-end (config → provider → message catalogue) but
// only English is active. This proves the plumbing without the larger
// `[locale]` route restructure.
//
// Roadmap:
//   Phase 2 — resolve `locale` from a cookie / Accept-Language header, add
//             `messages/{es,fr,…}.json`, and a language switcher.
//   Phase 3 — move routes under `src/app/[locale]/` for localised URLs + add
//             middleware-based locale negotiation.
//   Phase 4 — RTL support + localise the generated prose in `src/lib/weather.ts`
//             (getOutdoorSummary, getWeatherFact, getDressCode, …), which build
//             English sentences from fragments and need per-language grammar.

export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export default getRequestConfig(async () => {
  const locale: Locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
