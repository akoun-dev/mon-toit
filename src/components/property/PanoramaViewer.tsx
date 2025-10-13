import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { Maximize2, Minimize2, RotateCw, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PanoramaViewerProps {
  imageUrl: string;
  title?: string;
  autoRotate?: boolean;
  hotspots?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    tooltip: string;
    content?: string;
  }>;
}

export const PanoramaViewer = ({
  imageUrl,
  title,
  autoRotate = false,
  hotspots = []
}: PanoramaViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  const [gyroscopeAvailable, setGyroscopeAvailable] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const plugins: any[] = [
        [MarkersPlugin, {
          markers: hotspots.map(h => ({
            id: h.id,
            position: { yaw: h.longitude, pitch: h.latitude },
            html: h.tooltip,
            tooltip: h.content
          }))
        }]
      ];

      // Check if gyroscope is available on mobile
      if (isMobile && typeof DeviceOrientationEvent !== 'undefined') {
        setGyroscopeAvailable(true);

        // iOS 13+ requires permission
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          setNeedsPermission(true);
        } else {
          // Android or older iOS - try to enable directly
          plugins.push([GyroscopePlugin, { moveMode: 'smooth' }]);
          setGyroscopeEnabled(true);
        }
      }

      const viewer = new Viewer({
        container: containerRef.current,
        panorama: imageUrl,
        caption: title,
        loadingImg: undefined,
        navbar: [
          'zoom',
          'move',
          'fullscreen',
        ],
        defaultZoomLvl: 50,
        minFov: 30,
        maxFov: 120,
        mousewheel: true,
        mousemove: true,
        keyboard: {
          'ArrowUp': 'ROTATE_UP',
          'ArrowDown': 'ROTATE_DOWN',
          'ArrowRight': 'ROTATE_RIGHT',
          'ArrowLeft': 'ROTATE_LEFT',
          'PageUp': 'ZOOM_IN',
          'PageDown': 'ZOOM_OUT',
          '+': 'ZOOM_IN',
          '-': 'ZOOM_OUT',
        },
        plugins,
      });

      viewerRef.current = viewer;

      // Auto rotate if enabled
      if (autoRotate) {
        viewer.startAutorotate();
      }

      // Handle loading complete
      viewer.addEventListener('ready', () => {
        setIsLoading(false);
      });

      // Handle errors
      viewer.addEventListener('error', (err) => {
        setError("Impossible de charger l'image panoramique");
        setIsLoading(false);
        console.error('Panorama viewer error:', err);
      });

      // Handle fullscreen changes
      viewer.addEventListener('fullscreen-updated', (e: any) => {
        setIsFullscreen(e.fullscreenEnabled);
      });

    } catch (err) {
      setError("Erreur d'initialisation du viewer 360°");
      setIsLoading(false);
      console.error('Failed to initialize viewer:', err);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [imageUrl, title, autoRotate, isMobile]);

  const requestGyroscopePermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();

        if (permission === 'granted') {
          // Enable gyroscope plugin
          if (viewerRef.current) {
            const gyroscope = viewerRef.current.getPlugin(GyroscopePlugin);
            if (!gyroscope) {
              // Plugin not loaded, need to reinit viewer
              window.location.reload();
            } else {
              setGyroscopeEnabled(true);
              setNeedsPermission(false);
            }
          }
        }
      }
    } catch (err) {
      console.error('Gyroscope permission denied:', err);
      setNeedsPermission(false);
    }
  };

  const toggleAutoRotate = () => {
    if (viewerRef.current) {
      if (viewerRef.current.isAutorotateEnabled()) {
        viewerRef.current.stopAutorotate();
      } else {
        viewerRef.current.startAutorotate();
      }
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative w-full">
      {/* Instructions overlay */}
      {!isLoading && (
        <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {isMobile ? '👆 Glissez pour explorer' : '🖱️ Glissez la souris pour explorer'}
          </p>
        </div>
      )}

      {/* Title badge */}
      {title && !isLoading && (
        <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Maximize2 className="h-4 w-4" />
            {title}
          </p>
        </div>
      )}

      {/* Controls */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleAutoRotate}
            className="shadow-lg"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rotation auto
          </Button>

          {gyroscopeAvailable && needsPermission && (
            <Button
              size="sm"
              variant="secondary"
              onClick={requestGyroscopePermission}
              className="shadow-lg"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Activer le gyroscope
            </Button>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-muted/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold">Chargement de la vue 360°...</p>
            <p className="text-sm text-muted-foreground">
              Cela peut prendre quelques secondes
            </p>
          </div>
        </div>
      )}

      {/* Viewer container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full aspect-video rounded-lg overflow-hidden bg-muted",
          isFullscreen && "aspect-auto"
        )}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};
