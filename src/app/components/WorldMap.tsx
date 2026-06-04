"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { normalizeCountryName } from "@/lib/countries";
import type { CityMarker } from "@/app/api/city-markers/route";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Position {
  coordinates: [number, number];
  zoom: number;
}

export default function WorldMap() {
  const router = useRouter();
  const [position, setPosition] = useState<Position>({
    coordinates: [0, 20],
    zoom: 1,
  });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [panelCountry, setPanelCountry] = useState<string | null>(null);
  const [panelCities, setPanelCities] = useState<string[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [cityMarkers, setCityMarkers] = useState<CityMarker[]>([]);

  const citiesCache = useRef<Record<string, string[]>>({});
  const markersCache = useRef<Record<string, CityMarker[]>>({});
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadCities = useCallback(async (name: string): Promise<string[]> => {
    if (citiesCache.current[name]) return citiesCache.current[name];
    try {
      const res = await fetch(`/api/cities?country=${encodeURIComponent(name)}`);
      if (!res.ok) return [];
      const cities: string[] = await res.json();
      citiesCache.current[name] = cities;
      return cities;
    } catch {
      return [];
    }
  }, []);

  const showPanel = useCallback(
    async (name: string) => {
      setCityFilter("");
      setPanelCountry(name);
      if (citiesCache.current[name]) {
        setPanelCities(citiesCache.current[name]);
        setPanelLoading(false);
        return;
      }
      setPanelCities([]);
      setPanelLoading(true);
      const cities = await loadCities(name);
      setPanelCities(cities);
      setPanelLoading(false);
    },
    [loadCities],
  );

  const fetchCityMarkers = useCallback(async (countryName: string) => {
    if (markersCache.current[countryName]) {
      setCityMarkers(markersCache.current[countryName]);
      return;
    }
    try {
      const res = await fetch(
        `/api/city-markers?country=${encodeURIComponent(countryName)}`,
      );
      if (!res.ok) return;
      const markers: CityMarker[] = await res.json();
      markersCache.current[countryName] = markers;
      setCityMarkers(markers);
    } catch {
      // silently ignore — markers are a visual enhancement, not critical
    }
  }, []);

  const handleMouseEnter = useCallback(
    (geo: { properties: { name: string }; [key: string]: unknown }) => {
      const name = geo.properties.name;
      setHoveredCountry(name);
      if (selectedCountry) return;
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        showPanel(normalizeCountryName(name));
      }, 350);
    },
    [selectedCountry, showPanel],
  );

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setHoveredCountry(null);
  }, []);

  const handleCountryClick = useCallback(
    (geo: { properties: { name: string }; [key: string]: unknown }) => {
      const rawName = geo.properties.name;
      const name = normalizeCountryName(rawName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const centroid = geoCentroid(geo as any) as [number, number];

      setSelectedCountry(rawName); // raw name for Geography colour comparison
      setPosition({ coordinates: centroid, zoom: 4 });
      setCityMarkers([]);

      // Panel and markers load independently — no need to await one before the other
      void showPanel(name);
      void fetchCityMarkers(name);
    },
    [showPanel, fetchCityMarkers],
  );

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
    setSelectedCountry(null);
    setPanelCountry(null);
    setPanelCities([]);
    setCityFilter("");
    setCityMarkers([]);
  };

  const displayedCities = cityFilter.trim()
    ? panelCities.filter((c) =>
        c.toLowerCase().includes(cityFilter.toLowerCase()),
      )
    : panelCities.slice(0, 60);

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0">
      {/* Map */}
      <div
        className="relative flex-1 bg-[#0d1623] overflow-hidden"
        style={{ minHeight: "55vh" }}
      >
        {selectedCountry && (
          <button
            onClick={handleReset}
            className="absolute top-3 left-3 z-10 bg-[#162535]/90 backdrop-blur-sm hover:bg-[#1c2f3f] text-[#7ea8c2] hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            ← World
          </button>
        )}

        {hoveredCountry && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-[#162535]/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap">
            {hoveredCountry}
          </div>
        )}

        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ zoom, coordinates }) =>
              setPosition({
                zoom,
                coordinates: coordinates as [number, number],
              })
            }
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = (geo.properties as { name: string }).name;
                  const isSelected = selectedCountry === name;
                  const isPaneled =
                    !isSelected &&
                    panelCountry === normalizeCountryName(name);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => handleMouseEnter(geo)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleCountryClick(geo)}
                      style={{
                        default: {
                          fill: isSelected
                            ? "#2563eb"
                            : isPaneled
                              ? "#1c3d6b"
                              : "#1a2d3e",
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
                        pressed: {
                          fill: "#3b82f6",
                          stroke: "#3b87d6",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Major city markers — appear after country click + geocoding */}
            {selectedCountry &&
              cityMarkers.map((marker) => (
                <Marker
                  key={marker.name}
                  coordinates={[marker.lon, marker.lat]}
                >
                  <circle
                    r={5 / position.zoom}
                    fill="#3b87d6"
                    stroke="#0e1723"
                    strokeWidth={0.8 / position.zoom}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      router.push(
                        // Use panelCountry (normalised) not selectedCountry (raw TopoJSON)
                        // so geocodeLocation + findBestGeoMatch get the right country hint
                        `/?q=${encodeURIComponent(`${marker.name}, ${panelCountry}`)}`,
                      )
                    }
                  />
                  <text
                    textAnchor="middle"
                    y={-7 / position.zoom}
                    fontSize={6 / position.zoom}
                    fill="#ffffff"
                    fontWeight="600"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {marker.name}
                  </text>
                </Marker>
              ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Cities panel */}
      <div
        className="bg-[#121f2f] border-t lg:border-t-0 lg:border-l border-[#1e3347] flex flex-col lg:w-72 xl:w-80"
        style={{ height: "45vh" }}
      >
        {panelCountry ? (
          <>
            <div className="p-4 border-b border-[#1e3347] shrink-0">
              <h2 className="text-white font-semibold text-sm">
                {panelCountry}
              </h2>
              {!panelLoading && (
                <p className="text-[#5a7d99] text-xs mt-0.5">
                  {panelCities.length.toLocaleString()} cities · click to see
                  weather
                </p>
              )}
            </div>

            <div className="p-3 border-b border-[#1e3347] shrink-0">
              <input
                type="search"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter cities…"
                className="w-full bg-[#1c2f3f] border border-[#2a4055] rounded px-3 py-1.5 text-white placeholder-[#5a7d99] text-xs focus:outline-none focus:border-[#3b87d6] transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {panelLoading ? (
                <div className="p-4 text-[#5a7d99] text-xs text-center animate-pulse">
                  Loading cities…
                </div>
              ) : displayedCities.length > 0 ? (
                <>
                  {displayedCities.map((city) => (
                    <a
                      key={city}
                      href={`/?q=${encodeURIComponent(`${city}, ${panelCountry}`)}`}
                      className="block px-4 py-2 text-[#7ea8c2] hover:text-white hover:bg-[#162535] text-xs transition-colors border-b border-[#1e3347]/40 last:border-0"
                    >
                      {city}
                    </a>
                  ))}
                  {!cityFilter && panelCities.length > 60 && (
                    <p className="text-[#5a7d99] text-xs text-center py-3 px-4">
                      Showing 60 of {panelCities.length.toLocaleString()}.
                      Search to filter.
                    </p>
                  )}
                  {cityFilter && displayedCities.length === 0 && (
                    <p className="p-4 text-[#5a7d99] text-xs">
                      No cities match.
                    </p>
                  )}
                </>
              ) : (
                <p className="p-4 text-[#5a7d99] text-xs">
                  No city data available.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🌍</div>
              <p className="text-[#7ea8c2] text-sm font-medium">
                Explore the world
              </p>
              <p className="text-[#5a7d99] text-xs mt-1">
                Hover a country to see its cities
              </p>
              <p className="text-[#5a7d99] text-xs">Click to zoom in</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
