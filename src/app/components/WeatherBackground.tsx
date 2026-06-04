"use client";

import { getWeatherTheme } from "@/lib/weatherTheme";

// ── Cloud shape using layered circles ──────────────────────────────

const cloudDefs = [
  { left: "2%", top: "6%", scale: 1, delay: "0s", dur: "22s" },
  { left: "30%", top: "14%", scale: 0.75, delay: "-7s", dur: "26s" },
  { left: "55%", top: "4%", scale: 1.1, delay: "-14s", dur: "20s" },
  { left: "75%", top: "18%", scale: 0.6, delay: "-4s", dur: "28s" },
  { left: "10%", top: "32%", scale: 0.5, delay: "-11s", dur: "30s" },
  { left: "45%", top: "25%", scale: 0.4, delay: "-5s", dur: "24s" },
  { left: "-5%", top: "10%", scale: 0.85, delay: "-18s", dur: "25s" },
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

const rainDrops = Array.from({ length: 80 }, (_, i) => ({
  left: (i * 13 + 5) % 100,
  delay: (i * 0.06) % 1.5,
  dur: 0.3 + (i % 6) * 0.04,
  len: 25 + (i % 5) * 10,
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
            background: "linear-gradient(to bottom, transparent 0%, rgba(130,180,240,0.5) 40%, rgba(140,190,245,0.6) 60%, transparent 100%)",
            animation: `rain-fall ${d.dur}s linear ${d.delay}s infinite`,
            borderRadius: "1px",
          }}
        />
      ))}
      {rainDrops.slice(0, 20).map((d, i) => (
        <div
          key={`s${i}`}
          className="absolute w-[3px] h-[3px] rounded-full"
          style={{
            left: `${(d.left + 3) % 100}%`,
            bottom: `${5 + (i % 10) * 2}%`,
            background: "rgba(130,180,240,0.25)",
            animation: `rain-splash ${0.3 + (i % 4) * 0.04}s ease-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Snow ───────────────────────────────────────────────────────────

const snowFlakes = Array.from({ length: 80 }, (_, i) => ({
  left: (i * 12 + 7) % 100,
  delay: (i * 0.2) % 5,
  dur: 4 + (i % 10) * 0.5,
  size: 4 + (i % 6) * 3,
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
            background: i % 4 === 0
              ? "rgba(220,240,255,0.75)"
              : i % 4 === 1
                ? "rgba(240,248,255,0.65)"
                : i % 4 === 2
                  ? "rgba(200,225,250,0.55)"
                  : "rgba(255,255,255,0.45)",
            animation: `snow-fall ${s.dur}s linear ${s.delay}s infinite`,
            borderRadius: "50%",
            boxShadow: i % 3 === 0 ? "0 0 6px rgba(200,225,255,0.4)" : "none",
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
      {rainDrops.slice(0, 50).map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${d.left}%`,
            top: `${-d.len}px`,
            width: "2.5px",
            height: `${d.len + 10}px`,
            background: "linear-gradient(to bottom, transparent 0%, rgba(150,180,255,0.6) 40%, rgba(170,200,255,0.7) 60%, transparent 100%)",
            animation: `rain-fall ${d.dur * 0.7}s linear ${d.delay}s infinite`,
            borderRadius: "1px",
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(200,210,255,0.5) 0%, transparent 70%)",
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
      {/* Large outer glow */}
      <div
        className="absolute"
        style={{
          top: "-100px",
          right: "-100px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(255,220,100,0.18) 0%, rgba(255,200,50,0.1) 25%, rgba(255,180,30,0.04) 50%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      {/* Sun rays — larger */}
      <div
        className="absolute"
        style={{
          top: "20px",
          right: "20px",
          width: "140px",
          height: "140px",
          background: "conic-gradient(from 0deg, transparent, rgba(255,220,100,0.08) 8%, transparent 16%, rgba(255,220,100,0.05) 24%, transparent 32%, rgba(255,220,100,0.08) 40%, transparent 48%, rgba(255,200,50,0.05) 56%, transparent 64%, rgba(255,220,100,0.08) 72%, transparent 80%, rgba(255,220,100,0.05) 88%, transparent 96%)",
          borderRadius: "50%",
          animation: "spin-slow 18s linear infinite",
        }}
      />
      {/* Secondary counter-rotating rays */}
      <div
        className="absolute"
        style={{
          top: "40px",
          right: "40px",
          width: "100px",
          height: "100px",
          background: "conic-gradient(from 90deg, transparent, rgba(255,200,50,0.04) 12%, transparent 24%, rgba(255,200,50,0.06) 36%, transparent 48%, rgba(255,200,50,0.04) 60%, transparent 72%, rgba(255,200,50,0.06) 84%, transparent)",
          borderRadius: "50%",
          animation: "spin-slow 25s linear infinite reverse",
        }}
      />
      {/* Sparkle particles — more of them */}
      {[7, 18, 29, 37, 44, 55, 63, 72, 81, 88].map((seed, i) => {
        const top = 5 + (seed * 3) % 40;
        const left = 60 + (seed * 7) % 35;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: i % 2 === 0 ? "4px" : "2px",
              height: i % 2 === 0 ? "4px" : "2px",
              background: i % 3 === 0
                ? "rgba(255,230,150,0.6)"
                : "rgba(255,250,220,0.4)",
              animation: `sparkle ${1.5 + i * 0.4}s ease-in-out ${i * 0.6}s infinite`,
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
  { left: "0%", top: "5%", w: "120%", h: "35%", delay: "0s", dur: "12s", op: 0.14 },
  { left: "-10%", top: "28%", w: "130%", h: "28%", delay: "-4s", dur: "15s", op: 0.11 },
  { left: "5%", top: "50%", w: "110%", h: "22%", delay: "-8s", dur: "10s", op: 0.09 },
  { left: "-5%", top: "70%", w: "120%", h: "28%", delay: "-2s", dur: "13s", op: 0.10 },
  { left: "3%", top: "15%", w: "115%", h: "20%", delay: "-6s", dur: "11s", op: 0.07 },
  { left: "-8%", top: "42%", w: "125%", h: "18%", delay: "-10s", dur: "14s", op: 0.06 },
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
            background: "linear-gradient(90deg, transparent, rgba(180,200,220,0.07), rgba(200,215,230,0.11), rgba(180,200,220,0.07), transparent)",
            filter: "blur(50px)",
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
        <CloudShape key={i} {...c} scale={c.scale * 1.4} dur={`${parseInt(c.dur) + 6}s`} />
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
