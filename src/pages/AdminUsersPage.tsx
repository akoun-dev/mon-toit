import { MainLayout } from '@/components/layout/MainLayout';
import AdminUsers from '@/components/admin/AdminUsers';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';

const AdminUsersPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>
        <AdminUsers />
      </div>
    </MainLayout>
  );
};

export default AdminUsersPage;

