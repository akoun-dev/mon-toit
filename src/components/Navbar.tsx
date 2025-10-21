import { Button } from "@/components/ui/button";
import { User, LogOut, LayoutDashboard, ShieldCheck, Shield, FileText, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
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
import monToitLogo from "@/assets/logo/mon-toit-logo.png";
import NotificationBell from "@/components/NotificationBell";
import CertificationNotificationBadge from "@/components/admin/CertificationNotificationBadge";
import { RoleBadge } from "@/components/navigation/RoleBadge";
import { CertificationBadge } from "@/components/shared/CertificationBadge";

interface NavbarProps {
  showSidebarTrigger?: boolean;
}

const Navbar = ({ showSidebarTrigger = false }: NavbarProps) => {
  const { user, profile, signOut } = useAuth();
  const { canAccessAdminDashboard } = usePermissions();

  return (<>
    <nav
      aria-label="Navigation principale"
      className="fixed top-0 left-0 right-0 z-30 bg-background/98 backdrop-blur-md border-b border-border shadow-sm"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo avec Sidebar Trigger */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
            <picture>
              <img
                src={monToitLogo}
                alt="Mon Toit - Plateforme Immobilière Certifiée ANSUT"
                className="h-10 sm:h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-smooth"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="64"
                height="64"
              />
            </picture>
            </Link>
          </div>

          {/* Navigation Links - Simplified to 3 core items */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/explorer" 
              className="text-sm font-medium text-foreground/80 hover:text-primary hover:underline decoration-2 underline-offset-4 transition-all duration-150"
            >
              Explorer
            </Link>
            <Link 
              to="/publier" 
              className="text-sm font-medium text-foreground/80 hover:text-primary hover:underline decoration-2 underline-offset-4 transition-all duration-150"
            >
              Publier
            </Link>
            <Link
              to="/guide"
              className="text-sm font-medium text-foreground/80 hover:text-primary hover:underline decoration-2 underline-offset-4 transition-all duration-150"
            >
              Guide
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Allège le header en mobile */}
                <div className="hidden md:block">
                  <RoleBadge />
                </div>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="Ouvrir le menu utilisateur" variant="ghost" size="icon" className="rounded-full">
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
                        {(profile?.oneci_verified || profile?.cnam_verified) && (
                          <CertificationBadge variant="compact" className="mt-1" />
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
                              <span>Certifications ANSUT</span>
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
                className="font-semibold h-10 md:h-9"
                asChild
              >
                <Link to="/auth" aria-label="Se connecter">
                  <span>Se connecter</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
    {/* Barre de couleurs identité */}
    <div className="fixed top-12 md:top-14 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary z-20" />
  </>);
};

export default Navbar;
