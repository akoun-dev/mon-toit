import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ElectronicSignaturesDashboard } from '@/components/admin/ElectronicSignaturesDashboard';
import { CertificateManager } from '@/components/admin/CertificateManager';

const AdminSignaturesPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Signatures Électroniques</h1>

        <Card>
          <CardHeader>
            <CardTitle>Tableau de bord</CardTitle>
          </CardHeader>
          <CardContent>
            <ElectronicSignaturesDashboard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestion des Certificats</CardTitle>
          </CardHeader>
          <CardContent>
            <CertificateManager />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminSignaturesPage;

