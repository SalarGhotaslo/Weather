import Overlay from "./Overlay";

const SPARKLE_SEEDS = [7, 18, 29, 37, 44, 55, 63, 72, 81, 88];

export default function SunEffect() {
  return (
    <Overlay>
      {/* Large outer glow */}
      <div
        className="absolute"
        style={{
          top: "-100px", right: "-100px", width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(255,220,100,0.18) 0%, rgba(255,200,50,0.1) 25%, rgba(255,180,30,0.04) 50%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      {/* Sun rays */}
      <div
        className="absolute"
        style={{
          top: "20px", right: "20px", width: "140px", height: "140px",
          background: "conic-gradient(from 0deg, transparent, rgba(255,220,100,0.08) 8%, transparent 16%, rgba(255,220,100,0.05) 24%, transparent 32%, rgba(255,220,100,0.08) 40%, transparent 48%, rgba(255,200,50,0.05) 56%, transparent 64%, rgba(255,220,100,0.08) 72%, transparent 80%, rgba(255,220,100,0.05) 88%, transparent 96%)",
          borderRadius: "50%",
          animation: "spin-slow 18s linear infinite",
        }}
      />
      {/* Secondary counter-rotating rays */}
      <div
        className="absolute"
        style={{
          top: "40px", right: "40px", width: "100px", height: "100px",
          background: "conic-gradient(from 90deg, transparent, rgba(255,200,50,0.04) 12%, transparent 24%, rgba(255,200,50,0.06) 36%, transparent 48%, rgba(255,200,50,0.04) 60%, transparent 72%, rgba(255,200,50,0.06) 84%, transparent)",
          borderRadius: "50%",
          animation: "spin-slow 25s linear infinite reverse",
        }}
      />
      {/* Sparkle particles */}
      {SPARKLE_SEEDS.map((seed, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${5 + (seed * 3) % 40}%`,
            left: `${60 + (seed * 7) % 35}%`,
            width: i % 2 === 0 ? "4px" : "2px",
            height: i % 2 === 0 ? "4px" : "2px",
            background: i % 3 === 0 ? "rgba(255,230,150,0.6)" : "rgba(255,250,220,0.4)",
            animation: `sparkle ${1.5 + i * 0.4}s ease-in-out ${i * 0.6}s infinite`,
            borderRadius: "50%",
          }}
        />
      ))}
    </Overlay>
  );
}
