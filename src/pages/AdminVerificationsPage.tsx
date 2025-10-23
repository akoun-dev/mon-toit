import { MainLayout } from '@/components/layout/MainLayout';
import AdminVerificationQueue from '@/components/admin/AdminVerificationQueue';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';

const AdminVerificationsPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold mb-4">Vérifications ANSUT</h1>
        <AdminVerificationQueue />
      </div>
    </MainLayout>
  );
};

export default AdminVerificationsPage;

