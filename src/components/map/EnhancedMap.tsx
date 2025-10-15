import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapProperty } from '@/hooks/useMapProperties';
import { Button } from '@/components/ui/button';
import { Locate, Map, Satellite, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import { logger } from '@/services/logger';
import { motion } from 'framer-motion';
import { ABIDJAN_POI, POI_CATEGORIES } from '@/data/abidjanPOI';
import { ABIDJAN_NEIGHBORHOODS, getPriceColor } from '@/data/abidjanNeighborhoods';
import type { POIType } from './POILayer';
import type { Neighborhood } from '@/data/abidjanNeighborhoods';

interface EnhancedMapProps {
  properties: MapProperty[];
  onPropertyClick?: (propertyId: string) => void;
  showHeatmap?: boolean;
  showClusters?: boolean;
  activePOILayers?: POIType[];
  showNeighborhoods?: boolean;
  onNeighborhoodClick?: (neighborhood: Neighborhood) => void;
}

const getStoredMapboxToken = () => {
  // Priorité 1: Variable d'environnement (supporte plusieurs noms)
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN || 
                   import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN ||
                   import.meta.env.MAPBOX_PUBLIC_TOKEN;
  if (envToken) return envToken;
  
  // Priorité 2: localStorage (fallback)
  return localStorage.getItem('mapbox_token') || '';
};

type MapStyle = 'streets' | 'satellite' | 'hybrid';

const MAP_STYLES: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  hybrid: 'mapbox://styles/mapbox/satellite-streets-v12',
};

export const EnhancedMap = ({ 
  properties, 
  onPropertyClick,
  showHeatmap = false,
  showClusters = true,
  activePOILayers = [],
  showNeighborhoods = false,
  onNeighborhoodClick
}: EnhancedMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const poiMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const [mapboxToken] = useState(getStoredMapboxToken());
  const clusterIndex = useRef<Supercluster | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      if (!mapboxToken) {
        logger.warn('Mapbox token not configured');
        return;
      }

      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle],
        center: [-4.0305, 5.3599], // Abidjan
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        setMapReady(true);
        logger.info('Map loaded successfully');
      });

      // Update clusters on zoom/pan
      map.current.on('moveend', () => {
        if (showClusters) {
          updateClusters();
        }
      });

    } catch (error) {
      logger.logError(error, { context: 'Map initialization' });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapStyle, mapboxToken]);

  // Initialize clustering
  useEffect(() => {
    if (!showClusters || properties.length === 0) return;

    const points = properties.map(property => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        propertyId: property.id,
        price: property.monthly_rent,
        title: property.title,
        city: property.city,
        image: property.main_image,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [property.longitude, property.latitude],
      },
    }));

    clusterIndex.current = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 3,
    });

    clusterIndex.current.load(points);
    updateClusters();
  }, [properties, showClusters, mapReady]);

  // Update clusters
  const updateClusters = () => {
    if (!map.current || !clusterIndex.current || !mapReady) return;

    const bounds = map.current.getBounds();
    const zoom = Math.floor(map.current.getZoom());

    const clusters = clusterIndex.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add cluster/point markers
    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties.cluster;

      if (isCluster) {
        const count = cluster.properties.point_count;
        const clusterId = cluster.properties.cluster_id;
        
        const leaves = clusterIndex.current!.getLeaves(clusterId, Infinity);
        const avgPrice = leaves.reduce((sum, leaf) => sum + leaf.properties.price, 0) / leaves.length;

        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.innerHTML = `
          <div class="relative group cursor-pointer">
            <div class="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div class="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary border-3 border-white shadow-xl flex flex-col items-center justify-center text-white group-hover:scale-110 transition-transform">
              <span class="text-lg font-bold">${count}</span>
              <span class="text-xs opacity-90">${(avgPrice / 1000).toFixed(0)}k</span>
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          const expansionZoom = clusterIndex.current!.getClusterExpansionZoom(clusterId);
          map.current!.easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markers.current.push(marker);
      } else {
        const property = cluster.properties;
        const el = document.createElement('div');
        el.className = 'property-marker';
        el.innerHTML = `
          <div class="relative group cursor-pointer">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
            <div class="relative w-12 h-12 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform">
              ${(property.price / 1000).toFixed(0)}k
            </div>
          </div>
        `;

        const popupHTML = `
          <div class="min-w-[220px]">
            ${property.image ? `
              <img 
                src="${property.image}" 
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
              <p class="text-base font-bold text-primary">${property.price.toLocaleString()} FCFA<span class="text-xs font-normal">/mois</span></p>
              <button class="mt-3 w-full px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 transition-colors">
                Voir les détails
              </button>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'property-popup',
        }).setHTML(popupHTML);

        el.addEventListener('click', () => {
          if (onPropertyClick) {
            onPropertyClick(property.propertyId);
          }
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      }
    });
  };

  // Add heatmap layer
  useEffect(() => {
    if (!map.current || !mapReady || !showHeatmap) return;

    const sourceId = 'properties-heatmap';
    const layerId = 'price-heatmap';

    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: properties.map(p => ({
          type: 'Feature',
          properties: { price: p.monthly_rent },
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude],
          },
        })),
      },
    });

    map.current.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'price'], 0, 0, 2000000, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
        'heatmap-opacity': 0.6,
      },
    });
  }, [properties, showHeatmap, mapReady]);

  // Add POI markers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing POI markers
    poiMarkers.current.forEach(marker => marker.remove());
    poiMarkers.current = [];

    // Filter POI by active layers
    const filteredPOI = ABIDJAN_POI.filter(poi => activePOILayers.includes(poi.type));

    filteredPOI.forEach(poi => {
      const category = POI_CATEGORIES[poi.type];
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="poi-marker cursor-pointer">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform" style="background-color: ${category.color}">
            <span class="text-lg">${category.icon}</span>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="p-2">
            <p class="font-semibold text-sm">${poi.name}</p>
            <p class="text-xs text-muted-foreground">${category.label}</p>
            ${poi.description ? `<p class="text-xs mt-1">${poi.description}</p>` : ''}
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      poiMarkers.current.push(marker);
    });
  }, [activePOILayers, mapReady]);

  // Add neighborhood zones
  useEffect(() => {
    if (!map.current || !mapReady || !showNeighborhoods) return;

    ABIDJAN_NEIGHBORHOODS.forEach((neighborhood, index) => {
      const sourceId = `neighborhood-${neighborhood.id}`;
      const layerId = `neighborhood-layer-${neighborhood.id}`;
      const labelLayerId = `neighborhood-label-${neighborhood.id}`;

      // Remove existing layers
      if (map.current!.getLayer(labelLayerId)) map.current!.removeLayer(labelLayerId);
      if (map.current!.getLayer(layerId)) map.current!.removeLayer(layerId);
      if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);

      // Create polygon from bounds
      const polygon = {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [neighborhood.bounds.west, neighborhood.bounds.north],
            [neighborhood.bounds.east, neighborhood.bounds.north],
            [neighborhood.bounds.east, neighborhood.bounds.south],
            [neighborhood.bounds.west, neighborhood.bounds.south],
            [neighborhood.bounds.west, neighborhood.bounds.north],
          ]],
        },
        properties: {
          name: neighborhood.name,
          avgPrice: neighborhood.priceRange.average,
        },
      };

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: polygon,
      });

      const color = getPriceColor(neighborhood.priceRange.average);

      // Add fill layer
      map.current!.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.15,
        },
      });

      // Add border
      map.current!.addLayer({
        id: `${layerId}-outline`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 2,
          'line-opacity': 0.5,
        },
      });

      // Add label
      map.current!.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': neighborhood.name,
          'text-size': 14,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': color,
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      });

      // Click handler
      map.current!.on('click', layerId, () => {
        if (onNeighborhoodClick) {
          onNeighborhoodClick(neighborhood);
        }
      });

      // Cursor pointer
      map.current!.on('mouseenter', layerId, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });
  }, [showNeighborhoods, mapReady, onNeighborhoodClick]);

  const handleLocate = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current!.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
          });
        },
        (error) => logger.logError(error, { context: 'Geolocation' })
      );
    }
  };

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Mapbox token non configuré</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full rounded-lg" />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button size="icon" variant="secondary" className="shadow-lg bg-background/90 backdrop-blur-sm" onClick={handleLocate}>
            <Locate className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button size="icon" variant="secondary" className="shadow-lg bg-background/90 backdrop-blur-sm" onClick={() => map.current?.zoomIn()}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button size="icon" variant="secondary" className="shadow-lg bg-background/90 backdrop-blur-sm" onClick={() => map.current?.zoomOut()}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Style Switcher */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {(['streets', 'satellite', 'hybrid'] as MapStyle[]).map((style) => (
          <motion.div key={style} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant={mapStyle === style ? 'default' : 'secondary'}
              className="shadow-lg bg-background/90 backdrop-blur-sm"
              onClick={() => setMapStyle(style)}
            >
              {style === 'streets' && <Map className="h-4 w-4 mr-1" />}
              {style === 'satellite' && <Satellite className="h-4 w-4 mr-1" />}
              {style === 'hybrid' && <Layers className="h-4 w-4 mr-1" />}
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

