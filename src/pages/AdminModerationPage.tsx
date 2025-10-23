import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import ReviewModeration from '@/components/admin/ReviewModeration';
import PropertyModerationQueue from '@/components/admin/PropertyModerationQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminModerationPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full space-y-4">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold">Modération du contenu</h1>

        <Card>
          <CardHeader>
            <CardTitle>File de modération des propriétés</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyModerationQueue />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modération des avis utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewModeration />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminModerationPage;

