import { AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

const AdminDisputesPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-700" />
          <h1 className="text-3xl font-bold">Litiges</h1>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Gestion des litiges</h2>
          <p className="text-muted-foreground">
            Interface de médiation et de résolution des litiges entre utilisateurs.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDisputesPage;