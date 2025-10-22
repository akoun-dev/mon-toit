import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Shield,
  CheckCircle,
  Lock,
  FileText,
  Clock,
  BarChart3,
  AlertTriangle,
  Flag,
  FileBarChart,
  PenTool,
  Home,
  Users,
  Settings,
  Bell,
  Image,
  Activity,
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges: {
    certifications: number;
    disputes: number;
    properties: number;
    overdueApplications: number;
  };
}

export const AdminSidebar = ({ activeTab, onTabChange, badges }: AdminSidebarProps) => {
  const menuGroups = [
    {
      label: 'Principal',
      items: [
        { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Sécurité',
      items: [
        { id: 'certifications', label: 'Certifications', icon: Shield, badge: badges.certifications },
        { id: 'verifications', label: 'Vérifications', icon: CheckCircle },
        { id: 'mfa', label: 'Sécurité 2FA', icon: Lock },
        { id: 'security-dashboard', label: 'Dashboard Sécurité', icon: Activity },
        { id: 'audit', label: 'Audit', icon: FileText },
        { id: 'security', label: 'Accès sensibles', icon: Lock },
      ]
    },
    {
      label: 'Gestion',
      items: [
        { id: 'properties', label: 'Biens', icon: Home, badge: badges.properties },
        { id: 'users', label: 'Utilisateurs', icon: Users },
        { id: 'leases', label: 'Baux', icon: FileText },
      ]
    },
    {
      label: 'Outils',
      items: [
        { id: 'processing', label: 'Traitement', icon: Clock, badge: badges.overdueApplications },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'alerts', label: 'Alertes Propriétés', icon: Bell },
        { id: 'disputes', label: 'Litiges', icon: AlertTriangle, badge: badges.disputes },
        { id: 'moderation', label: 'Modération', icon: Flag },
        { id: 'reporting', label: 'Rapports', icon: FileBarChart },
        { id: 'electronic-signatures', label: 'Signatures Élec.', icon: PenTool },
        { id: 'illustrations', label: 'Illustrations', icon: Image },
      ]
    }
  ];

  return (
    <Sidebar className="border-r">
      <SidebarContent className="hidden sm:block">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={activeTab === item.id}
                      className="w-full text-sm"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                      <span className="md:hidden truncate max-w-[80px]">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1 py-0 h-4">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Mobile Navigation */}
      <SidebarContent className="sm:hidden">
        <div className="grid grid-cols-3 gap-2 p-2">
          {menuGroups.flatMap(group => group.items).map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-colors ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <item.icon className="h-4 w-4 mb-1" />
              <span className="truncate max-w-[60px] text-center">
                {item.label.split(' ')[0]}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 min-w-[16px]">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};