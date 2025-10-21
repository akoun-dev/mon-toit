import { lazy, Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { getIllustrationPath } from "@/lib/utils";
import { HeroHeader } from "@/components/shared/HeroHeader";
import { Map } from "lucide-react";

// Lazy load des composants lourds
const ExploreMap = lazy(() => import("@/components/ExploreMap"));
const FeaturedProperties = lazy(() => import("@/components/FeaturedProperties"));

const Explorer = () => {
  return (
    <MainLayout>
      <div className="content-left py-2 md:py-4">
        <div className="w-full">
          <HeroHeader 
            badgeLabel="Exploration interactive" 
            badgeIcon={Map}
            title={<>Explorez les biens <span className="text-gradient-primary">disponibles</span></>} 
            description={"Découvrez tous nos biens immobiliers certifiés à travers la Côte d'Ivoire"}
          />

          {/* Bannière quartier */}
          <section className="mb-3 md:mb-4">
            <div className="relative h-36 md:h-44 rounded-lg overflow-hidden shadow-lg">
              <LazyIllustration 
                src={getIllustrationPath('abidjan-neighborhood')!}
                alt="Quartier d'Abidjan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="text-white p-6">
                  <h2 className="text-2xl font-bold">Explorez les quartiers d'Abidjan</h2>
                  <p className="text-sm opacity-90">Cocody, Plateau, Marcory et plus encore</p>
                </div>
              </div>
            </div>
          </section>

          {/* Carte interactive */}
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg mb-6" />}>
            <div className="mb-4 md:mb-6 animate-fade-in">
              <ExploreMap />
            </div>
          </Suspense>

          {/* Tous les biens */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          }>
            <div className="animate-fade-in">
              <FeaturedProperties />
            </div>
          </Suspense>
        </div>
      </div>
    </MainLayout>
  );
};

export default Explorer;
