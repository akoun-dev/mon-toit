import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import Navbar from "@/components/Navbar";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { useIsMobile } from "@/hooks/useIsMobile";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges?: {
    certifications: number;
    disputes: number;
    properties: number;
    overdueApplications: number;
  };
}

export const AdminLayout = ({ 
  children, 
  activeTab, 
  onTabChange,
  badges = {
    certifications: 0,
    disputes: 0,
    properties: 0,
    overdueApplications: 0,
  }
}: AdminLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        {!isMobile && (
          <AdminSidebar 
            activeTab={activeTab}
            onTabChange={onTabChange}
            badges={badges}
          />
        )}
        <SidebarInset className="flex flex-col flex-1">
          <Navbar showSidebarTrigger={true} />
          <div className="flex-1 pt-16 pb-20 md:pb-0 w-full">
            {children}
          </div>
          <InstitutionalFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
