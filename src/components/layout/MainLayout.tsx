import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { BottomNav } from "@/components/mobile/BottomNav";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <>
      <Navbar showSidebarTrigger={false} />
      <div className="min-h-screen pt-16 pb-20 md:pb-0">
        {children}
      </div>
      <InstitutionalFooter />
      <BottomNav />
    </>
  );
};
