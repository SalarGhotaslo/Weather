import { formatHour, type HourlyForecastResponse } from "./forecast";

export interface HourData {
  hour: number;
  label: string;
  temp: number;
  precipProb: number;
  precip: number;
  windSpeed: number;
  score: number; // -1=night  0=bad  1=poor  2=good  3=excellent
  active: boolean; // within typical waking/social hours (see ACTIVE_START/END)
}

// Best- and worst-time windows are detected only within the hours people
// realistically want to be outside — a 6am–10pm waking window. The night score
// (-1) still trims any dark hours inside that range (e.g. pre-sunrise winter).
export const ACTIVE_START = 6; // 6am, inclusive
export const ACTIVE_END = 22; // 10pm, exclusive

export interface OutdoorWindow {
  timeLabel: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  conditions: string;
  reason: string;
  isBad: boolean;
  severity?: "worst" | "bad";
  peakHour?: string;
  tempRange?: string;
  activities?: string[];
}

export function scoreHour(
  temp: number,
  precipProb: number,
  precip: number,
  windSpeed: number,
  isNight: boolean,
): number {
  if (isNight) return -1;
  if (windSpeed > 60 || temp < -5 || temp > 42) return 0;

  // Rain assessment blends probability AND expected amount:
  // high chance of negligible drizzle is less concerning than
  // moderate chance of a downpour.
  if (precipProb >= 85 && precip >= 1) return 0;
  if (precipProb >= 85 || (precipProb >= 60 && precip >= 2)) return 1;
  if (windSpeed > 45 || temp < 2 || temp > 36) return 1;
  if (precipProb >= 60 || (precipProb >= 35 && precip >= 2) || windSpeed > 30 || temp < 8 || temp > 30) return 2;
  if (temp >= 14 && temp <= 26 && precipProb < 10 && precip < 0.5 && windSpeed < 18) return 4;
  if (temp >= 11 && temp <= 29 && precipProb < 20 && precip < 1 && windSpeed < 25) return 3;
  return 2;
}

// Single source of truth for the outdoor-window wind descriptor — used by both
// the reason sentence and the condition chip so they never disagree.
export function describeWind(avgWind: number): string {
  if (avgWind < 10) return "calm";
  if (avgWind < 18) return "light breeze";
  if (avgWind < 25) return "gentle breeze";
  if (avgWind < 35) return "breezy";
  return "windy";
}

export function getHourlyAnalysis(
  hourly: HourlyForecastResponse["hourly"],
  dateStr: string,
  sunriseISO: string,
  sunsetISO: string,
): { hours: HourData[]; bestWindows: OutdoorWindow[]; badWindows: OutdoorWindow[] } {
  const sunriseHour = parseInt(sunriseISO.split("T")[1]?.split(":")[0] ?? "6", 10);
  const sunsetHour = parseInt(sunsetISO.split("T")[1]?.split(":")[0] ?? "20", 10);

  const hours: HourData[] = hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.startsWith(dateStr))
    .map(({ t, i }) => {
      const hour = parseInt(t.split("T")[1]?.split(":")[0] ?? "0", 10);
      const isNight = hour < sunriseHour || hour >= sunsetHour;
      return {
        hour,
        label: formatHour(hour),
        temp: Math.round(hourly.temperature_2m[i] ?? 0),
        precipProb: hourly.precipitation_probability[i] ?? 0,
        precip: hourly.precipitation[i] ?? 0,
        windSpeed: Math.round(hourly.wind_speed_10m[i] ?? 0),
        score: scoreHour(
          hourly.temperature_2m[i] ?? 0,
          hourly.precipitation_probability[i] ?? 0,
          hourly.precipitation[i] ?? 0,
          hourly.wind_speed_10m[i] ?? 0,
          isNight,
        ),
        active: hour >= ACTIVE_START && hour < ACTIVE_END,
      };
    });

  function findRuns(pred: (h: HourData) => boolean, minLen = 2): { start: number; end: number }[] {
    const runs: { start: number; end: number }[] = [];
    let start = -1;
    hours.forEach((h, idx) => {
      if (pred(h)) {
        if (start === -1) start = idx;
      } else if (start !== -1) {
        if (idx - start >= minLen) runs.push({ start, end: idx - 1 });
        start = -1;
      }
    });
    if (start !== -1 && hours.length - start >= minLen) runs.push({ start, end: hours.length - 1 });
    return runs;
  }

  function suggestActivities(avgTemp: number, maxPrecipProb: number, maxPrecipAmount: number, avgWind: number): string[] {
    const acts: string[] = [];
    if (maxPrecipProb < 5 && maxPrecipAmount < 0.5 && avgTemp >= 20 && avgWind < 15) acts.push("Picnic");
    if (maxPrecipProb < 10 && maxPrecipAmount < 1 && avgTemp >= 12 && avgWind < 22) acts.push("Running");
    if (maxPrecipProb < 15 && maxPrecipAmount < 1.5 && avgWind < 20 && avgTemp >= 10 && avgTemp <= 28) acts.push("Cycling");
    if (maxPrecipProb < 10 && maxPrecipAmount < 1 && avgTemp >= 23 && avgWind < 18) acts.push("Swimming");
    if (maxPrecipProb < 20 && maxPrecipAmount < 2 && avgTemp >= 6 && avgWind < 30) acts.push("Walking");
    if (avgTemp >= 23 && maxPrecipProb < 5 && maxPrecipAmount < 0.5 && avgWind < 15) acts.push("Beach");
    if (maxPrecipProb < 10 && maxPrecipAmount < 1 && (avgTemp >= 15 && avgTemp <= 22)) acts.push("Coffee outside");
    if (maxPrecipProb < 5 && maxPrecipAmount < 0.5 && avgTemp >= 8 && avgTemp <= 14) acts.push("Leaf peeping");
    if (maxPrecipProb < 5 && maxPrecipAmount < 0.5 && avgTemp < 8 && avgTemp >= 0) acts.push("Winter walk");
    if (acts.length === 0) acts.push("Light stroll");
    return acts.slice(0, 3);
  }

  function buildReason(
    avgTemp: number,
    avgPrecipProb: number,
    maxPrecipProb: number,
    avgPrecipAmount: number,
    maxPrecipAmount: number,
    avgWind: number,
    maxWind: number,
    minTemp: number,
    maxTemp: number,
    isBad: boolean,
    rating: OutdoorWindow["rating"],
    precipTrend: "clearing" | "worsening" | "steady",
  ): string {
    const fmtAmount = (mm: number) => `${mm.toFixed(1)}mm`;

    if (isBad) {
      const parts: string[] = [];
      if (maxPrecipProb >= 80) {
        const amt = maxPrecipAmount >= 1 ? `, ${fmtAmount(maxPrecipAmount)}` : "";
        parts.push(`torrential rain (up to ${maxPrecipProb}%${amt})`);
      } else if (avgPrecipProb >= 65) {
        const amt = avgPrecipAmount >= 1 ? `, ~${fmtAmount(avgPrecipAmount)}` : "";
        parts.push(`persistent heavy rain (avg ${avgPrecipProb}%${amt})`);
      } else if (avgPrecipProb >= 50) {
        const amt = avgPrecipAmount >= 1 ? `, ~${fmtAmount(avgPrecipAmount)}` : "";
        parts.push(`rain throughout (${avgPrecipProb}% avg${amt})`);
      } else if (maxPrecipProb >= 60) {
        const amt = maxPrecipAmount >= 1 ? `, ${fmtAmount(maxPrecipAmount)}` : "";
        parts.push(`frequent heavy showers (peaks at ${maxPrecipProb}%${amt})`);
      } else if (avgPrecipProb >= 40) {
        const amt = avgPrecipAmount >= 0.5 ? `, ~${fmtAmount(avgPrecipAmount)}` : "";
        parts.push(`drizzly conditions (${avgPrecipProb}% avg${amt})`);
      }
      if (maxWind > 60) parts.push(`dangerous gusts (${maxWind} km/h)`);
      else if (avgWind > 45) parts.push(`strong, blustery winds (avg ${avgWind} km/h)`);
      else if (maxWind > 40) parts.push(`gusty winds (up to ${maxWind} km/h)`);
      else if (avgWind > 30) parts.push(`brisk wind (avg ${avgWind} km/h)`);
      if (minTemp < 0) parts.push(`freezing cold (${minTemp}°C)`);
      else if (minTemp < 3) parts.push(`near-freezing (${minTemp}°C)`);
      else if (maxTemp > 38) parts.push(`dangerous heat (${maxTemp}°C)`);
      else if (maxTemp > 33) parts.push(`very hot (${maxTemp}°C)`);
      if (precipTrend === "worsening") parts.push("conditions expected to deteriorate");
      else if (precipTrend === "clearing") parts.push("rain easing off toward the end");
      if (parts.length === 0) parts.push("poor all-around conditions");
      const s = parts.slice(0, 2).join("; ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    const bits: string[] = [];
    if (avgTemp >= 24 && avgTemp <= 28) bits.push("warm and pleasant");
    else if (avgTemp >= 20 && avgTemp <= 23) bits.push("pleasantly warm");
    else if (avgTemp >= 17 && avgTemp <= 19) bits.push("mild and comfortable");
    else if (avgTemp >= 13 && avgTemp <= 16) bits.push("cool and fresh");
    else if (avgTemp >= 10 && avgTemp <= 12) bits.push("crisp");
    else if (avgTemp > 28) bits.push("hot");
    else if (avgTemp >= 6 && avgTemp < 10) bits.push("chilly");

    if (maxPrecipProb < 5) bits.push("completely dry");
    else if (avgPrecipProb < 10) bits.push("mostly dry");
    else if (avgPrecipProb < 20) bits.push("low rain risk");
    else if (avgPrecipProb < 35) bits.push("some rain risk");
    else if (avgPrecipProb < 55) bits.push(`a fair chance of rain (${avgPrecipProb}%)`);
    else bits.push(`rain likely (${avgPrecipProb}%)`);

    if (avgPrecipAmount >= 1) {
      bits.push(`~${fmtAmount(avgPrecipAmount)} expected`);
    } else if (avgPrecipAmount >= 0.5) {
      bits.push(`~${fmtAmount(avgPrecipAmount)} expected`);
    }

    bits.push(avgWind >= 35 ? `windy (${avgWind} km/h)` : describeWind(avgWind));

    if (bits.length === 0) return "Conditions are acceptable for outdoor time";
    const joined = bits.join(", ");
    const cap = joined.charAt(0).toUpperCase() + joined.slice(1);
    if (rating === "Excellent") return `${cap} — ideal conditions for getting outside`;
    if (rating === "Good") return `${cap} — a solid outdoor window`;
    return `${cap} conditions`;
  }

  function computePrecipTrend(slice: HourData[]): "clearing" | "worsening" | "steady" {
    if (slice.length < 3) return "steady";
    const firstHalf = slice.slice(0, Math.ceil(slice.length / 2));
    const secondHalf = slice.slice(Math.floor(slice.length / 2));
    const firstAvg = firstHalf.reduce((s, h) => s + h.precipProb, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, h) => s + h.precipProb, 0) / secondHalf.length;
    if (secondAvg < firstAvg - 15) return "clearing";
    if (secondAvg > firstAvg + 15) return "worsening";
    return "steady";
  }

  function runToWindow(
    run: { start: number; end: number },
    isBad: boolean,
    severity?: "worst" | "bad",
  ): OutdoorWindow {
    const slice = hours.slice(run.start, run.end + 1);
    const avgTemp = Math.round(slice.reduce((s, h) => s + h.temp, 0) / slice.length);
    const avgScore = slice.reduce((s, h) => s + h.score, 0) / slice.length;
    const minPrecip = Math.min(...slice.map((h) => h.precipProb));
    const maxPrecip = Math.max(...slice.map((h) => h.precipProb));
    const avgPrecip = Math.round(slice.reduce((s, h) => s + h.precipProb, 0) / slice.length);
    const minPrecipAmount = Math.min(...slice.map((h) => h.precip));
    const maxPrecipAmount = Math.max(...slice.map((h) => h.precip));
    const avgPrecipAmount = slice.reduce((s, h) => s + h.precip, 0) / slice.length;
    const avgWind = Math.round(slice.reduce((s, h) => s + h.windSpeed, 0) / slice.length);
    const maxWind = Math.max(...slice.map((h) => h.windSpeed));
    const minTemp = Math.min(...slice.map((h) => h.temp));
    const maxTemp = Math.max(...slice.map((h) => h.temp));

    const peakIdx = slice.reduce(
      (best, h, i) => (h.score > slice[best].score ? i : best),
      0,
    );
    const peakHour = slice[peakIdx]?.label;

    // Honest about marginal windows: a stretch that only ever reaches "Good"
    // (score 2 — e.g. 30–50% rain risk) is Fair, not Good, so a wet day's
    // least-bad slot isn't oversold.
    const rating: OutdoorWindow["rating"] = isBad
      ? "Poor"
      : avgScore >= 3.3
        ? "Excellent"
        : avgScore >= 2.3
          ? "Good"
          : avgScore >= 1.3
            ? "Fair"
            : "Poor";

    // Use avg precip (not max) so a single heavy-rain hour doesn't inflate the description.
    // Show a range when there's significant spread across the window.
    const precipSpread = maxPrecip - minPrecip;
    const amountDesc = maxPrecipAmount > 0
      ? maxPrecipAmount === minPrecipAmount
        ? `, ${maxPrecipAmount.toFixed(1)}mm`
        : `, ${minPrecipAmount.toFixed(1)}–${maxPrecipAmount.toFixed(1)}mm`
      : "";
    const precipDesc =
      avgPrecip < 10
        ? `dry${amountDesc}`
        : precipSpread > 35
          ? `${minPrecip}–${maxPrecip}% rain${amountDesc}`
          : `${avgPrecip}% rain chance${amountDesc}`;

    const conditions = [`avg ${avgTemp}°C`, precipDesc, describeWind(avgWind)].join(", ");

    const precipTrend = computePrecipTrend(slice);
    const reason = buildReason(avgTemp, avgPrecip, maxPrecip, avgPrecipAmount, maxPrecipAmount, avgWind, maxWind, minTemp, maxTemp, isBad, rating, precipTrend);

    return {
      timeLabel: `${hours[run.start]?.label ?? ""} – ${hours[run.end]?.label ?? ""}`,
      rating,
      conditions,
      reason,
      isBad,
      severity,
      peakHour,
      tempRange: `${minTemp}–${maxTemp}°C`,
      activities: isBad ? [] : suggestActivities(avgTemp, maxPrecip, maxPrecipAmount, avgWind),
    };
  }

  const runStats = (r: { start: number; end: number }) => {
    const slice = hours.slice(r.start, r.end + 1);
    return {
      score: slice.reduce((s, h) => s + h.score, 0),
      precip: slice.reduce((s, h) => s + h.precipProb, 0),
      wind: slice.reduce((s, h) => s + h.windSpeed, 0),
    };
  };

  // Best windows — only ever within active social hours. A window counts as a
  // good time to be out if every hour is at least "Good" (score ≥ 2); we do NOT
  // require every hour to be pristine. Requiring ≥ 3 used to collapse a long,
  // comfortable afternoon (e.g. 25% rain risk) down to a single slightly-better
  // evening hour. We only relax to "Poor" (≥ 1) when nothing better exists, so a
  // rough day still surfaces its least-bad options instead of reporting nothing.
  let bestRuns = findRuns((h) => h.active && h.score >= 2);
  if (bestRuns.length === 0) bestRuns = findRuns((h) => h.active && h.score >= 1);

  const bestWindows = bestRuns
    // Rank best-first: total quality (so a long pleasant stretch beats a brief
    // perfect one), then drier, then calmer, then earlier. The drier tiebreak
    // matters when two windows score equally — e.g. a damp 6am vs a clearing
    // 7pm both rate "Fair", but the evening is the better shout.
    .map((r) => ({ r, st: runStats(r) }))
    .sort(
      (a, b) =>
        b.st.score - a.st.score ||
        a.st.precip - b.st.precip ||
        a.st.wind - b.st.wind ||
        a.r.start - b.r.start,
    )
    .slice(0, 3)
    .map(({ r }) => runToWindow(r, false));

  // Worst windows — genuinely bad stretches (score 0) inside active hours.
  // Two consecutive bad hours is enough to flag once we're already confined to
  // the part of the day people actually go out in.
  const badWindows = findRuns((h) => h.active && h.score === 0)
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, 2)
    .map((r, i) => runToWindow(r, true, i === 0 ? "worst" : "bad"));

  return { hours, bestWindows, badWindows };
}

export function getOutdoorSummary(
  bestWindows: OutdoorWindow[],
  badWindows: OutdoorWindow[],
): string {
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

  if (bestWindows.length === 0 && badWindows.length > 0) {
    const why = badWindows[0].reason ?? "conditions are poor";
    return `Tricky day for outdoor plans — ${lc(why)}. Avoid ${badWindows[0].timeLabel} especially.`;
  }
  if (bestWindows.length === 0) {
    return `No standout outdoor windows between ${formatHour(ACTIVE_START)} and ${formatHour(ACTIVE_END)} today, but conditions are broadly reasonable.`;
  }

  const best = bestWindows[0];
  const acts =
    best.activities && best.activities.length > 0
      ? best.activities.slice(0, 2).join(" or ").toLowerCase()
      : "outdoor activity";

  // When even the best stretch is only Fair/Poor it's a rough day — say so and
  // frame the window as the least-bad option rather than a positive pick.
  const isToughDay = best.rating === "Fair" || best.rating === "Poor";

  let summary: string;
  if (best.rating === "Excellent")
    summary = `Excellent: ${best.timeLabel}. ${best.reason ?? "Great conditions"}. Perfect for ${acts}.`;
  else if (best.rating === "Good")
    summary = `Good window for ${acts}: ${best.timeLabel}. ${best.reason ?? "Decent conditions"}.`;
  else
    summary = `A rough day to be outside — your best bet is ${best.timeLabel}${best.reason ? `: ${lc(best.reason)}` : ""}. Indoors is the safer call.`;

  // Point to the other options so the reader sees more than one choice — but
  // only when the day is actually good; on a tough day extra "options" mislead.
  if (!isToughDay && bestWindows.length > 1) {
    const others = bestWindows.slice(1, 3).map((w) => w.timeLabel).join(" and ");
    summary += ` Also worth a look: ${others}.`;
  }

  // Always name the worst stretch to steer clear of, when there is one.
  if (badWindows.length > 0) {
    summary += ` Steer clear of ${badWindows[0].timeLabel}.`;
  }

  return summary;
}
