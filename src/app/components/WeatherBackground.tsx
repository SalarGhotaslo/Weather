"use client";

import { getWeatherTheme } from "@/lib/weatherTheme";

// ── Cloud shape using layered circles ──────────────────────────────

const cloudDefs = [
  { left: "2%", top: "6%", scale: 1, delay: "0s", dur: "22s" },
  { left: "30%", top: "14%", scale: 0.75, delay: "-7s", dur: "26s" },
  { left: "55%", top: "4%", scale: 1.1, delay: "-14s", dur: "20s" },
  { left: "75%", top: "18%", scale: 0.6, delay: "-4s", dur: "28s" },
  { left: "10%", top: "32%", scale: 0.5, delay: "-11s", dur: "30s" },
];

function CloudShape({ left, top, scale = 1, delay = "0s", dur = "20s" }: {
  left?: string; top?: string; scale?: number; delay?: string; dur?: string;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        animation: `cloud-drift ${dur} ease-in-out ${delay} infinite`,
        left,
        top,
        transform: `scale(${scale})`,
      }}
    >
      <div
        className="relative"
        style={{
          width: "240px",
          height: "70px",
          background: "linear-gradient(90deg, rgba(120,160,200,0.10), rgba(160,195,230,0.14), rgba(120,160,200,0.10))",
          borderRadius: "50px",
        }}
      >
        <div
          className="absolute bottom-[30%] left-[18%]"
          style={{
            width: "80px",
            height: "60px",
            background: "rgba(160,195,230,0.12)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute bottom-[20%] left-[35%]"
          style={{
            width: "100px",
            height: "80px",
            background: "rgba(160,195,230,0.14)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute bottom-[30%] left-[55%]"
          style={{
            width: "70px",
            height: "55px",
            background: "rgba(160,195,230,0.10)",
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}

// ── Rain ───────────────────────────────────────────────────────────

const rainDrops = Array.from({ length: 60 }, (_, i) => ({
  left: (i * 17 + 7) % 100,
  delay: (i * 0.08) % 1.2,
  dur: 0.35 + (i % 5) * 0.05,
  len: 35 + (i % 4) * 10,
}));

function RainEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {rainDrops.map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${d.left}%`,
            top: `${-d.len}px`,
            width: "2px",
            height: `${d.len}px`,
            background: "linear-gradient(to bottom, transparent 0%, rgba(130,180,240,0.45) 45%, rgba(130,180,240,0.55) 55%, transparent 100%)",
            animation: `rain-fall ${d.dur}s linear ${d.delay}s infinite`,
            borderRadius: "1px",
          }}
        />
      ))}
      {/* Splash layer */}
      {rainDrops.slice(0, 15).map((d, i) => (
        <div
          key={`s${i}`}
          className="absolute w-[3px] h-[3px] rounded-full"
          style={{
            left: `${(d.left + 3) % 100}%`,
            bottom: `${5 + (i % 8) * 2}%`,
            background: "rgba(130,180,240,0.2)",
            animation: `rain-splash ${0.3 + (i % 3) * 0.05}s ease-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Snow ───────────────────────────────────────────────────────────

const snowFlakes = Array.from({ length: 60 }, (_, i) => ({
  left: (i * 13 + 11) % 100,
  delay: (i * 0.25) % 4,
  dur: 5 + (i % 8) * 0.4,
  size: 5 + (i % 5) * 3,
}));

function SnowEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {snowFlakes.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${-s.size}px`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: i % 3 === 0
              ? "rgba(220,240,255,0.7)"
              : i % 3 === 1
                ? "rgba(240,248,255,0.6)"
                : "rgba(200,225,250,0.5)",
            animation: `snow-fall ${s.dur}s linear ${s.delay}s infinite`,
            borderRadius: "50%",
            boxShadow: i % 4 === 0 ? "0 0 4px rgba(200,225,255,0.3)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Thunderstorm ───────────────────────────────────────────────────

function ThunderEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {rainDrops.slice(0, 40).map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${d.left}%`,
            top: `${-d.len}px`,
            width: "2.5px",
            height: `${d.len + 10}px`,
            background: "linear-gradient(to bottom, transparent 0%, rgba(150,180,255,0.55) 45%, rgba(150,180,255,0.65) 55%, transparent 100%)",
            animation: `rain-fall ${d.dur * 0.7}s linear ${d.delay}s infinite`,
            borderRadius: "1px",
          }}
        />
      ))}
      {/* Lightning flash overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(200,210,255,0.6)",
          animation: "lightning-flash 8s ease-in-out infinite",
          opacity: 0,
        }}
      />
    </div>
  );
}

// ── Sun / Clear ────────────────────────────────────────────────────

function SunEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Sun glow */}
      <div
        className="absolute"
        style={{
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255,220,100,0.15) 0%, rgba(255,200,50,0.08) 30%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      {/* Sun rays */}
      <div
        className="absolute"
        style={{
          top: "20px",
          right: "20px",
          width: "120px",
          height: "120px",
          background: "conic-gradient(from 0deg, transparent, rgba(255,220,100,0.06) 10%, transparent 20%, rgba(255,220,100,0.04) 30%, transparent 40%, rgba(255,220,100,0.06) 50%, transparent 60%, rgba(255,220,100,0.04) 70%, transparent 80%, rgba(255,220,100,0.06) 90%, transparent)",
          borderRadius: "50%",
          animation: "spin-slow 20s linear infinite",
        }}
      />
      {/* Sparkle particles */}
      {[18, 37, 55, 72, 88].map((seed, i) => {
        const top = 10 + (seed * 3) % 35;
        const left = 65 + (seed * 7) % 30;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: "3px",
              height: "3px",
              background: "rgba(255,230,150,0.5)",
              animation: `sparkle ${2 + i * 0.5}s ease-in-out ${i * 0.8}s infinite`,
              borderRadius: "50%",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Fog ────────────────────────────────────────────────────────────

const fogLayers = [
  { left: "0%", top: "5%", w: "120%", h: "35%", delay: "0s", dur: "12s", op: 0.12 },
  { left: "-10%", top: "30%", w: "130%", h: "30%", delay: "-4s", dur: "15s", op: 0.10 },
  { left: "5%", top: "55%", w: "110%", h: "25%", delay: "-8s", dur: "10s", op: 0.08 },
  { left: "-5%", top: "75%", w: "120%", h: "30%", delay: "-2s", dur: "13s", op: 0.09 },
];

function FogEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {fogLayers.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: f.left,
            top: f.top,
            width: f.w,
            height: f.h,
            background: "linear-gradient(90deg, transparent, rgba(180,200,220,0.06), rgba(200,215,230,0.10), rgba(180,200,220,0.06), transparent)",
            filter: "blur(40px)",
            animation: `fog-drift ${f.dur}s ease-in-out ${f.delay}s infinite`,
            opacity: f.op,
          }}
        />
      ))}
    </div>
  );
}

// ── Map ────────────────────────────────────────────────────────────

const overlayMap: Record<string, React.FC> = {
  clear: SunEffect,
  "partly-cloudy": () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {cloudDefs.map((c, i) => (
        <CloudShape key={i} {...c} />
      ))}
    </div>
  ),
  overcast: () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {cloudDefs.map((c, i) => (
        <CloudShape key={i} {...c} scale={c.scale * 1.3} dur={`${parseInt(c.dur) + 5}s`} />
      ))}
    </div>
  ),
  foggy: FogEffect,
  rainy: RainEffect,
  snowy: SnowEffect,
  thunderstorm: ThunderEffect,
};

export default function WeatherBackground({ weatherCode }: { weatherCode: number }) {
  const theme = getWeatherTheme(weatherCode);
  const Overlay = overlayMap[theme.type];
  return Overlay ? <Overlay /> : null;
}
