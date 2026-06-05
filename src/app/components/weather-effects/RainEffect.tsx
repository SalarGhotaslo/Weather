import Overlay from "./Overlay";

// Shared deterministic raindrop seeds (also used by the thunderstorm effect).
export const rainDrops = Array.from({ length: 80 }, (_, i) => ({
  left: (i * 13 + 5) % 100,
  delay: (i * 0.06) % 1.5,
  dur: 0.3 + (i % 6) * 0.04,
  len: 25 + (i % 5) * 10,
}));

export default function RainEffect() {
  return (
    <Overlay>
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
    </Overlay>
  );
}
