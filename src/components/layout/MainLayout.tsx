import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ModernAppSidebar } from "@/components/navigation/ModernAppSidebar";
import Navbar from "@/components/Navbar";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  customSidebar?: ReactNode;
}

export const MainLayout = ({ children, showSidebar = true, customSidebar }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const sidebarComponent = customSidebar || <ModernAppSidebar />;
  
  if (!showSidebar) {
    return (
      <>
        <Navbar showSidebarTrigger={false} />
        <div className="min-h-screen pt-[3.25rem] md:pt-[3.75rem] pb-20 md:pb-0 px-2 md:px-2">
          {children}
        </div>
        <InstitutionalFooter />
        <BottomNavigation />
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        {!isMobile && sidebarComponent}
        <SidebarInset className="flex flex-col flex-1">
          <Navbar showSidebarTrigger={true} />
          <div className="flex-1 pt-[3.25rem] md:pt-[3.75rem] pb-20 md:pb-0">
            {children}
          </div>
          <InstitutionalFooter />
          <BottomNavigation />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
