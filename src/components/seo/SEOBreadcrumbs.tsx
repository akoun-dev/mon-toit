import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  path?: string;
}

interface SEOBreadcrumbsProps {
  items?: BreadcrumbItem[];
  homeLabel?: string;
}

const SEOBreadcrumbs: React.FC<SEOBreadcrumbsProps> = ({
  items = [],
  homeLabel = "Accueil"
}) => {
  const location = useLocation();
  const siteUrl = window.location.origin;

  // Generate breadcrumb items from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: homeLabel, path: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Convert segment to readable name
      let name = segment;
      switch (segment) {
        case 'recherche':
          name = 'Recherche';
          break;
        case 'favoris':
          name = 'Mes Favoris';
          break;
        case 'profil':
          name = 'Mon Profil';
          break;
        case 'auth':
          name = 'Connexion';
          break;
        case 'a-propos':
          name = 'À Propos';
          break;
        case 'guide':
          name = 'Guide';
          break;
        case 'tarifs':
          name = 'Tarifs';
          break;
        case 'aide':
          name = 'Aide';
          break;
        case 'confidentialite':
          name = 'Confidentialité';
          break;
        case 'accessibilite':
          name = 'Accessibilité';
          break;
        case 'properties':
          name = 'Biens';
          break;
        case 'admin':
          name = 'Administration';
          break;
        case 'dashboard':
          name = 'Tableau de Bord';
          break;
        default:
          // Capitalize first letter and replace hyphens with spaces
          name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      }

      breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  // Generate structured data for Google
  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.path ? `${siteUrl}${item.path}` : `${siteUrl}${location.pathname}`
      }))
    };

    return structuredData;
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>

      <nav
        aria-label="Fil d'Ariane"
        className="flex items-center space-x-2 text-sm text-muted-foreground py-2"
      >
        <ol className="flex items-center space-x-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isHome = index === 0;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                )}

                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {isHome && <Home className="h-4 w-4 inline mr-1" />}
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.path || '/'}
                    className="hover:text-foreground transition-colors flex items-center"
                  >
                    {isHome && <Home className="h-4 w-4 mr-1" />}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default SEOBreadcrumbs;