import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyTrend } from '@/hooks/useOwnerLeaseCertification';
import { TrendingUp } from 'lucide-react';

interface CertificationTrendChartProps {
  data: MonthlyTrend[];
}

export const CertificationTrendChart = ({ data }: CertificationTrendChartProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tendances de Certification
        </CardTitle>
        <CardDescription>
          Évolution des statuts de certification sur 12 mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="certified" 
              name="Certifiés" 
              stackId="a" 
              fill="hsl(var(--success))" 
            />
            <Bar 
              dataKey="pending" 
              name="En attente" 
              stackId="a" 
              fill="hsl(var(--warning))" 
            />
            <Bar 
              dataKey="rejected" 
              name="Rejetés" 
              stackId="a" 
              fill="hsl(var(--destructive))" 
            />
            <Bar 
              dataKey="not_requested" 
              name="Non demandés" 
              stackId="a" 
              fill="hsl(var(--muted))" 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
