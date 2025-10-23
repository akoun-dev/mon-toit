import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IllustrationGenerator } from '@/components/admin/IllustrationGenerator';
import { IllustrationManager } from '@/components/admin/IllustrationManager';

const AdminIllustrationsPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Illustrations (IA générative)</h1>

        <Card>
          <CardHeader>
            <CardTitle>Génération d'illustrations</CardTitle>
          </CardHeader>
          <CardContent>
            <IllustrationGenerator />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestion des illustrations</CardTitle>
          </CardHeader>
          <CardContent>
            <IllustrationManager />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminIllustrationsPage;

