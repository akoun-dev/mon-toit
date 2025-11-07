import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { User, Home, Building2 } from "lucide-react";

export const RoleBadge = () => {
  const { profile } = useAuth();
  const { t } = useTranslation('common');

  if (!profile?.user_type) return null;

  const roleConfig = {
    locataire: {
      icon: User,
      label: t('roles.tenant'),
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"
    },
    proprietaire: {
      icon: Home,
      label: t('roles.owner'),
      className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
    },
    agence: {
      icon: Building2,
      label: t('roles.agency'),
      className: "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20"
    }
  };

  const config = roleConfig[profile.user_type as keyof typeof roleConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">{config.label}</span>
    </Badge>
  );
};
