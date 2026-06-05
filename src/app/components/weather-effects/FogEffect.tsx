import Overlay from "./Overlay";

const fogLayers = [
  { left: "0%", top: "5%", w: "120%", h: "35%", delay: "0s", dur: "12s", op: 0.14 },
  { left: "-10%", top: "28%", w: "130%", h: "28%", delay: "-4s", dur: "15s", op: 0.11 },
  { left: "5%", top: "50%", w: "110%", h: "22%", delay: "-8s", dur: "10s", op: 0.09 },
  { left: "-5%", top: "70%", w: "120%", h: "28%", delay: "-2s", dur: "13s", op: 0.10 },
  { left: "3%", top: "15%", w: "115%", h: "20%", delay: "-6s", dur: "11s", op: 0.07 },
  { left: "-8%", top: "42%", w: "125%", h: "18%", delay: "-10s", dur: "14s", op: 0.06 },
];

export default function FogEffect() {
  return (
    <Overlay>
      {fogLayers.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: f.left, top: f.top, width: f.w, height: f.h,
            background: "linear-gradient(90deg, transparent, rgba(180,200,220,0.07), rgba(200,215,230,0.11), rgba(180,200,220,0.07), transparent)",
            filter: "blur(50px)",
            animation: `fog-drift ${f.dur}s ease-in-out ${f.delay}s infinite`,
            opacity: f.op,
          }}
        />
      ))}
    </Overlay>
  );
}
