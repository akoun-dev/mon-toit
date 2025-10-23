import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessingConfigPanel } from '@/components/admin/ProcessingConfigPanel';
import { ProcessingAnalytics } from '@/components/admin/ProcessingAnalytics';

const AdminProcessingPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Traitement des files (Queues)</h1>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2">
          <ProcessingConfigPanel />
          <ProcessingAnalytics />
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminProcessingPage;

