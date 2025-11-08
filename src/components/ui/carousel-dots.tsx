import * as React from "react";
import { cn } from "@/lib/utils";
import { useCarousel } from "@/components/ui/carousel";

interface CarouselDotsProps {
  className?: string;
  dotClassName?: string;
  activeDotClassName?: string;
}

export const CarouselDots = React.forwardRef<HTMLDivElement, CarouselDotsProps>(
  ({ className, dotClassName, activeDotClassName }, ref) => {
    const { api } = useCarousel();
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

    // Initialiser les snaps au montage
    React.useEffect(() => {
      if (!api) return;

      setScrollSnaps(api.scrollSnapList());
      setSelectedIndex(api.selectedScrollSnap());

      const onSelect = () => {
        setSelectedIndex(api.selectedScrollSnap());
      };

      api.on("select", onSelect);
      api.on("reInit", () => {
        setScrollSnaps(api.scrollSnapList());
        onSelect();
      });

      return () => {
        api.off("select", onSelect);
      };
    }, [api]);

    // Ne rien afficher si moins de 2 images
    if (scrollSnaps.length <= 1) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-2 py-4",
          className
        )}
        role="tablist"
        aria-label="Indicateurs de carrousel"
      >
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={`Aller à l'image ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              // Style de base
              "h-2.5 rounded-full transition-all duration-300 ease-in-out",
              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              // État inactif
              "w-2.5 bg-white/50 hover:bg-white/70",
              // État actif
              index === selectedIndex && "w-8 bg-primary shadow-lg",
              // Classes personnalisées
              dotClassName,
              index === selectedIndex && activeDotClassName
            )}
          />
        ))}
      </div>
    );
  }
);

CarouselDots.displayName = "CarouselDots";
