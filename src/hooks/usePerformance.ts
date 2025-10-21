import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  domContentLoaded: number | null;
  loadComplete: number | null;
  firstPaint: number | null;
  firstContentfulPaint: number | null;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    firstPaint: null,
    firstContentfulPaint: null
  });

  const [isSupported, setIsSupported] = useState(false);

  // Check browser support
  useEffect(() => {
    setIsSupported(
      'performance' in window &&
      'PerformanceObserver' in window
    );
  }, []);

  // Measure Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    if (!isSupported) return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart) {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Cleanup function
      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, [isSupported]);

  // Measure navigation timing
  const measureNavigationTiming = useCallback(() => {
    if (!isSupported) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      setMetrics(prev => ({
        ...prev,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        ttfb: navigation.responseStart - navigation.requestStart
      }));
    }
  }, [isSupported]);

  // Measure paint timing
  const measurePaintTiming = useCallback(() => {
    if (!isSupported) return;

    const paint = performance.getEntriesByType('paint');
    paint.forEach((entry: any) => {
      if (entry.name === 'first-paint') {
        setMetrics(prev => ({ ...prev, firstPaint: entry.startTime }));
      }
      if (entry.name === 'first-contentful-paint') {
        setMetrics(prev => ({ ...prev, firstContentfulPaint: entry.startTime }));
      }
    });
  }, [isSupported]);

  // Initialize all measurements
  useEffect(() => {
    if (!isSupported) return;

    measureNavigationTiming();
    measurePaintTiming();
    const cleanup = measureCoreWebVitals();

    return cleanup;
  }, [isSupported, measureNavigationTiming, measurePaintTiming]);

  // Report metrics to console in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics.lcp) {
      console.group('🚀 Performance Metrics');
      console.log('LCP (Largest Contentful Paint):', metrics.lcp?.toFixed(2) + 'ms');
      console.log('FID (First Input Delay):', metrics.fid?.toFixed(2) + 'ms');
      console.log('CLS (Cumulative Layout Shift):', metrics.cls?.toFixed(3));
      console.log('FCP (First Contentful Paint):', metrics.fcp?.toFixed(2) + 'ms');
      console.log('TTFB (Time to First Byte):', metrics.ttfb?.toFixed(2) + 'ms');
      console.groupEnd();
    }
  }, [metrics]);

  // Get performance rating
  const getPerformanceRating = useCallback((metric: keyof PerformanceMetrics) => {
    const value = metrics[metric];
    if (value === null) return 'unknown';

    switch (metric) {
      case 'lcp':
        if (value < 2500) return 'good';
        if (value < 4000) return 'needs-improvement';
        return 'poor';
      case 'fid':
        if (value < 100) return 'good';
        if (value < 300) return 'needs-improvement';
        return 'poor';
      case 'cls':
        if (value < 0.1) return 'good';
        if (value < 0.25) return 'needs-improvement';
        return 'poor';
      case 'fcp':
        if (value < 1800) return 'good';
        if (value < 3000) return 'needs-improvement';
        return 'poor';
      case 'ttfb':
        if (value < 800) return 'good';
        if (value < 1800) return 'needs-improvement';
        return 'poor';
      default:
        return 'unknown';
    }
  }, [metrics]);

  // Get overall performance score
  const getOverallScore = useCallback(() => {
    if (!isSupported) return 0;

    const ratings = [
      getPerformanceRating('lcp'),
      getPerformanceRating('fid'),
      getPerformanceRating('cls'),
      getPerformanceRating('fcp'),
      getPerformanceRating('ttfb')
    ];

    const score = ratings.reduce((acc, rating) => {
      switch (rating) {
        case 'good': return acc + 20;
        case 'needs-improvement': return acc + 10;
        case 'poor': return acc + 0;
        default: return acc;
      }
    }, 0);

    return score;
  }, [isSupported, getPerformanceRating]);

  // Send metrics to analytics (if available)
  const sendToAnalytics = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const score = getOverallScore();

      (window as any).gtag('event', 'core_web_vitals', {
        event_category: 'Performance',
        event_label: 'Overall Score',
        value: score,
        custom_map: {
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
          fcp: metrics.fcp,
          ttfb: metrics.ttfb
        }
      });
    }
  }, [metrics, getOverallScore]);

  // Auto-send metrics when they're all available
  useEffect(() => {
    if (
      metrics.lcp !== null &&
      metrics.fid !== null &&
      metrics.cls !== null &&
      metrics.fcp !== null &&
      metrics.ttfb !== null
    ) {
      sendToAnalytics();
    }
  }, [metrics, sendToAnalytics]);

  return {
    metrics,
    isSupported,
    getPerformanceRating,
    getOverallScore,
    sendToAnalytics
  };
};

// Performance optimization utilities
export const usePerformanceOptimization = () => {
  const [optimizations, setOptimizations] = useState({
    lazyLoading: false,
    imageOptimization: false,
    codeSplitting: false,
    caching: false
  });

  // Enable lazy loading for images
  const enableLazyLoading = useCallback(() => {
    if ('IntersectionObserver' in window) {
      setOptimizations(prev => ({ ...prev, lazyLoading: true }));
      return true;
    }
    return false;
  }, []);

  // Optimize images
  const optimizeImages = useCallback(() => {
    // Add responsive image attributes
    const images = document.querySelectorAll('img:not([sizes])');
    images.forEach(img => {
      img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
      img.setAttribute('loading', 'lazy');
    });

    setOptimizations(prev => ({ ...prev, imageOptimization: true }));
  }, []);

  // Enable caching hints
  const enableCaching = useCallback(() => {
    // Add caching headers for static assets
    const links = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'dns-prefetch', href: 'https://api.supabase.co' }
    ];

    links.forEach(link => {
      const linkElement = document.createElement('link');
      Object.entries(link).forEach(([key, value]) => {
        linkElement.setAttribute(key, value);
      });
      document.head.appendChild(linkElement);
    });

    setOptimizations(prev => ({ ...prev, caching: true }));
  }, []);

  // Initialize all optimizations
  useEffect(() => {
    enableLazyLoading();
    optimizeImages();
    enableCaching();
  }, [enableLazyLoading, optimizeImages, enableCaching]);

  return {
    optimizations,
    enableLazyLoading,
    optimizeImages,
    enableCaching
  };
};

// Memory usage monitoring
export const useMemoryUsage = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'memory' in performance && (performance as any).memory;
    setIsSupported(supported);
  }, []);

  const measureMemory = useCallback(() => {
    if (!isSupported) return;

    const memory = (performance as any).memory;
    setMemoryInfo({
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    });
  }, [isSupported]);

  // Monitor memory usage periodically
  useEffect(() => {
    if (!isSupported) return;

    measureMemory();
    const interval = setInterval(measureMemory, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [isSupported, measureMemory]);

  return {
    memoryInfo,
    isSupported,
    measureMemory
  };
};