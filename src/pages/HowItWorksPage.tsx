import { MainLayout } from "@/components/layout/MainLayout";
import HowItWorks from "@/components/HowItWorks";
import { DynamicBreadcrumb } from "@/components/navigation/DynamicBreadcrumb";

const HowItWorksPage = () => {
  return (
    <MainLayout>
      <main>
        <div className="container mx-auto px-2 py-4">
          <DynamicBreadcrumb />
        </div>
        <HowItWorks />
      </main>
    </MainLayout>
  );
};

export default HowItWorksPage;
