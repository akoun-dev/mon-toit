import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CompactSearchHero } from "@/components/CompactSearchHero";
import { PropertyGrid } from "@/components/PropertyGrid";
import OnboardingModal from "@/components/OnboardingModal";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Mon Toit - Location Immobilière Certifiée ANSUT en Côte d'Ivoire</title>
        <meta 
          name="description" 
          content="Trouvez votre logement idéal en Côte d'Ivoire. Baux certifiés ANSUT, dossiers vérifiés, signature électronique. Plus de 3,500 logements à Abidjan, Yopougon, Cocody." 
        />
        <link rel="canonical" href="https://montoit.ci" />
      </Helmet>

      <header role="banner">
        <Navbar />
      </header>
      
      <main role="main" className="flex-1 pt-16">
        {/* Compact Search Hero - 180px */}
        <CompactSearchHero />
        
        {/* Main Property Grid - Dynamic height */}
        <PropertyGrid
          limit={16}
          showFilters={true}
        />
      </main>
      
      <footer role="contentinfo">
        <Footer />
      </footer>

      <OnboardingModal />
    </div>
  );
};

export default Index;
