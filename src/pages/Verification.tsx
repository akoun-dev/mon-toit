import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CNIBForm from '@/components/verification/CNIBForm';
import VerificationStatus from '@/components/verification/VerificationStatus';
import { Shield } from 'lucide-react';

const Verification = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <DynamicBreadcrumb />
          
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-secondary" />
              <h1 className="text-3xl font-bold">Vérification d'Identité</h1>
            </div>
            <p className="text-muted-foreground">
              Complétez votre vérification CNIB avec reconnaissance faciale pour augmenter votre crédibilité
            </p>
          </div>

          <VerificationStatus />

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Vérification CNIB avec Reconnaissance Faciale</CardTitle>
                <CardDescription>
                  Uploadez votre CNIB et complétez la vérification faciale sécurisée avec NeoFace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CNIBForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default Verification;
