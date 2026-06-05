import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { geoCentroid } from "d3-geo";
import type { Feature } from "geojson";
import { normalizeCountryName } from "@/lib/countries";
import type { CityMarker } from "@/lib/cityMarkers";
import type { CurrentWeather } from "@/app/api/current/route";

export interface Position {
  coordinates: [number, number];
  zoom: number;
}

type GeoLike = { properties: { name: string }; [key: string]: unknown };

// All state, caches, data-loading and interaction handlers for the world map.
// Extracted from WorldMap.tsx so the component is pure composition.
export function useWorldMap() {
  const router = useRouter();
  const [position, setPosition] = useState<Position>({ coordinates: [0, 20], zoom: 1 });
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
    async (params: { country: string; lat?: number; lon?: number; name?: string; cityQuery?: string }) => {
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
        if (!data) setCardError(true);
        else setCard({ ...data, country: params.country });
      } catch {
        if (token === cardReq.current) setCardError(true);
      } finally {
        if (token === cardReq.current) setCardLoading(false);
      }
    },
    [],
  );

  // A city marker (dot) opens that city's full forecast. Shared by mouse click
  // and keyboard activation so both behave identically.
  const openMarkerForecast = useCallback(
    (marker: CityMarker) => {
      router.push(`/day/0?lat=${marker.lat}&lon=${marker.lon}&name=${encodeURIComponent(marker.name)}`);
    },
    [router],
  );

  const openCityForecast = useCallback(
    (city: string) => {
      router.push(`/?q=${encodeURIComponent(`${city}, ${panelCountry}`)}`);
    },
    [router, panelCountry],
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
      const res = await fetch(`/api/city-markers?country=${encodeURIComponent(countryName)}`);
      if (!res.ok) return;
      const markers: CityMarker[] = await res.json();
      markersCache.current[countryName] = markers;
      setCityMarkers(markers);
    } catch {
      // silently ignore — markers are a visual enhancement, not critical
    }
  }, []);

  const handleMouseEnter = useCallback(
    (geo: GeoLike) => {
      const name = geo.properties.name;
      setHoveredCountry(name);
      if (selectedCountry) return;
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => showPanel(normalizeCountryName(name)), 350);
    },
    [selectedCountry, showPanel],
  );

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setHoveredCountry(null);
  }, []);

  const handleCountryClick = useCallback(
    (geo: GeoLike) => {
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

  const handleReset = useCallback(() => {
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
  }, []);

  const handleTripleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("path") || target.closest("circle")) return;
    clickCountRef.current++;
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      clearTimeout(clickTimerRef.current);
      setPosition((prev) => ({ ...prev, zoom: Math.max(1, prev.zoom / 2) }));
      return;
    }
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 400);
  }, []);

  const displayedCities = cityFilter.trim()
    ? panelCities.filter((c) => c.toLowerCase().includes(cityFilter.toLowerCase()))
    : panelCities.slice(0, 60);

  return {
    position, setPosition,
    hoveredCountry, selectedCountry, panelCountry,
    panelCities, panelLoading, cityFilter, setCityFilter,
    cityMarkers, hoveredMarker, setHoveredMarker,
    card, cardLoading, cardError,
    displayedCities,
    handleMouseEnter, handleMouseLeave, handleCountryClick,
    handleReset, handleTripleClick, openMarkerForecast, openCityForecast,
  };
}
