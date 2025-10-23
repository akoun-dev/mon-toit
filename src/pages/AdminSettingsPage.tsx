import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminIntegrations from '@/components/admin/AdminIntegrations';
import { ProcessingConfigPanel } from '@/components/admin/ProcessingConfigPanel';
import { EnhancedMfaSecurityMonitor } from '@/components/admin/EnhancedMfaSecurityMonitor';

const AdminSettingsPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Paramètres système</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Intégrations</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminIntegrations />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traitement automatique</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessingConfigPanel />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Surveillance MFA</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedMfaSecurityMonitor />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminSettingsPage;

