import type { Property } from '@/types';

/**
 * Generate JSON-LD structured data for a property listing
 * Following Schema.org RealEstateListing specification
 */
export const generatePropertyStructuredData = (property: Property, ownerName?: string) => {
  const baseUrl = 'https://mon-toit.lovable.app';
  const propertyUrl = `${baseUrl}/properties/${property.id}`;

  // Get first image or use placeholder
  const image = property.images?.[0] || `${baseUrl}/placeholder.svg`;

  // Calculate price range if available
  const priceSpecification = property.monthly_rent ? {
    "@type": "PriceSpecification",
    "price": property.monthly_rent,
    "priceCurrency": "XOF",
    "unitCode": "MON"
  } : undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": propertyUrl,
    "image": Array.isArray(property.images) ? property.images : [image],

    "offers": {
      "@type": "Offer",
      "availability": property.status === 'disponible' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "price": property.monthly_rent,
      "priceCurrency": "XOF",
      ...(priceSpecification && { "priceSpecification": priceSpecification })
    },

    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.city || property.location,
      "addressCountry": "CI",
      ...(property.location && { "streetAddress": property.location })
    },

    "geo": property.latitude && property.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": property.latitude,
      "longitude": property.longitude
    } : undefined,

    "numberOfRooms": property.bedrooms,
    "numberOfBedrooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms,
    "floorSize": property.surface_area ? {
      "@type": "QuantitativeValue",
      "value": property.surface_area,
      "unitCode": "MTK"
    } : undefined,

    "amenityFeature": [
      ...(property.is_furnished ? [{ "@type": "LocationFeatureSpecification", "name": "Meublé" }] : []),
      ...(property.has_parking ? [{ "@type": "LocationFeatureSpecification", "name": "Parking" }] : []),
      ...(property.has_ac ? [{ "@type": "LocationFeatureSpecification", "name": "Climatisation" }] : []),
      ...(property.has_garden ? [{ "@type": "LocationFeatureSpecification", "name": "Jardin" }] : []),
    ],

    ...(ownerName && {
      "seller": {
        "@type": "Person",
        "name": ownerName
      }
    }),

    "datePosted": property.created_at,
    "validThrough": property.available_from || undefined,
  };

  return structuredData;
};

/**
 * Generate JSON-LD structured data for the organization
 */
export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Mon Toit",
    "description": "Plateforme immobilière 100% ivoirienne certifiée ANSUT. Location sécurisée en Côte d'Ivoire.",
    "url": "https://mon-toit.lovable.app",
    "logo": "https://mon-toit.lovable.app/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["fr", "French"]
    },
    "sameAs": [
      "https://www.facebook.com/montoit",
      "https://www.instagram.com/montoit",
      "https://twitter.com/montoit"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Abidjan",
      "addressCountry": "CI"
    }
  };
};

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export const generateBreadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

/**
 * Component to inject structured data into the page head
 */
export const StructuredDataScript = ({ data }: { data: object }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};
