import { MapPin, ArrowRight, Cloud, CloudRain, Sun } from "lucide-react";
import { Button } from "./ui/button";
import PropertyMap from "./PropertyMap";
import { Link } from "react-router-dom";
import { useWeather } from "@/hooks/useWeather";
import { Badge } from "./ui/badge";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/services/propertyService";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * ExploreMap component displays an interactive map with featured properties
 * and current weather information for Abidjan
 */
const ExploreMap = () => {
  const { weather } = useWeather();

  // Fetch real properties from database
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      console.log('🗺️ ExploreMap - Fetching properties from propertyService.fetchAll()');
      const data = await propertyService.fetchAll();
      console.log('🗺️ ExploreMap - Raw data from fetchAll():', {
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
  const mapProperties = properties.filter(property =>
    property.latitude &&
    property.longitude &&
    !isNaN(property.latitude) &&
    !isNaN(property.longitude)
  );

  console.log('🗺️ ExploreMap - Properties with valid coordinates:', {
    total: properties.length,
    withValidCoords: mapProperties.length,
    filtered: mapProperties.map(p => ({
      id: p.id,
      title: p.title,
      coordinates: `${p.latitude}, ${p.longitude}`
    }))
  });

  /**
   * Navigate to property detail page when marker is clicked
   */
  const handlePropertyClick = (propertyId: string) => {
    window.location.href = `/property/${propertyId}`;
  };

  /**
   * Generate contextual weather message based on current conditions
   */
  const getWeatherMessage = () => {
    if (weather.description.toLowerCase().includes('pluie')) {
      return 'Pensez à votre parapluie';
    } else if (weather.description.toLowerCase().includes('nuage')) {
      return 'Bonne journée pour chercher';
    } else {
      return 'Idéal pour visiter';
    }
  };

  const WeatherIcon = weather.description.toLowerCase().includes('pluie')
    ? CloudRain
    : weather.description.toLowerCase().includes('nuage')
    ? Cloud
    : Sun;

  return (
    <section className="relative py-12">
      <div className="container mx-auto px-2 max-w-7xl relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Exploration interactive
            </span>
          </div>
          
          <h2 className="text-h2 mb-4">
            Découvrez les biens par <span className="text-primary">quartier</span>
          </h2>
          
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Explorez la carte interactive d'Abidjan et trouvez votre futur logement dans le quartier de vos rêves
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-elevated border border-border/50 bg-background relative">
          {/* Weather Badge */}
          <Badge className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-sm border border-border/50 shadow-md flex items-center gap-2 text-sm px-3 py-2">
            <WeatherIcon className="h-4 w-4 text-warning" />
            <span>{weather.temperature}°C à Abidjan - {getWeatherMessage()}</span>
          </Badge>

          <div className="h-[60vh] md:h-[700px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : error ? (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erreur lors du chargement des propriétés sur la carte
                </AlertDescription>
              </Alert>
            ) : mapProperties.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aucune propriété avec coordonnées géographiques disponible
                  </p>
                </div>
              </div>
            ) : (
              <PropertyMap
                properties={mapProperties}
                onPropertyClick={handlePropertyClick}
                showLocationButton={true}
              />
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg" className="group">
            <Link to="/explorer">
              Voir toutes les annonces
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ExploreMap;
