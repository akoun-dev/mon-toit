import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import KeyStats from "@/components/KeyStats";
import Footer from "@/components/Footer";
import OnboardingModal from "@/components/OnboardingModal";
import CertificationBanner from "@/components/CertificationBanner";
import UnifiedTrustSection from "@/components/UnifiedTrustSection";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load des composants lourds
const FeaturedProperties = lazy(() => import("@/components/FeaturedProperties"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const UnifiedRoleSelection = lazy(() => import("@/components/UnifiedRoleSelection"));

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header role="banner">
        <Navbar />
      </header>
      
      <main role="main" className="flex-1">
        <section aria-labelledby="hero-heading">
          <Hero />
        </section>
        
        <section 
          className="py-8 md:py-12" 
          aria-labelledby="stats-and-featured-heading"
        >
          <h2 id="stats-and-featured-heading" className="sr-only">
            Statistiques et biens en vedette
          </h2>
          
          {/* Métriques de confiance */}
          <div className="mb-6">
            <KeyStats />
          </div>
          
          {/* Certification Banner */}
          <div className="container mx-auto px-4 max-w-7xl mb-6">
            <CertificationBanner />
          </div>
          
          {/* Biens en vedette */}
          <div>
            <Suspense fallback={
              <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            }>
              <FeaturedProperties limit={4} />
            </Suspense>
          </div>
        </section>

        <section aria-labelledby="unified-trust-section">
          <UnifiedTrustSection />
        </section>

        <section aria-labelledby="how-it-works-heading">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <HowItWorks />
          </Suspense>
        </section>
        
        <section aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="sr-only">Prêt à commencer</h2>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <UnifiedRoleSelection />
          </Suspense>
        </section>
      </main>
      
      <footer role="contentinfo">
        <Footer />
      </footer>
      <OnboardingModal />
    </div>
  );
};

export default Index;
