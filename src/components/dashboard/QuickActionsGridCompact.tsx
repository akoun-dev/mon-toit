import { Card, CardContent } from '@/components/ui/card';
import { Search, Heart, FileText, Bell, Home, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    title: 'Rechercher',
    icon: Search,
    link: '/recherche',
    color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Favoris',
    icon: Heart,
    link: '/favoris',
    color: 'from-pink-500/10 to-pink-600/10 border-pink-500/20 hover:border-pink-500/40',
    iconColor: 'text-pink-600',
  },
  {
    title: 'Candidatures',
    icon: FileText,
    link: '/candidatures',
    color: 'from-warning/10 to-warning/20 border-warning/20 hover:border-warning/40',
    iconColor: 'text-warning',
  },
  {
    title: 'Profil',
    icon: Bell,
    link: '/profile',
    color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:border-orange-500/40',
    iconColor: 'text-orange-600',
  },
];

export const QuickActionsGridCompact = () => {
  return (
    <div className="grid grid-cols-2 gap-1.5 xs:gap-2 h-[140px] xs:h-[150px] sm:h-[160px] md:h-[180px]">
      {quickActions.map((action) => (
        <Link key={action.title} to={action.link}>
          <Card className={cn(
            'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-gradient-to-br h-full',
            action.color
          )}>
            <CardContent className="p-1.5 xs:p-2 sm:p-3 flex flex-col items-center justify-center h-full gap-0.5 xs:gap-1">
              <action.icon className={cn('h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6', action.iconColor)} />
              <span className="text-xs font-semibold text-center leading-tight">
                <span className="hidden xs:inline">{action.title}</span>
                <span className="xs:hidden">
                  {action.title === 'Rechercher' ? '🔍' :
                   action.title === 'Favoris' ? '❤️' :
                   action.title === 'Candidatures' ? '📄' :
                   action.title === 'Profil' ? '👤' : action.title}
                </span>
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};