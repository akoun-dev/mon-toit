import { ReactNode } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { HeroHeader } from "@/components/shared/HeroHeader";
import { FileText } from "lucide-react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

const LegalPage = ({ title, lastUpdated, children }: LegalPageProps) => {
  return (
    <MainLayout>
      <main className="flex-1">
        <HeroHeader 
          badgeLabel="Informations légales"
          badgeIcon={FileText}
          title={<>{title}</>}
          description={`Dernière mise à jour : ${lastUpdated}`}
          containerClassName="content-left"
        />
        <div className="content-left py-8">
          <div className="rich-text max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default LegalPage;
