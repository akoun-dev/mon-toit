import { MainLayout } from "@/components/layout/MainLayout";
import { ProfessionalHero } from "@/components/ProfessionalHero";
import { MobileHero } from "@/components/MobileHero";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PropertyGrid } from "@/components/PropertyGrid";
import OnboardingModal from "@/components/OnboardingModal";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";

const Index = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Mon Toit - Location Immobilière Certifiée ANSUT en Côte d'Ivoire</title>
        <meta 
          name="description" 
          content="Trouvez votre logement idéal en Côte d'Ivoire. Baux certifiés ANSUT, dossiers vérifiés, signature électronique. Plus de 3,500 logements à Abidjan, Yopougon, Cocody." 
        />
        <link rel="canonical" href="https://montoit.ci" />
      </Helmet>

      <header>
        <h1 className="sr-only">Mon Toit - Location Immobilière Certifiée ANSUT en Côte d'Ivoire</h1>
      </header>

      <main role="main">
        {/* Hero adaptatif : Mobile ou Desktop */}
        {useIsMobile() ? <MobileHero /> : <ProfessionalHero />}
        
        {/* Main Property Grid - Dynamic height */}
        <PropertyGrid
          limit={16}
          showFilters={true}
        />

        {/* Mini CTA - Subtle, non-intrusive */}
        <section
        className="py-3 md:py-4 bg-gradient-to-b from-primary/5 to-background border-t border-primary/10"
        aria-labelledby="cta-heading"
      >
          <div className="container mx-auto px-2 max-w-6xl">
            <div className="text-center">
              <h2
                id="cta-heading"
                className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-foreground"
              >
                Pas encore trouvé votre toit idéal ?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                Explorez plus de biens ou découvrez pourquoi 10 000+ Ivoiriens nous font confiance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="shadow-md min-w-[200px] bg-orange-500 hover:bg-orange-600 text-white">
                  <Link to="/explorer" className="text-white">
                    <Search className="h-4 w-4 mr-2 text-white" />
                    Explorer plus de biens
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-sm min-w-[200px] border-orange-500 text-orange-600 hover:bg-orange-100">
                  <Link to="/a-propos" className="text-orange-600">
                    <ShieldCheck className="h-4 w-4 mr-2 text-orange-600" />
                    Pourquoi Mon Toit ?
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <OnboardingModal />
    </MainLayout>
  );
};

export default Index;
