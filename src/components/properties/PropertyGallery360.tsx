import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Play, Pause, RotateCw, Image, Video, Panorama } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'panorama360';
  url: string;
  thumbnail?: string;
  caption?: string;
  isMain?: boolean;
}

interface PropertyGallery360Props {
  media: MediaItem[];
  className?: string;
  showThumbnails?: boolean;
  autoplay?: boolean;
}

const PropertyGallery360: React.FC<PropertyGallery360Props> = ({
  media,
  className,
  showThumbnails = true,
  autoplay = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [panoramaRotation, setPanoramaRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentItem = media[currentIndex];

  // Find main image index
  const mainImageIndex = media.findIndex(item => item.isMain);
  useEffect(() => {
    if (mainImageIndex !== -1) {
      setCurrentIndex(mainImageIndex);
    }
  }, [mainImageIndex]);

  // Auto-rotate 360° panorama
  useEffect(() => {
    if (currentItem?.type === 'panorama360' && isPlaying) {
      const interval = setInterval(() => {
        setPanoramaRotation(prev => (prev + 1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [currentItem?.type, isPlaying]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigate('prev');
      } else if (e.key === 'ArrowRight') {
        navigate('next');
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const navigate = (direction: 'prev' | 'next') => {
    setIsLoading(true);
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    } else {
      setCurrentIndex(prev => (prev + 1) % media.length);
    }
    setPanoramaRotation(0);
    setIsPlaying(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || currentItem?.type !== 'panorama360') return;

    const deltaX = e.touches[0].clientX - touchStart.x;
    const rotation = (deltaX / window.innerWidth) * 360;
    setPanoramaRotation(rotation);
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleMouseDrag = (e: React.MouseEvent) => {
    if (e.buttons !== 1 || currentItem?.type !== 'panorama360') return;

    const deltaX = e.movementX;
    setPanoramaRotation(prev => (prev + deltaX) % 360);
  };

  const renderMedia = () => {
    if (!currentItem) return null;

    switch (currentItem.type) {
      case 'image':
        return (
          <img
            ref={imageRef}
            src={currentItem.url}
            alt={currentItem.caption || 'Photo du bien'}
            className="w-full h-full object-contain"
            onLoad={() => setIsLoading(false)}
          />
        );

      case 'video':
        return (
          <video
            controls
            className="w-full h-full object-contain"
            onLoadedData={() => setIsLoading(false)}
          >
            <source src={currentItem.url} type="video/mp4" />
            Votre navigateur ne supporte pas les vidéos.
          </video>
        );

      case 'panorama360':
        return (
          <div
            ref={viewerRef}
            className="w-full h-full relative overflow-hidden cursor-move"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDrag}
          >
            <img
              src={currentItem.url}
              alt="Visite 360°"
              className="w-full h-full object-cover"
              style={{
                transform: `rotateY(${panoramaRotation}deg)`,
                transition: isPlaying ? 'none' : 'transform 0.1s ease-out'
              }}
              onLoad={() => setIsLoading(false)}
            />

            {/* 360° Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Slider
                value={[panoramaRotation]}
                onValueChange={(value) => setPanoramaRotation(value[0])}
                max={360}
                step={1}
                className="flex-1 mx-4"
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPanoramaRotation(0)}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* 360° Indicator */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2">
              <Panorama className="h-4 w-4 text-white" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderThumbnail = (item: MediaItem, index: number) => (
    <button
      key={item.id}
      onClick={() => setCurrentIndex(index)}
      className={cn(
        "relative overflow-hidden rounded-lg border-2 transition-all",
        currentIndex === index
          ? "border-primary ring-2 ring-primary/20"
          : "border-muted hover:border-primary/50"
      )}
    >
      {item.type === 'video' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Play className="h-4 w-4 text-white" />
        </div>
      )}
      {item.type === 'panorama360' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Panorama className="h-4 w-4 text-white" />
        </div>
      )}
      <img
        src={item.thumbnail || item.url}
        alt=""
        className="w-20 h-20 object-cover"
      />
    </button>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Viewer */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-muted">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {renderMedia()}

            {/* Navigation Controls */}
            {media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Media Type Badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {currentItem?.type === 'image' && <Image className="h-3 w-3 mr-1" />}
                {currentItem?.type === 'video' && <Video className="h-3 w-3 mr-1" />}
                {currentItem?.type === 'panorama360' && <Panorama className="h-3 w-3 mr-1" />}
                {currentItem?.type === 'image' && 'Photo'}
                {currentItem?.type === 'video' && 'Vidéo'}
                {currentItem?.type === 'panorama360' && 'Visite 360°'}
              </Badge>
            </div>

            {/* Fullscreen Control */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
                <div className="relative w-full h-full">
                  {renderMedia()}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Counter */}
          {media.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {currentIndex + 1} / {media.length}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thumbnails */}
      {showThumbnails && media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {media.map(renderThumbnail)}
        </div>
      )}

      {/* Caption */}
      {currentItem?.caption && (
        <p className="text-sm text-muted-foreground text-center">
          {currentItem.caption}
        </p>
      )}
    </div>
  );
};

export default PropertyGallery360;