import { MainLayout } from '@/components/layout/MainLayout';
import AdminProperties from '@/components/admin/AdminProperties';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';

const AdminPropertiesPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold mb-4">Validation des biens</h1>
        <AdminProperties />
      </div>
    </MainLayout>
  );
};

export default AdminPropertiesPage;

