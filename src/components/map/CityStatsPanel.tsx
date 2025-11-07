import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CityStats } from '@/hooks/useCityStats';
import { Building2, TrendingUp, MapPin } from 'lucide-react';

interface CityStatsPanelProps {
  stats: CityStats;
}

const CityStatsPanel = ({ stats }: CityStatsPanelProps) => {
  const { city, propertyCount, avgPrice, minPrice, maxPrice, propertyTypes } = stats;

  return (
    <Card className="bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{city.icon}</span>
          <div>
            <div className="font-bold">{city.name}</div>
            <div className="text-xs text-muted-foreground font-normal">{city.region}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{city.description}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Propriétés</span>
            </div>
            <div className="text-xl font-bold text-foreground">{propertyCount}</div>
          </div>
          
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Prix moyen</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {avgPrice > 0 ? `${avgPrice.toLocaleString('fr-FR')} CFA` : 'N/A'}
            </div>
          </div>
        </div>

        {minPrice > 0 && maxPrice > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Fourchette: {minPrice.toLocaleString('fr-FR')} - {maxPrice.toLocaleString('fr-FR')} CFA/mois
          </div>
        )}

        {Object.keys(propertyTypes).length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-medium text-foreground mb-2">Types de biens</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(propertyTypes).map(([type, count]) => (
                <span
                  key={type}
                  className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CityStatsPanel;
