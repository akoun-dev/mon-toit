import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BurkinaCity, BURKINA_CENTER } from '@/data/burkinaCities';
import { CityStats } from '@/hooks/useCityStats';
import { MapProperty } from '@/hooks/useMapProperties';
import { createRoot } from 'react-dom/client';
import CityMarker from './CityMarker';
import CityStatsPanel from './CityStatsPanel';

interface BurkinaNationalMapProps {
  cityStats: CityStats[];
  properties: MapProperty[];
  onCityClick?: (city: BurkinaCity) => void;
}

const BurkinaNationalMap = ({ cityStats, properties, onCityClick }: BurkinaNationalMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY200Mms3eDk3MDBzMjJpcXp6Z3p5NnNsaCJ9.0nSOixsRaBQMp7VvJTlYkg';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [BURKINA_CENTER.longitude, BURKINA_CENTER.latitude],
      zoom: BURKINA_CENTER.zoom,
      pitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add city markers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for cities with properties
    cityStats.forEach(stats => {
      const { city } = stats;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'city-marker-container';
      
      const root = createRoot(el);
      root.render(
        <CityMarker 
          stats={stats}
          onClick={() => {
            if (stats.propertyCount > 0) {
              // Zoom to city
              map.current?.flyTo({
                center: [city.longitude, city.latitude],
                zoom: 12,
                duration: 2000
              });
              
              onCityClick?.(city);
            }
          }}
        />
      );

      // Create popup
      const popupEl = document.createElement('div');
      const popupRoot = createRoot(popupEl);
      popupRoot.render(<CityStatsPanel stats={stats} />);

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px'
      }).setDOMContent(popupEl);

      // Add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([city.longitude, city.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all cities
    if (cityStats.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      cityStats.forEach(({ city }) => {
        bounds.extend([city.longitude, city.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 8
      });
    }
  }, [mapReady, cityStats, onCityClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg border border-border">
        <div className="text-xs font-medium text-foreground mb-2">Légende</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Villes avec propriétés</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full border-2 border-primary bg-background"></div>
            <span className="text-muted-foreground">Cliquer pour zoomer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurkinaNationalMap;
