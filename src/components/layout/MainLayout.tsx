import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ModernAppSidebar } from "@/components/navigation/ModernAppSidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  if (!showSidebar) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16">
          {children}
        </div>
        <Footer />
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <ModernAppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Navbar />
          <div className="flex-1 pt-16">
            {children}
          </div>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
