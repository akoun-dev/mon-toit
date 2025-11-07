import { cn } from '@/lib/utils';

interface QualityMetrics {
  faceDetected: boolean;
  facePosition: { x: number; y: number; width: number; height: number } | null;
  brightness: number;
  distance: 'too-close' | 'too-far' | 'perfect';
  overallQuality: 'good' | 'medium' | 'poor';
  feedback: string;
}

interface QualityOverlayProps {
  quality: QualityMetrics | null;
  isActive: boolean;
  isLoading?: boolean;
}

function getBorderColor(quality: 'good' | 'medium' | 'poor' | undefined): string {
  switch (quality) {
    case 'good':
      return 'hsl(var(--success))';
    case 'medium':
      return 'hsl(var(--warning))';
    case 'poor':
      return 'hsl(var(--destructive))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
}

export const QualityOverlay = ({ quality, isActive, isLoading }: QualityOverlayProps) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Oval guiding frame with dynamic color */}
      <svg className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <ellipse
          cx="50%"
          cy="50%"
          rx="35%"
          ry="45%"
          fill="none"
          stroke={getBorderColor(quality?.overallQuality)}
          strokeWidth="4"
          strokeDasharray="10,5"
          filter="url(#glow)"
          className={cn(
            "transition-all duration-300",
            quality?.overallQuality === 'good' && "animate-pulse"
          )}
        />
      </svg>

      {/* Subtle guide border */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[70%] h-[60%] border-2 border-dashed border-white/20 rounded-full" />

      {/* Corner indicators */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
      <div className="absolute bottom-20 left-4 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
      <div className="absolute bottom-20 right-4 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg" />

      {/* Feedback badge */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] flex justify-center">
        {isLoading ? (
          <div className="px-4 py-2 rounded-full bg-muted/90 backdrop-blur-sm text-muted-foreground text-sm font-medium shadow-lg">
            Chargement du modèle...
          </div>
        ) : (
          <div
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 backdrop-blur-sm text-center',
              quality?.overallQuality === 'good' && 'bg-success/90 text-success-foreground',
              quality?.overallQuality === 'medium' && 'bg-warning/90 text-warning-foreground',
              quality?.overallQuality === 'poor' && 'bg-destructive/90 text-destructive-foreground',
              !quality && 'bg-muted/90 text-muted-foreground'
            )}
          >
            {quality?.feedback || 'Analyse en cours...'}
          </div>
        )}
      </div>
    </div>
  );
};
