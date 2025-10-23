import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import AdvancedReporting from '@/components/admin/AdvancedReporting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportGenerator } from '@/components/admin/ReportGenerator';

const AdminReportsPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Rapports</h1>

        <Card>
          <CardHeader>
            <CardTitle>Générateur de rapports mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportGenerator />
          </CardContent>
        </Card>

        <AdvancedReporting />
      </div>
    </MainLayout>
  );
};

export default AdminReportsPage;

