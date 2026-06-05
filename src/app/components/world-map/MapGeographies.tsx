import { Geographies, Geography } from "react-simple-maps";
import { normalizeCountryName } from "@/lib/countries";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type GeoLike = { properties: { name: string }; [key: string]: unknown };

// Country polygons + hover/click/keyboard handlers. Selected country is blue,
// the hover-previewed (paneled) country a dimmer blue.
export default function MapGeographies({
  selectedCountry,
  panelCountry,
  onEnter,
  onLeave,
  onClick,
}: {
  selectedCountry: string | null;
  panelCountry: string | null;
  onEnter: (geo: GeoLike) => void;
  onLeave: () => void;
  onClick: (geo: GeoLike) => void;
}) {
  return (
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies.map((geo) => {
          const name = (geo.properties as { name: string }).name;
          const isSelected = selectedCountry === name;
          const isPaneled = !isSelected && panelCountry === normalizeCountryName(name);

          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              tabIndex={0}
              role="button"
              aria-label={name}
              onMouseEnter={() => onEnter(geo)}
              onMouseLeave={onLeave}
              onClick={() => onClick(geo)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick(geo);
                }
              }}
              style={{
                default: {
                  fill: isSelected ? "#2563eb" : isPaneled ? "#1c3d6b" : "#1a2d3e",
                  stroke: "#0e1723",
                  strokeWidth: 0.5,
                  outline: "none",
                  cursor: "pointer",
                  transition: "fill 0.1s",
                },
                hover: {
                  fill: isSelected ? "#3b82f6" : "#1c4a7a",
                  stroke: "#3b87d6",
                  strokeWidth: 0.7,
                  outline: "none",
                  cursor: "pointer",
                },
                pressed: { fill: "#3b82f6", stroke: "#3b87d6", outline: "none" },
              }}
            />
          );
        })
      }
    </Geographies>
  );
}
