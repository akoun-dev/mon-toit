import { MainLayout } from "@/components/layout/MainLayout";
import HowItWorks from "@/components/HowItWorks";
import { DynamicBreadcrumb } from "@/components/navigation/DynamicBreadcrumb";

const HowItWorksPage = () => {
  return (
    <MainLayout>
      <main>
        <div className="container mx-auto px-4 py-8">
          <DynamicBreadcrumb />
        </div>
        <HowItWorks />
      </main>
    </MainLayout>
  );
};

export default HowItWorksPage;
