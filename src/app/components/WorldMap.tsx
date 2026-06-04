"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import type { Feature } from "geojson";
import { normalizeCountryName } from "@/lib/countries";
import { getWeatherInfo, formatCityTime } from "@/lib/weather";
import LocalTime from "./LocalTime";
import type { CityMarker } from "@/app/api/city-markers/route";
import type { CurrentWeather } from "@/app/api/current/route";

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
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  // Inline weather card shown when a country, city marker, or panel city is
  // clicked. `country` is carried alongside so the "full forecast" link works.
  const [card, setCard] = useState<(CurrentWeather & { country: string }) | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const citiesCache = useRef<Record<string, string[]>>({});
  const markersCache = useRef<Record<string, CityMarker[]>>({});
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Monotonic token so a slow request from an earlier click can't overwrite the
  // card with stale data after a newer click has started.
  const cardReq = useRef(0);

  const loadWeather = useCallback(
    async (params: {
      country: string; // normalized country name — used for the forecast link + geocode hint
      lat?: number;
      lon?: number;
      name?: string; // city label when already known
      cityQuery?: string; // city to geocode by name
    }) => {
      const token = ++cardReq.current;
      setCardError(false);
      setCardLoading(true);
      setCard(null);

      const qs = new URLSearchParams();
      if (params.lat !== undefined && params.lon !== undefined) {
        qs.set("lat", String(params.lat));
        qs.set("lon", String(params.lon));
        if (params.name) qs.set("name", params.name);
      } else if (params.cityQuery) {
        qs.set("city", params.cityQuery);
        qs.set("country", params.country);
      } else {
        qs.set("country", params.country);
      }

      try {
        const res = await fetch(`/api/current?${qs.toString()}`);
        if (token !== cardReq.current) return; // superseded by a newer click
        const data: CurrentWeather | null = res.ok ? await res.json() : null;
        if (token !== cardReq.current) return;
        if (!data) {
          setCardError(true);
        } else {
          setCard({ ...data, country: params.country });
        }
      } catch {
        if (token === cardReq.current) setCardError(true);
      } finally {
        if (token === cardReq.current) setCardLoading(false);
      }
    },
    [],
  );

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
      const centroid = geoCentroid(geo as unknown as Feature) as [number, number];

      setSelectedCountry(rawName); // raw name for Geography colour comparison
      setPosition({ coordinates: centroid, zoom: 4 });
      setCityMarkers([]);

      // Panel, markers, and the capital's weather card load independently
      void showPanel(name);
      void fetchCityMarkers(name);
      void loadWeather({ country: name });
    },
    [showPanel, fetchCityMarkers, loadWeather],
  );

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
    setSelectedCountry(null);
    setPanelCountry(null);
    setPanelCities([]);
    setCityFilter("");
    setCityMarkers([]);
    cardReq.current++; // cancel any in-flight card request
    setCard(null);
    setCardLoading(false);
    setCardError(false);
  };

  const handleTripleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("path") || target.closest("circle")) return;
    clickCountRef.current++;
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      clearTimeout(clickTimerRef.current);
      setPosition((prev) => ({
        ...prev,
        zoom: Math.max(1, prev.zoom / 2),
      }));
      return;
    }
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 400);
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
        onClick={handleTripleClick}
      >
        {selectedCountry && (
          <button
            onClick={handleReset}
            className="absolute top-3 left-3 z-10 bg-[#162535]/90 backdrop-blur-sm hover:bg-[#1c2f3f] text-[var(--text-muted)] hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
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
                      tabIndex={0}
                      role="button"
                      aria-label={name}
                      onMouseEnter={() => handleMouseEnter(geo)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleCountryClick(geo)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCountryClick(geo);
                        }
                      }}
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
              cityMarkers.map((marker) => {
                const isHovered = hoveredMarker === marker.name;
                const dotR = 6 / position.zoom;
                const labelSize = 9 / position.zoom;
                const bgPad = 2 / position.zoom;
                const bgH = labelSize + bgPad * 2;
                const approxW = marker.name.length * labelSize * 0.6 + bgPad * 4;
                return (
                  <Marker
                    key={marker.name}
                    coordinates={[marker.lon, marker.lat]}
                  >
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
                            y={-(dotR + bgH + 3 / position.zoom)}
                            width={approxW}
                            height={bgH}
                            rx={2 / position.zoom}
                            fill="#1c2f3f"
                            stroke="#3b87d6"
                            strokeWidth={0.6 / position.zoom}
                            strokeOpacity={0.7}
                            style={{ pointerEvents: "none" }}
                          />
                          <text
                            textAnchor="middle"
                            y={-(dotR + bgPad + 2 / position.zoom)}
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
                        strokeWidth={1.2 / position.zoom}
                        tabIndex={0}
                        role="button"
                        aria-label={`View weather in ${marker.name}`}
                        style={{ cursor: "pointer", transition: "r 0.1s, fill 0.1s" }}
                        onClick={() =>
                          router.push(`/day/0?lat=${marker.lat}&lon=${marker.lon}&name=${encodeURIComponent(marker.name)}`)
                        }
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            loadWeather({
                              country: panelCountry ?? "",
                              lat: marker.lat,
                              lon: marker.lon,
                              name: marker.name,
                            });
                          }
                        }}
                      />
                      <circle
                        r={dotR * 1.8}
                        fill="none"
                        stroke="#3b87d6"
                        strokeWidth={0.6 / position.zoom}
                        strokeOpacity={isHovered ? 0.6 : 0.3}
                        style={{ pointerEvents: "none" }}
                      />
                    </g>
                  </Marker>
                );
              })}
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
                <p className="text-[var(--text-muted)] text-xs mt-0.5">
                  {panelCities.length.toLocaleString()} cities · click one for
                  its weather
                </p>
              )}
            </div>

            {/* Inline weather card — capital on country click, the city on a city click */}
            {(cardLoading || card || cardError) && (
              <div className="p-4 border-b border-[#1e3347] shrink-0 bg-[#0f1b29]">
                {cardLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 w-32 bg-[#1c2f3f] rounded" />
                    <div className="h-7 w-24 bg-[#1c2f3f] rounded" />
                    <div className="h-3 w-40 bg-[#1c2f3f] rounded" />
                  </div>
                ) : cardError ? (
                  <p className="text-[var(--text-muted)] text-xs">
                    Weather unavailable for this location.
                  </p>
                ) : card ? (
                  <>
                    <p className="text-white text-sm font-semibold truncate">
                      {card.name}
                      {card.isCapital && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-[var(--text-accent)] font-medium">
                          capital
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl" aria-hidden="true">
                        {getWeatherInfo(card.code).emoji}
                      </span>
                      <span className="text-white text-2xl font-bold">
                        {card.temp}°
                      </span>
                      <span className="text-[var(--text-muted)] text-xs">
                        {getWeatherInfo(card.code).label}
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)] text-xs mt-1">
                      Feels {card.feelsLike}° ·{" "}
                      <LocalTime
                        timezone={card.timezone}
                        initial={formatCityTime(card.timezone)}
                        className="inline"
                        label={`Local time in ${card.name}`}
                      />
                    </p>
                    <a
                      href={`/?q=${encodeURIComponent(`${card.name}, ${card.country}`)}`}
                      className="inline-block mt-2 text-[var(--text-accent)] hover:text-white text-xs transition-colors"
                    >
                      Full 5-day forecast →
                    </a>
                  </>
                ) : null}
              </div>
            )}

            <div className="p-3 border-b border-[#1e3347] shrink-0">
                <input
                  type="search"
                  value={cityFilter}
                  aria-label="Filter cities"
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Filter cities…"
                  className="w-full bg-[#1c2f3f] border border-[#2a4055] rounded px-3 py-1.5 text-white placeholder-[#5a7d99] text-xs focus:outline-none focus:border-[#3b87d6] transition-colors"
                />
            </div>

            <div className="flex-1 overflow-y-auto">
              {panelLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-7 bg-[#162535] rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
                  ))}
                </div>
              ) : displayedCities.length > 0 ? (
                <>
                  {displayedCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() =>
                        router.push(`/?q=${encodeURIComponent(`${city}, ${panelCountry}`)}`)
                      }
                      className="block w-full text-left px-4 py-2 text-[var(--text-muted)] hover:text-white hover:bg-[#162535] text-xs transition-colors border-b border-[#1e3347]/40 last:border-0"
                    >
                      {city}
                    </button>
                  ))}
                  {!cityFilter && panelCities.length > 60 && (
                    <p className="text-[var(--text-muted)] text-xs text-center py-3 px-4">
                      Showing 60 of {panelCities.length.toLocaleString()}.
                      Search to filter.
                    </p>
                  )}
                  {cityFilter && displayedCities.length === 0 && (
                    <p className="p-4 text-[var(--text-muted)] text-xs">
                      No cities match.
                    </p>
                  )}
                </>
              ) : (
                <p className="p-4 text-[var(--text-muted)] text-xs">
                  No city data available.
                </p>
              )}
            </div>
            {/* Footer: deep link to country page */}
            <div className="shrink-0 border-t border-[#1e3347] p-3">
              <a
                href={`/countries?search=${encodeURIComponent(panelCountry ?? "")}`}
                className="block text-center text-[var(--text-accent)] hover:text-white text-xs py-1.5 transition-colors"
              >
                Browse all cities in {panelCountry} →
              </a>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🌍</div>
              <p className="text-[var(--text-muted)] text-sm font-medium">
                Explore the world
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1">
                Hover a country to see its cities
              </p>
              <p className="text-[var(--text-muted)] text-xs">Click to zoom in</p>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">Triple-click to zoom out</p>
              <Link
                href="/countries"
                className="mt-4 inline-block text-[var(--text-accent)] hover:text-white text-xs transition-colors"
              >
                Or browse all countries →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
