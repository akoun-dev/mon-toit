import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BurkinaNationalMap from '@/components/map/BurkinaNationalMap';
import CityComparison from '@/components/map/CityComparison';
import { useMapProperties } from '@/hooks/useMapProperties';
import { useCityStats } from '@/hooks/useCityStats';
import { BURKINA_CITIES, BurkinaCity } from '@/data/burkinaCities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NationalMap = () => {
  const navigate = useNavigate();
  const { data: properties = [], isLoading } = useMapProperties();
  const cityStats = useCityStats(properties, BURKINA_CITIES);
  const [selectedCity, setSelectedCity] = useState<BurkinaCity | null>(null);

  const totalProperties = properties.length;
  const avgNationalPrice = properties.length > 0
    ? Math.round(properties.reduce((sum, p) => sum + p.monthly_rent, 0) / properties.length)
    : 0;
  const activeCities = cityStats.filter(s => s.propertyCount > 0).length;

  const handleCityClick = (city: BurkinaCity) => {
    setSelectedCity(city);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Carte Nationale du Burkina Faso
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez la distribution des propriétés dans les 8 principales villes du pays
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* National Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistiques Nationales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total propriétés</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalProperties}</div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Prix moyen national</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {avgNationalPrice.toLocaleString('fr-FR')} CFA
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Villes actives</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{activeCities}/8</div>
                </div>
              </CardContent>
            </Card>

            {/* City Comparison */}
            <CityComparison cityStats={cityStats} />

            {/* Selected City Info */}
            {selectedCity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ville sélectionnée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{selectedCity.icon}</span>
                      <div>
                        <div className="font-bold text-foreground">{selectedCity.name}</div>
                        <div className="text-xs text-muted-foreground">{selectedCity.region}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedCity.description}</p>
                    <Button 
                      onClick={() => navigate('/smart-map')}
                      className="w-full"
                      size="sm"
                    >
                      Voir les propriétés
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] lg:h-[800px]">
              <CardContent className="p-0 h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <BurkinaNationalMap
                    cityStats={cityStats}
                    properties={properties}
                    onCityClick={handleCityClick}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NationalMap;
