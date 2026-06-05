"use client";

import { ComposableMap, ZoomableGroup } from "react-simple-maps";
import { useWorldMap } from "./world-map/useWorldMap";
import MapGeographies from "./world-map/MapGeographies";
import CityMarkers from "./world-map/CityMarkers";
import CitiesPanel from "./world-map/CitiesPanel";
import styles from "./WorldMap.module.css";

export default function WorldMap() {
  const map = useWorldMap();

  return (
    <div className={styles.layout}>
      {/* Map */}
      <div className={styles.mapArea} onClick={map.handleTripleClick}>
        {map.selectedCountry && (
          <button onClick={map.handleReset} className={styles.resetBtn}>← World</button>
        )}
        {map.hoveredCountry && (
          <div className={styles.hoverLabel}>{map.hoveredCountry}</div>
        )}

        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            zoom={map.position.zoom}
            center={map.position.coordinates}
            minZoom={1}
            maxZoom={16}
            onMoveEnd={({ zoom, coordinates }) =>
              map.setPosition({ zoom, coordinates: coordinates as [number, number] })
            }
          >
            <MapGeographies
              selectedCountry={map.selectedCountry}
              panelCountry={map.panelCountry}
              onEnter={map.handleMouseEnter}
              onLeave={map.handleMouseLeave}
              onClick={map.handleCountryClick}
            />

            {/* Major city markers — appear after country click + geocoding */}
            {map.selectedCountry && (
              <CityMarkers
                markers={map.cityMarkers}
                zoom={map.position.zoom}
                hoveredMarker={map.hoveredMarker}
                setHoveredMarker={map.setHoveredMarker}
                onActivate={map.openMarkerForecast}
              />
            )}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <CitiesPanel
        panelCountry={map.panelCountry}
        panelCities={map.panelCities}
        panelLoading={map.panelLoading}
        cityFilter={map.cityFilter}
        setCityFilter={map.setCityFilter}
        displayedCities={map.displayedCities}
        cardLoading={map.cardLoading}
        cardError={map.cardError}
        card={map.card}
        onCityClick={map.openCityForecast}
        majorCities={map.cityMarkers.map((m) => m.name)}
      />
    </div>
  );
}
