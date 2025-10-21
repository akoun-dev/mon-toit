import { MainLayout } from "@/components/layout/MainLayout";
import UnifiedTrustSection from "@/components/UnifiedTrustSection";
import { HeroHeader } from "@/components/shared/HeroHeader";
import { Shield, Building } from "lucide-react";

const AboutPage = () => {
  return (
    <MainLayout>
      <main>
        <HeroHeader
          title="À propos de Mon Toit"
          description="La plateforme immobilière certifiée par l'État ivoirien pour des locations sécurisées"
          badgeLabel="Plateforme Officielle"
          badgeIcon={Shield}
        />
        <UnifiedTrustSection />
      </main>
    </MainLayout>
  );
};

export default AboutPage;
