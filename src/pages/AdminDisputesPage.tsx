import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import DisputeManager from '@/components/admin/DisputeManager';

const AdminDisputesPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold mb-4">Gestion des litiges</h1>
        <DisputeManager />
      </div>
    </MainLayout>
  );
};

export default AdminDisputesPage;

