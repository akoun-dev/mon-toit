import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import PropertyMap from '@/components/PropertyMap';
import { MapFilters, MapFiltersState } from '@/components/map/MapFilters';
import { propertyService } from '@/services/propertyService';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Map,
  TrendingUp,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HeroHeader } from '@/components/shared/HeroHeader';

const SmartMapV2 = () => {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<MapFiltersState>({
    minPrice: 0,
    maxPrice: null,
    propertyType: 'all',
    minBedrooms: null,
    maxBedrooms: null,
    amenities: [],
  });

  // Fetch real properties from database like /explorer page
  const { data: allProperties = [], isLoading, error } = useQuery({
    queryKey: ['properties-smartmap'],
    queryFn: async () => {
      console.log('🗺️ SmartMapV2 - Fetching properties from propertyService.fetchAll()');
      const data = await propertyService.fetchAll();
      console.log('🗺️ SmartMapV2 - Raw data from fetchAll():', {
        count: data.length,
        data: data.map(p => ({
          id: p.id,
          title: p.title,
          latitude: p.latitude,
          longitude: p.longitude,
          coordinates: `${p.latitude}, ${p.longitude}`
        }))
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter properties with valid coordinates for map display
  const properties = allProperties.filter(property =>
    property.latitude &&
    property.longitude &&
    !isNaN(property.latitude) &&
    !isNaN(property.longitude)
  );

  console.log('🗺️ SmartMapV2 - Properties with valid coordinates:', {
    total: allProperties.length,
    withValidCoords: properties.length,
    filtered: properties.map(p => ({
      id: p.id,
      title: p.title,
      coordinates: `${p.latitude}, ${p.longitude}`
    }))
  });

  // Apply filters to properties - with no default restrictions
  const filteredProperties = properties.filter(property => {
    // Only apply filters if they are set (not null)
    if (filters.minPrice !== null && filters.minPrice !== undefined && property.monthly_rent < filters.minPrice) {
      console.log(`🗺️ Filtered out ${property.title} - rent ${property.monthly_rent} < minPrice ${filters.minPrice}`);
      return false;
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined && property.monthly_rent > filters.maxPrice) {
      console.log(`🗺️ Filtered out ${property.title} - rent ${property.monthly_rent} > maxPrice ${filters.maxPrice}`);
      return false;
    }
    if (filters.propertyType !== 'all' && filters.propertyType && property.property_type !== filters.propertyType) {
      console.log(`🗺️ Filtered out ${property.title} - type ${property.property_type} != filter ${filters.propertyType}`);
      return false;
    }
    if (filters.minBedrooms !== null && filters.minBedrooms !== undefined && property.bedrooms < filters.minBedrooms) {
      console.log(`🗺️ Filtered out ${property.title} - bedrooms ${property.bedrooms} < minBedrooms ${filters.minBedrooms}`);
      return false;
    }
    if (filters.maxBedrooms !== null && filters.maxBedrooms !== undefined && property.bedrooms > filters.maxBedrooms) {
      console.log(`🗺️ Filtered out ${property.title} - bedrooms ${property.bedrooms} > maxBedrooms ${filters.maxBedrooms}`);
      return false;
    }
    console.log(`🗺️ Kept ${property.title} - passed all filters`);
    return true;
  });

  // Debug log to see what properties are received
  console.log('🗺️ SmartMapV2 - Final filtered properties:', {
    count: filteredProperties.length,
    filters: filters,
    properties: filteredProperties.map(p => ({
      id: p.id,
      title: p.title,
      neighborhood: p.neighborhood,
      coordinates: `${p.latitude}, ${p.longitude}`,
      rent: p.monthly_rent,
      status: p.status
    }))
  });

  // Calculate stats manually
  const stats = {
    totalProperties: filteredProperties.length,
    avgPrice: filteredProperties.length > 0
      ? Math.round(filteredProperties.reduce((sum, p) => sum + p.monthly_rent, 0) / filteredProperties.length)
      : 0,
    minPrice: filteredProperties.length > 0
      ? Math.min(...filteredProperties.map(p => p.monthly_rent))
      : 0,
    maxPrice: filteredProperties.length > 0
      ? Math.max(...filteredProperties.map(p => p.monthly_rent))
      : 0,
    neighborhoods: [...new Set(filteredProperties.map(p => p.neighborhood).filter(Boolean))].length,
    cities: [...new Set(filteredProperties.map(p => p.city))].length,
    propertyTypes: [...new Set(filteredProperties.map(p => p.property_type))].length,
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <MainLayout>
      <main>
        <HeroHeader
          badgeLabel="Carte Intelligente"
          badgeIcon={Map}
          title={<>Explorez <span className="text-gradient-primary">Abidjan</span> intelligemment</>}
          description="Découvrez les biens avec clustering, heatmap, POI, zones de quartiers et analyse complète"
        />

        {/* Map Section */}
        <section className="py-8">
          <div className="content-left">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar with Filters */}
              <motion.div
                className="lg:w-80 flex-shrink-0 space-y-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {isLoading ? (
                  <Card className="p-6">
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-32 w-full" />
                  </Card>
                ) : (
                  <>
                    <MapFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      stats={stats}
                    />

                    {/* Note about simplified map */}
                    <Card className="p-4 bg-gradient-to-br from-muted/10 to-muted/5 border-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Map className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Carte interactive</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Carte simplifiée avec clustering intelligent des propriétés
                      </p>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Statistiques rapides
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quartiers</span>
                          <span className="font-semibold">{stats.neighborhoods}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix min</span>
                          <span className="font-semibold">{(stats.minPrice / 1000).toFixed(0)}k FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix max</span>
                          <span className="font-semibold">{(stats.maxPrice / 1000).toFixed(0)}k FCFA</span>
                        </div>
                        </div>
                    </Card>
                  </>
                )}
              </motion.div>

              {/* Map Container */}
              <motion.div
                className="flex-1 min-h-[600px] lg:min-h-[800px]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="h-full overflow-hidden shadow-2xl border-border/50">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center bg-muted/20">
                      <div className="text-center">
                        <Layers className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                        <p className="text-muted-foreground">Chargement de la carte...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="h-full flex items-center justify-center bg-muted/20">
                      <div className="text-center">
                        <p className="text-destructive mb-2">Erreur de chargement</p>
                        <p className="text-sm text-muted-foreground">
                          Impossible de charger les propriétés
                        </p>
                      </div>
                    </div>
                  ) : (
                    <PropertyMap
                      properties={filteredProperties}
                      onPropertyClick={handlePropertyClick}
                      showLocationButton={true}
                    />
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

  
        {/* Info Section */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-2">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-h2 mb-6">
                Une carte <span className="text-gradient-secondary">vraiment intelligente</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Clustering Intelligent</h3>
                  <p className="text-sm text-muted-foreground">
                    Regroupement automatique des biens pour une meilleure lisibilité
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <Map className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">Navigation Fluide</h3>
                  <p className="text-sm text-muted-foreground">
                    Interface intuitive et zoom progressif sur les propriétés
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Filtres Avancés</h3>
                  <p className="text-sm text-muted-foreground">
                    Recherche précise par prix, type et nombre de chambres
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default SmartMapV2;
