import { lazy, Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileCheck, Home, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroHeader } from "@/components/shared/HeroHeader";

// Lazy load des sections
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const Features = lazy(() => import("@/components/Features"));
const Testimonials = lazy(() => import("@/components/Testimonials"));

const CommentCaMarche = () => {
  return (
    <MainLayout>
      <main className="flex-1">
        <div className="content-left py-4">
          <div className="w-full">
            <HeroHeader 
              title={<span className="text-gradient-animated">Comment ça marche ?</span>}
              description={"Découvrez le processus simple et sécurisé de Mon Toit"}
            />

            {/* Processus détaillé */}
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg mb-20" />}>
              <div className="animate-fade-in">
                <HowItWorks />
              </div>
            </Suspense>

            {/* Fonctionnalités clés */}
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg my-20" />}>
              <div className="my-20 animate-fade-in">
                <Features />
              </div>
            </Suspense>

            {/* Témoignages */}
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg my-20" />}>
              <div className="my-20 animate-fade-in">
                <Testimonials />
              </div>
            </Suspense>

            {/* FAQ Section */}
            <section className="py-10">
              <div className="text-center mb-12">
                <h2 className="text-h2 mb-4">
                  Questions <span className="text-gradient-secondary">fréquentes</span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Est-ce vraiment gratuit pour les locataires ?</h3>
                        <p className="text-sm text-muted-foreground">
                          Oui, 100% gratuit ! Créez votre dossier, cherchez un logement et signez votre bail sans frais.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Comment se fait la vérification ANSUT ?</h3>
                        <p className="text-sm text-muted-foreground">
                          Vérification d'identité via ONECI ou CNAM en 48h maximum. Totalement sécurisé et confidentiel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Comment publier une annonce ?</h3>
                        <p className="text-sm text-muted-foreground">
                          Créez un compte propriétaire, ajoutez votre bien en 5 minutes. Commission uniquement à la signature.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Les baux sont-ils légalement valides ?</h3>
                        <p className="text-sm text-muted-foreground">
                          Oui, certifiés ANSUT avec signature électronique légalement reconnue en Côte d'Ivoire.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default CommentCaMarche;
