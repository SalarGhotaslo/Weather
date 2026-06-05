import { Marker } from "react-simple-maps";
import type { CityMarker } from "@/lib/cityMarkers";

// Major-city dots rendered inside the map's ZoomableGroup. The label appears on
// hover or keyboard focus; the dot opens that city's forecast on click/Enter.
export default function CityMarkers({
  markers,
  zoom,
  hoveredMarker,
  setHoveredMarker,
  onActivate,
}: {
  markers: CityMarker[];
  zoom: number;
  hoveredMarker: string | null;
  setHoveredMarker: (name: string | null) => void;
  onActivate: (marker: CityMarker) => void;
}) {
  return (
    <>
      {markers.map((marker) => {
        const isHovered = hoveredMarker === marker.name;
        const dotR = 6 / zoom;
        const labelSize = 9 / zoom;
        const bgPad = 2 / zoom;
        const bgH = labelSize + bgPad * 2;
        const approxW = marker.name.length * labelSize * 0.6 + bgPad * 4;
        return (
          <Marker key={marker.name} coordinates={[marker.lon, marker.lat]}>
            {/* Wrapping <g> makes mouseenter/leave fire for the whole group,
                so moving from dot into the label doesn't flicker. */}
            <g
              onMouseEnter={() => setHoveredMarker(marker.name)}
              onMouseLeave={() => setHoveredMarker(null)}
            >
              {isHovered && (
                <>
                  <rect
                    x={-approxW / 2}
                    y={-(dotR + bgH + 3 / zoom)}
                    width={approxW}
                    height={bgH}
                    rx={2 / zoom}
                    fill="#1c2f3f"
                    stroke="#3b87d6"
                    strokeWidth={0.6 / zoom}
                    strokeOpacity={0.7}
                    style={{ pointerEvents: "none" }}
                  />
                  <text
                    textAnchor="middle"
                    y={-(dotR + bgPad + 2 / zoom)}
                    fontSize={labelSize}
                    fill="#e2f0fb"
                    fontWeight="700"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {marker.name}
                  </text>
                </>
              )}
              <circle
                r={isHovered ? dotR * 1.3 : dotR}
                fill={isHovered ? "#60a5fa" : "#3b87d6"}
                stroke="#0e1723"
                strokeWidth={1.2 / zoom}
                tabIndex={0}
                role="button"
                aria-label={`View weather in ${marker.name}`}
                style={{ cursor: "pointer", transition: "r 0.1s, fill 0.1s" }}
                // First tap (non-hovered) shows the label; second tap navigates.
                // Desktop hover already sets hoveredMarker via onMouseEnter, so
                // on desktop a single click always navigates — only mobile needs
                // the two-tap workflow since touch never fires mouseenter.
                onClick={() => {
                  if (!isHovered) {
                    setHoveredMarker(marker.name);
                  } else {
                    onActivate(marker);
                  }
                }}
                // Reveal the label on keyboard focus too.
                onFocus={() => setHoveredMarker(marker.name)}
                onBlur={() => setHoveredMarker(null)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onActivate(marker); // keyboard + pointer stay consistent
                  }
                }}
              />
              <circle
                r={dotR * 1.8}
                fill="none"
                stroke="#3b87d6"
                strokeWidth={0.6 / zoom}
                strokeOpacity={isHovered ? 0.6 : 0.3}
                style={{ pointerEvents: "none" }}
              />
            </g>
          </Marker>
        );
      })}
    </>
  );
}
