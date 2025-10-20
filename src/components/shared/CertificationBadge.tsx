import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificationBadgeProps {
  variant?: "default" | "compact" | "minimal";
  className?: string;
  showIcon?: boolean;
}

export const CertificationBadge = ({ 
  variant = "default", 
  className,
  showIcon = true 
}: CertificationBadgeProps) => {
  const baseClasses = "border-primary text-primary font-medium";
  
  const variants = {
    default: `${baseClasses} px-2 py-1 text-xs`,
    compact: `${baseClasses} px-1.5 py-0.5 text-xs`,
    minimal: `${baseClasses} px-1 py-0.5 text-xs`
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(variants[variant], className)}
    >
      {showIcon && <ShieldCheck className="h-3 w-3 mr-1" />}
      Certifié ANSUT
    </Badge>
  );
};