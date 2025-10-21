import { useState, useEffect, Suspense } from 'react';
import { cn } from '@/lib/utils';

interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  delay?: number;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
}

interface LazyBundleProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

// Error boundary for lazy loaded components
class BundleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Bundle loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error && this.props.fallback) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent
          error={this.state.error}
          retry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-medium mb-2">Erreur de chargement</h3>
          <p className="text-red-600 text-sm">
            Une erreur s'est produite lors du chargement de ce composant.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default error component
const DefaultErrorComponent: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-center">
    <div className="text-red-600 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
    <p className="text-red-600 text-sm mb-4">
      {error.message || 'Une erreur inattendue est survenue'}
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      Réessayer
    </button>
  </div>
);

// Default loading component
const DefaultLoadingComponent = () => (
  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
      <div className="h-32 bg-gray-300 rounded"></div>
    </div>
  </div>
);

// Enhanced lazy component with error handling and loading delay
export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <DefaultLoadingComponent />,
  delay = 200,
  errorComponent = DefaultErrorComponent,
  preload = false
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Preload component if requested
  useEffect(() => {
    if (preload) {
      loadComponent();
    }
  }, [preload]);

  const loadComponent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Add delay if specified (to prevent flashing)
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const module = await loader();
      setComponent(() => module.default);
    } catch (err) {
      console.error('Component loading error:', err);
      setError(err instanceof Error ? err : new Error('Unknown loading error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Lazy loading component
  const LazyComponentInner = () => {
    const [shouldLoad, setShouldLoad] = useState(preload);

    useEffect(() => {
      if (!shouldLoad && !Component && !error) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setShouldLoad(true);
              loadComponent();
            }
          },
          {
            rootMargin: '50px'
          }
        );

        const element = document.getElementById('lazy-component-trigger');
        if (element) {
          observer.observe(element);
        }

        return () => observer.disconnect();
      }
    }, [shouldLoad, Component, error]);

    if (shouldLoad && isLoading) {
      return <>{fallback}</>;
    }

    if (error) {
      const ErrorComponent = errorComponent;
      return <ErrorComponent error={error} retry={loadComponent} />;
    }

    if (Component) {
      return <Component />;
    }

    return <div id="lazy-component-trigger" style={{ height: '1px' }} />;
  };

  return (
    <BundleErrorBoundary fallback={errorComponent}>
      <Suspense fallback={fallback}>
        <LazyComponentInner />
      </Suspense>
    </BundleErrorBoundary>
  );
};

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  options: {
    fallback?: React.ReactNode;
    errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
    delay?: number;
    preload?: boolean;
  } = {}
) {
  const WrappedComponent = (props: P) => (
    <LazyComponent
      loader={loader}
      fallback={options.fallback}
      errorComponent={options.errorComponent}
      delay={options.delay}
      preload={options.preload}
    />
  );

  WrappedComponent.displayName = 'WithLazyLoading';
  return WrappedComponent;
}

// Bundle preloader utility
export const preloadBundle = (loader: () => Promise<{ default: React.ComponentType<any> }>) => {
  loader().catch(error => {
    console.warn('Bundle preloading failed:', error);
  });
};

// Performance monitor for bundle loading
export const useBundlePerformance = (bundleName: string) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    size: 0,
    status: 'idle' as 'idle' | 'loading' | 'loaded' | 'error'
  });

  const trackBundleLoad = (startTime: number, endTime: number, success: boolean) => {
    const loadTime = endTime - startTime;
    setMetrics(prev => ({
      ...prev,
      loadTime,
      status: success ? 'loaded' : 'error'
    }));

    // Report to analytics if needed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'bundle_load', {
        bundle_name: bundleName,
        load_time: loadTime,
        success: success
      });
    }
  };

  return { metrics, trackBundleLoad };
};

// Bundle optimization hints for development
export const BundleOptimizer = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs">
        <h4 className="font-semibold mb-2">💡 Optimisation Tips:</h4>
        <ul className="space-y-1">
          <li>• Use LazyComponent for heavy components</li>
          <li>• Preload critical bundles</li>
          <li>• Split code by routes</li>
          <li>• Optimize images and assets</li>
          <li>• Monitor bundle size</li>
        </ul>
      </div>
    </div>
  );
};

export default LazyComponent;