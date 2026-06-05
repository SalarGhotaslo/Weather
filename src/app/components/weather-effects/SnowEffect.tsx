import Overlay from "./Overlay";

const snowFlakes = Array.from({ length: 80 }, (_, i) => ({
  left: (i * 12 + 7) % 100,
  delay: (i * 0.2) % 5,
  dur: 4 + (i % 10) * 0.5,
  size: 4 + (i % 6) * 3,
}));

const FLAKE_COLORS = [
  "rgba(220,240,255,0.75)",
  "rgba(240,248,255,0.65)",
  "rgba(200,225,250,0.55)",
  "rgba(255,255,255,0.45)",
];

export default function SnowEffect() {
  return (
    <Overlay>
      {snowFlakes.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${-s.size}px`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: FLAKE_COLORS[i % 4],
            animation: `snow-fall ${s.dur}s linear ${s.delay}s infinite`,
            borderRadius: "50%",
            boxShadow: i % 3 === 0 ? "0 0 6px rgba(200,225,255,0.4)" : "none",
          }}
        />
      ))}
    </Overlay>
  );
}
