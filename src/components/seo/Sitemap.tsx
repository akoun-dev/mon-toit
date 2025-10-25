import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const Sitemap: React.FC = () => {
  const [sitemap, setSitemap] = useState<string>('');

  useEffect(() => {
    const generateSitemap = async () => {
      const siteUrl = window.location.origin;
      const currentDate = new Date().toISOString();

      // Static pages
      const staticPages: SitemapEntry[] = [
        {
          url: '/',
          lastmod: currentDate,
          changefreq: 'daily',
          priority: 1.0
        },
        {
          url: '/recherche',
          lastmod: currentDate,
          changefreq: 'daily',
          priority: 0.9
        },
        {
          url: '/guide',
          lastmod: currentDate,
          changefreq: 'weekly',
          priority: 0.8
        },
        {
          url: '/a-propos',
          lastmod: currentDate,
          changefreq: 'monthly',
          priority: 0.7
        },
        {
          url: '/tarifs',
          lastmod: currentDate,
          changefreq: 'monthly',
          priority: 0.6
        },
        {
          url: '/aide',
          lastmod: currentDate,
          changefreq: 'weekly',
          priority: 0.6
        },
        {
          url: '/auth',
          lastmod: currentDate,
          changefreq: 'monthly',
          priority: 0.4
        },
        {
          url: '/confidentialite',
          lastmod: currentDate,
          changefreq: 'yearly',
          priority: 0.3
        },
        {
          url: '/accessibilite',
          lastmod: currentDate,
          changefreq: 'yearly',
          priority: 0.3
        }
      ];

      // Dynamic pages (properties)
      let propertyPages: SitemapEntry[] = [];
      try {
        const { data: properties } = await supabase
          .from('properties')
          .select('id, updated_at, status')
          .eq('status', 'published');

        if (properties) {
          propertyPages = properties.map(property => ({
            url: `/property/${property.id}`,
            lastmod: property.updated_at || currentDate,
            changefreq: 'weekly' as const,
            priority: 0.8
          }));
        }
      } catch (error) {
        console.error('Error fetching properties for sitemap:', error);
      }

      // Combine all pages
      const allPages = [...staticPages, ...propertyPages];

      // Generate XML
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      setSitemap(xml);
    };

    generateSitemap();
  }, []);

  useEffect(() => {
    // Set content type header
    document.contentType = 'application/xml';
    return () => {
      document.contentType = 'text/html';
    };
  }, []);

  if (!sitemap) {
    return <div>Generating sitemap...</div>;
  }

  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
      {sitemap}
    </pre>
  );
};

export default Sitemap;