import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { KentePattern } from '@/components/ui/african-patterns';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface HeroHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  badgeLabel?: string;
  badgeIcon?: IconType;
  className?: string;
  containerClassName?: string; // override default container (content-left)
}

export function HeroHeader({ title, description, badgeLabel, badgeIcon: Icon, className, containerClassName }: HeroHeaderProps) {
  return (
    <section className={`relative py-6 md:py-8 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 ${className || ''}`}>
      <KentePattern />
      <div className={`${containerClassName || 'content-left'} relative z-10 text-center`}>
        <DynamicBreadcrumb />
        {badgeLabel && (
          <Badge variant="secondary" className="mb-4 inline-flex items-center gap-1">
            {Icon ? <Icon className="h-3 w-3" /> : null}
            {badgeLabel}
          </Badge>
        )}
        <h1 className="text-h1 mb-4">{title}</h1>
        {description ? (
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
