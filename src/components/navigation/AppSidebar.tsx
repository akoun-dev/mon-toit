import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Home,
  Search,
  Heart,
  MessageSquare,
  User,
  Building2,
  FileText,
  CreditCard,
  Wrench,
  ShieldCheck,
  MapPin,
  Map,
  PlusCircle,
  LayoutDashboard,
  Shield,
  HelpCircle,
  Settings,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import monToitLogo from "@/assets/logo/mon-toit-logo.png";

export function AppSidebar() {
  const { profile } = useAuth();
  const { canAccessAdminDashboard } = usePermissions();
  const location = useLocation();
  const { open } = useSidebar();

  const isActive = (path: string) => location.pathname === path;

  // Navigation commune
  const commonLinks = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/explorer", icon: Search, label: "Recherche" },
    { to: "/carte-intelligente", icon: Map, label: "Carte Intelligente" },
  ];

  // Navigation pour utilisateurs connectés
  const userLinks = profile ? [
    { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/favoris", icon: Heart, label: "Mes Favoris" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
  ] : [];

  // Navigation pour locataires
  const tenantLinks = profile?.user_type === "locataire" ? [
    { to: "/candidatures", icon: FileText, label: "Mes Candidatures" },
    { to: "/baux", icon: FileText, label: "Mes Baux" },
    { to: "/payments", icon: CreditCard, label: "Paiements" },
  ] : [];

  // Navigation pour propriétaires et agences
  const ownerLinks = (profile?.user_type === "proprietaire" || profile?.user_type === "agence") ? [
    { to: "/mes-biens", icon: Building2, label: "Mes Biens" },
    { to: "/publier", icon: PlusCircle, label: "Publier un bien" },
    { to: "/my-mandates", icon: FileText, label: "Mes Mandats" },
  ] : [];

  // Navigation pour tiers de confiance
  const tiersLinks = profile?.user_type === "tiers_de_confiance" ? [
    { to: "/tiers-dashboard", icon: ShieldCheck, label: "Dashboard Tiers" },
    { to: "/tiers-verifications", icon: FileText, label: "Vérifications" },
    { to: "/tiers-documents", icon: LayoutDashboard, label: "Documents" },
    { to: "/tiers-rapports", icon: FileText, label: "Rapports" },
  ] : [];

  // Navigation admin
  const adminLinks = canAccessAdminDashboard ? [
    { to: "/admin", icon: Shield, label: "🛡️ Admin Dashboard" },
    { to: "/admin/certifications", icon: ShieldCheck, label: "📜 Certifications" },
  ] : [];

  // Autres liens
  const otherLinks = [
    { to: "/guide", icon: HelpCircle, label: "Aide & Guide" },
    { to: "/verification", icon: ShieldCheck, label: "Vérification ANSUT" },
  ];

  const settingsLinks = profile ? [
    { to: "/profil", icon: Settings, label: "Mon Profil" },
  ] : [];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-3 py-2">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={monToitLogo} 
            alt="Mon Toit" 
            className="h-8 w-8"
          />
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">Mon Toit</span>
              <span className="text-xs text-muted-foreground">Certifié ANSUT</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonLinks.map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton asChild isActive={isActive(link.to)}>
                    <Link to={link.to}>
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mon Espace (si connecté) */}
        {userLinks.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Mon Espace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userLinks.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={isActive(link.to)}>
                        <Link to={link.to}>
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Section Locataire */}
        {tenantLinks.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Locataire</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tenantLinks.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={isActive(link.to)}>
                        <Link to={link.to}>
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Section Propriétaire */}
        {ownerLinks.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Gestion</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ownerLinks.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={isActive(link.to)}>
                        <Link to={link.to}>
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Section Tiers de Confiance */}
        {tiersLinks.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Tiers de Confiance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tiersLinks.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={isActive(link.to)}>
                        <Link to={link.to}>
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Section Admin */}
        {adminLinks.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>🛡️ Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminLinks.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={isActive(link.to)}>
                        <Link to={link.to}>
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Autres */}
        <Separator className="my-2" />
        <SidebarGroup>
          <SidebarGroupLabel>Autres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherLinks.map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton asChild isActive={isActive(link.to)}>
                    <Link to={link.to}>
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Paramètres */}
        {settingsLinks.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsLinks.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={isActive(link.to)}>
                        <Link to={link.to}>
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2 space-y-2">
          {canAccessAdminDashboard && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-50 dark:bg-red-950 rounded-md">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300 hidden sm:inline">
                Admin
              </span>
              <span className="text-xs font-medium text-red-700 dark:text-red-300 sm:hidden">
                A
              </span>
            </div>
          )}
          <SidebarTrigger className="w-full" />
        </SidebarFooter>
    </Sidebar>
  );
}
