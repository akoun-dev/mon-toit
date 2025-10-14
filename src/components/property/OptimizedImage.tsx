import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/services/logger';

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  priority = false, 
  sizes,
  className 
}: OptimizedImageProps) => {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // ✅ SÉCURITÉ : Validation de l'URL avant affichage
  const sanitizeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Ne permettre que les URLs Supabase Storage
      if (!urlObj.hostname.includes('supabase.co')) {
        logger.warn('Unauthorized URL attempted', { hostname: urlObj.hostname });
        return '/placeholder.svg';
      }
      return url;
    } catch {
      return '/placeholder.svg';
    }
  };

  const getLowResSrc = (url: string): string => {
    if (url.includes("supabase")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}quality=10&width=50`;
    }
    return url;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!isVisible) return;

    const safeSrc = sanitizeUrl(src);
    setIsLoading(true);
    
    const lowResImg = new Image();
    const lowResSrc = getLowResSrc(safeSrc);
    
    lowResImg.onload = () => {
      setCurrentSrc(lowResSrc);
      
      const highResImg = new Image();
      highResImg.onload = () => {
        setCurrentSrc(safeSrc);
        setIsLoading(false);
      };
      highResImg.onerror = () => {
        setIsLoading(false);
      };
      highResImg.src = safeSrc;
    };

    lowResImg.onerror = () => {
      setCurrentSrc(safeSrc);
      setIsLoading(false);
    };

    lowResImg.src = lowResSrc;
  }, [src, isVisible]);

  const generateSrcSet = (url: string): string => {
    if (!url.includes("supabase")) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `
      ${url}${separator}width=480 480w,
      ${url}${separator}width=768 768w,
      ${url}${separator}width=1024 1024w,
      ${url}${separator}width=1280 1280w
    `.trim();
  };

  return (
    <div ref={imgRef as any}>
      {isVisible && currentSrc ? (
        <picture>
          <source
            srcSet={generateSrcSet(currentSrc)}
            sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            type="image/webp"
          />
          <img
            src={currentSrc}
            srcSet={generateSrcSet(currentSrc)}
            sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={cn(
              "transition-opacity duration-500 w-full h-auto",
              isLoading ? "blur-sm opacity-50" : "blur-0 opacity-100",
              className
            )}
          />
        </picture>
      ) : (
        <div className={cn("bg-muted animate-pulse", className)} />
      )}
    </div>
  );
};
