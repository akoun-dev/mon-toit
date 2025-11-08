import { Button } from "@/components/ui/button";
import { User, LogOut, LayoutDashboard, ShieldCheck, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MegaMenuExplorer } from "@/components/navigation/MegaMenuExplorer";
import { MegaMenuPublier } from "@/components/navigation/MegaMenuPublier";
import { MegaMenuAide } from "@/components/navigation/MegaMenuAide";
import { MegaMenuAPropos } from "@/components/navigation/MegaMenuAPropos";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import doniaLogo from "@/assets/logo/donia-logo.png";
import NotificationBell from "@/components/NotificationBell";
import CertificationNotificationBadge from "@/components/admin/CertificationNotificationBadge";
import { VerificationProgress } from "@/components/navigation/VerificationProgress";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { RoleSwitcherCompact } from "@/components/navigation/RoleSwitcherCompact";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleBadge } from "@/components/navigation/RoleBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface NavbarProps {
  showSidebarTrigger?: boolean;
}

const Navbar = ({ showSidebarTrigger = false }: NavbarProps) => {
  const { user, profile, signOut } = useAuth();
  const { canAccessAdminDashboard } = usePermissions();
  const isMobile = useIsMobile();

  return (<>
    <nav
      aria-label="Navigation principale"
      className={`fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-b border-border shadow-sm ${isMobile && user ? 'mb-16' : ''}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo avec Sidebar Trigger */}
          <div className="flex items-center gap-3">
            {showSidebarTrigger && <SidebarTrigger className="md:hidden" />}
            
            <Link to="/" className="flex items-center gap-2 group" title="DONIA - Plateforme sécurisée">
              <picture>
                <img
                  src={doniaLogo}
                  alt="DONIA"
                  className="h-10 sm:h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-smooth"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width="64"
                  height="64"
                />
              </picture>
              {/* Badge discret uniquement sur desktop */}
              <Badge variant="outline" className="hidden lg:flex items-center gap-1 border-primary/30 text-primary text-xs px-2 py-0.5">
                <ShieldCheck className="h-3 w-3" />
                Sécurisée
              </Badge>
            </Link>
          </div>

          {/* Mega Menu Navigation */}
          <div className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <MegaMenuExplorer />
                <MegaMenuPublier />
                <MegaMenuAide />
                <MegaMenuAPropos />
                <Link 
                  to="/carte-nationale"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Carte Nationale
                </Link>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                <RoleBadge />
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-background border border-border shadow-lg">
                    <DropdownMenuLabel className="pb-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {(profile?.cnib_verified || profile?.cnam_verified) && (
                          <Badge variant="outline" className="w-fit mt-1 text-xs border-primary text-primary">
                            ✓ Identité vérifiée
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer flex items-center">
                          <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                          <span>Tableau de bord</span>
                        </Link>
                      </DropdownMenuItem>
                      {profile?.user_type === 'locataire' && (
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/tenant" className="cursor-pointer flex items-center">
                            <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                            <span>Dashboard Locataire</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {profile?.user_type === 'agence' && (
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/agence" className="cursor-pointer flex items-center">
                            <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                            <span>Dashboard Agence</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(profile?.user_type === 'proprietaire' || profile?.user_type === 'agence') && (
                        <DropdownMenuItem asChild>
                          <Link to="/my-mandates" className="cursor-pointer flex items-center">
                            <FileText className="mr-3 h-4 w-4 text-primary" />
                            <span>Mes Mandats</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/profil" className="cursor-pointer flex items-center">
                          <User className="mr-3 h-4 w-4 text-primary" />
                          <span>Mon profil</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/verification" className="cursor-pointer flex items-center">
                          <ShieldCheck className="mr-3 h-4 w-4 text-primary" />
                          <span>Vérification</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    {canAccessAdminDashboard && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="cursor-pointer flex items-center">
                              <Shield className="mr-3 h-4 w-4 text-primary" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                          <Link to="/admin/certifications" className="cursor-pointer flex items-center">
                              <Shield className="mr-3 h-4 w-4 text-primary" />
                              <span>Vérification des baux</span>
                              <CertificationNotificationBadge />
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                size="sm" 
                variant="default"
                className="font-semibold" 
                asChild
              >
                <Link to="/auth">
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Connexion</span>
                </Link>
              </Button>
            )}
            
            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
    {/* Barre de couleurs identité */}
    <div className="fixed top-14 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary z-40" />
  </>);
};

export default Navbar;
