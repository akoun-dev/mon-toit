import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'listing';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  structuredData?: Record<string, any> | Record<string, any>[];
}

export const useSEO = (config: SEOConfig = {}) => {
  const location = useLocation();
  const siteUrl = window.location.origin;

  // Default SEO values
  const defaultSEO = {
    title: 'Mon Toit - Plateforme Immobilière Certifiée ANSUT',
    description: 'Le logement, en toute confiance. Location sécurisée et vérifiée en Côte d\'Ivoire avec certifications ANSUT et garanties locatives.',
    image: '/icons/icon-512x512.png',
    type: 'website' as const,
    keywords: [
      'location immobilier',
      'logement Côte d\'Ivoire',
      'Mon Toit',
      'ANSUT',
      'location sécurisée',
      'propriété Abidjan',
      'immobilier certifié',
      'location appartement',
      'maison à louer',
      'garantie locative'
    ],
    noindex: false
  };

  // Route-specific SEO configurations
  const routeSEO: Record<string, Partial<SEOConfig>> = {
    '/recherche': {
      title: 'Recherche de Biens Immobiliers',
      description: 'Trouvez votre logement idéal parmi des centaines d\'annonces vérifiées et certifiées ANSUT à Abidjan et en Côte d\'Ivoire.',
      keywords: [
        'recherche immobilier',
        'annonces location',
        'biens immobiliers',
        'appartements à louer',
        'maisons à louer',
        'location Abidjan'
      ],
      type: 'listing'
    },
    '/favoris': {
      title: 'Mes Favoris',
      description: 'Retrouvez tous vos biens favoris et suivez leurs disponibilités.',
      noindex: true
    },
    '/auth': {
      title: 'Connexion / Inscription',
      description: 'Accédez à votre compte Mon Toit pour gérer vos recherches, favoris et candidatures.',
      noindex: true
    },
    '/a-propos': {
      title: 'À Propos de Mon Toit',
      description: 'Découvrez Mon Toit, la plateforme immobilière certifiée par l\'État ivoirien pour des locations sécurisées.',
      keywords: [
        'à propos Mon Toit',
        'plateforme immobilier',
        'certification ANSUT',
        'sécurité locative',
        'immobilier Côte d\'Ivoire'
      ],
      type: 'article'
    },
    '/guide': {
      title: 'Guide Complet de la Location',
      description: 'Guides détaillés et conseils pour réussir votre location en toute sécurité en Côte d\'Ivoire.',
      keywords: [
        'guide location',
        'conseils immobilier',
        'location sécurité',
        'droit locatif Côte d\'Ivoire',
        'guide propriétaire'
      ],
      type: 'article'
    },
    '/tarifs': {
      title: 'Tarifs et Offres Mon Toit',
      description: 'Découvrez nos tarifs transparents et choisissez l\'offre qui correspond à vos besoins.',
      keywords: [
        'tarifs Mon Toit',
        'prix location',
        'coût plateforme',
        'abonnement immobilier',
        'tarifs propriétaire'
      ]
    },
    '/aide': {
      title: 'Aide et Support',
      description: 'Besoin d\'aide ? Trouvez des réponses à vos questions et contactez notre support.',
      keywords: [
        'aide Mon Toit',
        'support client',
        'FAQ immobilier',
        'assistance location',
        'contact support'
      ]
    }
  };

  // Get route-specific SEO
  const routeConfig = useMemo(() => {
    const path = location.pathname;

    // Check for exact match
    if (routeSEO[path]) {
      return routeSEO[path];
    }

    // Check for dynamic routes
    if (path.startsWith('/properties/')) {
      return {
        title: 'Détail du Bien',
        description: 'Découvrez toutes les caractéristiques de ce bien immobilier.',
        type: 'product' as const
      };
    }

    if (path.startsWith('/admin/')) {
      return {
        noindex: true,
        title: 'Administration'
      };
    }

    if (path.startsWith('/dashboard/')) {
      return {
        noindex: true,
        title: 'Tableau de Bord'
      };
    }

    return {};
  }, [location.pathname]);

  // Merge configurations
  const finalSEO = useMemo(() => {
    const merged = {
      ...defaultSEO,
      ...routeConfig,
      ...config
    };

    // Generate canonical URL
    const canonical = config.canonical || `${siteUrl}${location.pathname}${location.search}`;

    return {
      ...merged,
      canonical
    };
  }, [defaultSEO, routeConfig, config, location, siteUrl]);

  return finalSEO;
};

// Hook for generating structured data for real estate listings
export const useRealEstateSEO = (property: any) => {
  const siteUrl = window.location.origin;

  return useMemo(() => {
    if (!property) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": ["RealEstateListing", "Product"],
      "name": property.title,
      "description": property.description,
      "url": `${siteUrl}/properties/${property.id}`,
      "image": property.images?.[0] || property.main_image,
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": "XOF",
        "availability": property.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "CI",
        "addressLocality": property.city,
        "addressRegion": property.neighborhood,
        "streetAddress": property.address
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": property.latitude,
        "longitude": property.longitude
      },
      "numberOfRooms": property.bedrooms,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.area,
        "unitText": "m²"
      },
      "propertyType": property.property_type,
      "datePosted": property.created_at,
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "furnished",
        "value": property.furnished
      }
    };

    return structuredData;
  }, [property, siteUrl]);
};

// Hook for generating organization structured data
export const useOrganizationSEO = () => {
  const siteUrl = window.location.origin;

  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Mon Toit",
    "url": siteUrl,
    "logo": `${siteUrl}/icons/icon-512x512.png`,
    "description": "Plateforme immobilière certifiée par l'État ivoirien pour des locations sécurisées",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CI",
      "addressLocality": "Abidjan",
      "postalCode": "01"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+225-XX-XX-XX-XX",
      "contactType": "customer service",
      "availableLanguage": ["French", "English"]
    },
    "sameAs": [
      // Add social media URLs here
    ],
    "foundingDate": "2024",
    "areaServed": {
      "@type": "Country",
      "name": "Côte d'Ivoire"
    }
  }), [siteUrl]);
};