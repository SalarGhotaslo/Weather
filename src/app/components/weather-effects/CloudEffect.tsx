import Overlay from "./Overlay";

const cloudDefs = [
  { left: "2%", top: "6%", scale: 1, delay: "0s", dur: "22s" },
  { left: "30%", top: "14%", scale: 0.75, delay: "-7s", dur: "26s" },
  { left: "55%", top: "4%", scale: 1.1, delay: "-14s", dur: "20s" },
  { left: "75%", top: "18%", scale: 0.6, delay: "-4s", dur: "28s" },
  { left: "10%", top: "32%", scale: 0.5, delay: "-11s", dur: "30s" },
  { left: "45%", top: "25%", scale: 0.4, delay: "-5s", dur: "24s" },
  { left: "-5%", top: "10%", scale: 0.85, delay: "-18s", dur: "25s" },
];

// A single drifting cloud built from layered translucent circles.
function CloudShape({ left, top, scale = 1, delay = "0s", dur = "20s" }: {
  left?: string; top?: string; scale?: number; delay?: string; dur?: string;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ animation: `cloud-drift ${dur} ease-in-out ${delay} infinite`, left, top, transform: `scale(${scale})` }}
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
        <div className="absolute bottom-[30%] left-[18%]" style={{ width: "80px", height: "60px", background: "rgba(160,195,230,0.12)", borderRadius: "50%" }} />
        <div className="absolute bottom-[20%] left-[35%]" style={{ width: "100px", height: "80px", background: "rgba(160,195,230,0.14)", borderRadius: "50%" }} />
        <div className="absolute bottom-[30%] left-[55%]" style={{ width: "70px", height: "55px", background: "rgba(160,195,230,0.10)", borderRadius: "50%" }} />
      </div>
    </div>
  );
}

export function PartlyCloudyEffect() {
  return (
    <Overlay>
      {cloudDefs.map((c, i) => <CloudShape key={i} {...c} />)}
    </Overlay>
  );
}

export function OvercastEffect() {
  return (
    <Overlay>
      {cloudDefs.map((c, i) => (
        <CloudShape key={i} {...c} scale={c.scale * 1.4} dur={`${parseInt(c.dur) + 6}s`} />
      ))}
    </Overlay>
  );
}
