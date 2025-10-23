import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyAlertsMonitor } from '@/components/admin/PropertyAlertsMonitor';

const AdminAlertsPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Alertes Propriétés</h1>
        <Card>
          <CardHeader>
            <CardTitle>Suivi des alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyAlertsMonitor />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminAlertsPage;

