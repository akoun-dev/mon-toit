import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'listing';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: Record<string, any> | Record<string, any>[];
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  type = 'website',
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  canonical,
  noindex = false,
  structuredData = []
}) => {
  const location = useLocation();
  const siteUrl = window.location.origin;
  const currentUrl = canonical || `${siteUrl}${location.pathname}${location.search}`;

  // Default values
  const defaultTitle = 'Mon Toit - Plateforme Immobilière Certifiée ANSUT';
  const defaultDescription = 'Le logement, en toute confiance. Location sécurisée et vérifiée en Côte d\'Ivoire avec certifications ANSUT et garanties locatives.';
  const defaultImage = `${siteUrl}/icons/icon-512x512.png`;

  const pageTitle = title ? `${title} | Mon Toit` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image ? image.startsWith('http') ? image : `${siteUrl}${image}` : defaultImage;

  // Generate JSON-LD structured data
  const generateStructuredData = () => {
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": type === 'product' ? 'RealEstateListing' : type === 'article' ? 'Article' : 'WebPage',
      "name": pageTitle,
      "description": pageDescription,
      "url": currentUrl,
      "image": pageImage,
      "publisher": {
        "@type": "Organization",
        "name": "Mon Toit",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": defaultImage
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "CI",
          "addressLocality": "Abidjan"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": ["French", "English"]
        }
      }
    };

    // Add publication info for articles
    if (type === 'article' && publishedTime) {
      baseStructuredData.datePublished = publishedTime;
      if (modifiedTime) {
        baseStructuredData.dateModified = modifiedTime;
      }
      if (author) {
        baseStructuredData.author = {
          "@type": "Organization",
          "name": author
        };
      }
    }

    // Add real estate specific data
    if (type === 'product') {
      baseStructuredData.offers = {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "XOF",
        "itemCondition": "https://schema.org/NewCondition"
      };
    }

    return [baseStructuredData, ...(Array.isArray(structuredData) ? structuredData : [structuredData])];
  };

  const jsonLdData = generateStructuredData();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Mon Toit" />
      <meta property="og:locale" content="fr_CI" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageImage} />

      {/* Additional SEO Meta Tags */}
      <meta name="language" content="French" />
      <meta name="geo.region" content="CI" />
      <meta name="geo.placename" content="Côte d'Ivoire" />
      <meta name="ICBM" content="5.3600;-4.0083" />

      {/* Theme Color */}
      <meta name="theme-color" content="#FF8F00" />
      <meta name="msapplication-TileColor" content="#FF8F00" />

      {/* Apple Touch Icon */}
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

      {/* Structured Data */}
      {jsonLdData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;