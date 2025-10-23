import { FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

const AdminElectronicSignaturesPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-purple-700" />
          <h1 className="text-3xl font-bold">Signatures Électroniques</h1>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Gestion des signatures électroniques</h2>
          <p className="text-muted-foreground">
            Interface d'administration pour le système de signatures électroniques.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminElectronicSignaturesPage;