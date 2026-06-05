import Overlay from "./Overlay";
import { rainDrops } from "./RainEffect";

export default function ThunderEffect() {
  return (
    <Overlay>
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
    </Overlay>
  );
}
