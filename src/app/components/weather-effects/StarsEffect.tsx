import Overlay from "./Overlay";

const starSeeds = [5, 12, 19, 27, 34, 41, 48, 56, 63, 70, 77, 84, 91, 9, 23, 38, 52, 67, 81, 95];

// Moon + twinkling stars, used for clear / partly-cloudy nights.
export default function StarsEffect() {
  return (
    <Overlay>
      {/* Moon */}
      <div
        className="absolute"
        style={{
          top: "40px", right: "60px", width: "70px", height: "70px", borderRadius: "50%",
          background: "radial-gradient(circle at 38% 38%, #f4f7ff 0%, #cdd8ee 55%, #9fb0d4 100%)",
          boxShadow: "0 0 40px rgba(200,215,255,0.35), inset -8px -6px 0 rgba(120,140,180,0.25)",
          animation: "pulse-glow 6s ease-in-out infinite",
        }}
      />
      {/* Stars */}
      {starSeeds.map((seed, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${4 + (seed * 7) % 70}%`,
            left: `${(seed * 11) % 96}%`,
            width: `${i % 3 === 0 ? 3 : 2}px`,
            height: `${i % 3 === 0 ? 3 : 2}px`,
            background: "rgba(235,242,255,0.9)",
            animation: `sparkle ${2 + (i % 5) * 0.6}s ease-in-out ${i * 0.35}s infinite`,
          }}
        />
      ))}
    </Overlay>
  );
}
