import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import PlatformAnalytics from '@/components/admin/PlatformAnalytics';

const AdminAnalyticsPage = () => {
  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />
        <h1 className="text-2xl font-bold mb-4">Statistiques de la plateforme</h1>
        <PlatformAnalytics />
      </div>
    </MainLayout>
  );
};

export default AdminAnalyticsPage;

