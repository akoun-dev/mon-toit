import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CityStats } from '@/hooks/useCityStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CityComparisonProps {
  cityStats: CityStats[];
}

const CityComparison = ({ cityStats }: CityComparisonProps) => {
  const chartData = cityStats
    .filter(stat => stat.propertyCount > 0)
    .map(stat => ({
      name: stat.city.name,
      'Propriétés': stat.propertyCount,
      'Prix moyen (milliers CFA)': Math.round(stat.avgPrice / 1000)
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparaison des villes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Propriétés" fill="hsl(var(--primary))" />
            <Bar dataKey="Prix moyen (milliers CFA)" fill="hsl(var(--secondary))" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-foreground">Classement par nombre de biens</div>
          {cityStats.slice(0, 5).map((stat, index) => (
            <div key={stat.city.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-6">{index + 1}.</span>
                <span className="text-lg">{stat.city.icon}</span>
                <span className="text-foreground">{stat.city.name}</span>
              </div>
              <span className="font-medium text-primary">
                {stat.propertyCount} {stat.propertyCount === 1 ? 'bien' : 'biens'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CityComparison;
