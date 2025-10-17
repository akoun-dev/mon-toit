import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ModernAppSidebar } from "@/components/navigation/ModernAppSidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  
  if (!showSidebar) {
    return (
      <>
        <Navbar showSidebarTrigger={false} />
        <div className="min-h-screen pt-16 pb-20 md:pb-0">
          {children}
        </div>
        <Footer />
        <BottomNav />
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        {!isMobile && <ModernAppSidebar />}
        <SidebarInset className="flex flex-col flex-1">
          <Navbar showSidebarTrigger={true} />
          <div className="flex-1 pt-16 pb-20 md:pb-0 w-full">
            {children}
          </div>
          <Footer />
          <BottomNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
