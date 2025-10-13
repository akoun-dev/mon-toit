import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Locate, Map, Satellite, Layers } from 'lucide-react';
import { Card } from './ui/card';
import { logger } from '@/services/logger';

interface Property {
  id: string;
  title: string;
  city: string;
  monthly_rent: number;
  latitude: number | null;
  longitude: number | null;
  main_image: string | null;
}

interface PropertyMapProps {
  properties: Property[];
  onPropertyClick?: (propertyId: string) => void;
  onLocationSearch?: (lat: number, lng: number) => void;
  showLocationButton?: boolean;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY200N2lwbDJhMDBseTJycHlnOTluZnN1biJ9.JLechweMLsxP7qlR6cT-Og';

type MapStyle = 'streets' | 'satellite' | 'hybrid';

const MAP_STYLES: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  hybrid: 'mapbox://styles/mapbox/satellite-streets-v12',
};

const PropertyMap = ({ 
  properties, 
  onPropertyClick, 
  onLocationSearch,
  showLocationButton = true 
}: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    return (localStorage.getItem('preferredMapStyle') as MapStyle) || 'streets';
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      if (!MAPBOX_TOKEN) {
        logger.warn('Mapbox token not configured');
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle],
        center: [-4.0305, 5.3599], // Abidjan coordinates
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        setMapReady(true);
      });
    } catch (error) {
      logger.logError(error, { context: 'Map initialization' });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapStyle]);

  // Function to add markers to the map
  const addMarkersToMap = () => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter properties with valid coordinates
    const validProperties = properties.filter(
      p => p.latitude !== null && p.longitude !== null
    );

    if (validProperties.length === 0) return;

    // Add markers for each property with enhanced styling
    validProperties.forEach(property => {
      const el = document.createElement('div');
      el.className = 'property-marker';
      
      // Enhanced marker styling with ANSUT colors
      el.innerHTML = `
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
          <div class="relative w-10 h-10 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform">
            ${(property.monthly_rent / 1000).toFixed(0)}k
          </div>
        </div>
      `;
      el.style.cursor = 'pointer';

      // Enhanced popup with image and better styling
      const popupHTML = `
        <div class="min-w-[200px]">
          ${property.main_image ? `
            <img 
              src="${property.main_image}" 
              alt="${property.title}"
              class="w-full h-32 object-cover rounded-t-lg mb-2"
            />
          ` : ''}
          <div class="p-3">
            <h3 class="font-semibold text-sm mb-2 text-foreground">${property.title}</h3>
            <div class="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span>${property.city}</span>
            </div>
            <p class="text-base font-bold text-primary">${property.monthly_rent.toLocaleString()} FCFA<span class="text-xs font-normal">/mois</span></p>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        className: 'property-popup'
      }).setHTML(popupHTML);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude!, property.latitude!])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        if (onPropertyClick) {
          onPropertyClick(property.id);
        }
      });

      markers.current.push(marker);
    });

    // Fit map to show all markers
    if (validProperties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validProperties.forEach(property => {
        bounds.extend([property.longitude!, property.latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  };

  // Update markers when properties change
  useEffect(() => {
    addMarkersToMap();
  }, [properties, mapReady, onPropertyClick]);

  // Handle map style change
  const handleStyleChange = (newStyle: MapStyle) => {
    if (!map.current || mapStyle === newStyle) return;
    
    setMapStyle(newStyle);
    localStorage.setItem('preferredMapStyle', newStyle);
    
    map.current.once('style.load', () => {
      addMarkersToMap();
    });
    
    map.current.setStyle(MAP_STYLES[newStyle]);
  };

  const handleLocateMe = () => {
    setLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 13,
              essential: true
            });

            // Add user location marker
            new mapboxgl.Marker({ color: '#3b82f6' })
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          }

          if (onLocationSearch) {
            onLocationSearch(latitude, longitude);
          }
          
          setLocating(false);
        },
        (error) => {
          logger.logError(error, { context: 'Geolocation' });
          setLocating(false);
        }
      );
    } else {
      setLocating(false);
    }
  };

  return (
    <div className="relative w-full h-[600px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {showLocationButton && (
        <div className="absolute top-4 left-4 z-10">
          <Button
            onClick={handleLocateMe}
            disabled={locating}
            size="sm"
            className="shadow-lg"
          >
            <Locate className="h-4 w-4 mr-2" />
            {locating ? 'Localisation...' : 'Autour de moi'}
          </Button>
        </div>
      )}

      <div className="absolute top-16 left-4 z-10 flex flex-col gap-2">
        <Button
          onClick={() => handleStyleChange('streets')}
          size="sm"
          variant={mapStyle === 'streets' ? 'default' : 'outline'}
          className="shadow-lg"
        >
          <Map className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Rues</span>
        </Button>
        <Button
          onClick={() => handleStyleChange('satellite')}
          size="sm"
          variant={mapStyle === 'satellite' ? 'default' : 'outline'}
          className="shadow-lg"
        >
          <Satellite className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Satellite</span>
        </Button>
        <Button
          onClick={() => handleStyleChange('hybrid')}
          size="sm"
          variant={mapStyle === 'hybrid' ? 'default' : 'outline'}
          className="shadow-lg"
        >
          <Layers className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Hybride</span>
        </Button>
      </div>

      {properties.filter(p => p.latitude === null || p.longitude === null).length > 0 && (
        <Card className="absolute bottom-4 left-4 right-4 p-3 z-10 bg-background/95 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {properties.filter(p => p.latitude === null || p.longitude === null).length} bien(s) sans géolocalisation
          </p>
        </Card>
      )}
    </div>
  );
};

export default PropertyMap;
