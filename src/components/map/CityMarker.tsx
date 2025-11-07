import { CityStats } from '@/hooks/useCityStats';

interface CityMarkerProps {
  stats: CityStats;
  onClick: () => void;
}

const CityMarker = ({ stats, onClick }: CityMarkerProps) => {
  const { city, propertyCount, avgPrice } = stats;
  
  return (
    <div 
      className="city-marker cursor-pointer transition-transform hover:scale-110"
      onClick={onClick}
    >
      <div className="bg-background border-2 border-primary rounded-full shadow-lg p-3 min-w-[120px]">
        <div className="text-center">
          <div className="text-2xl mb-1">{city.icon}</div>
          <div className="font-semibold text-sm text-foreground">{city.name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {propertyCount} {propertyCount === 1 ? 'bien' : 'biens'}
          </div>
          {avgPrice > 0 && (
            <div className="text-xs font-medium text-primary mt-1">
              {avgPrice.toLocaleString('fr-FR')} CFA
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityMarker;
