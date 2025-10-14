import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import KeyStats from "@/components/KeyStats";
import Footer from "@/components/Footer";
import OnboardingModal from "@/components/OnboardingModal";
import CertificationBanner from "@/components/CertificationBanner";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load des composants lourds
const FeaturedProperties = lazy(() => import("@/components/FeaturedProperties"));
const Features = lazy(() => import("@/components/Features"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
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
        
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Statistiques de la plateforme</h2>
          <KeyStats />
        </section>
        
        {/* Certification Banner */}
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <CertificationBanner />
        </div>
        
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="sr-only">Biens en vedette</h2>
          <Suspense fallback={
            <div className="container mx-auto px-4 py-16">
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
        </section>

        <section aria-labelledby="features-heading">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <Features />
          </Suspense>
        </section>

        <section aria-labelledby="how-it-works-heading">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <HowItWorks />
          </Suspense>
        </section>

        <section aria-labelledby="testimonials-heading">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <Testimonials />
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
