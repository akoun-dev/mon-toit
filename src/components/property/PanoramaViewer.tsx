import { Maximize2, Image as ImageIcon } from "lucide-react";

interface PanoramaViewerProps {
  imageUrl: string;
  title?: string;
}

export const PanoramaViewer = ({ imageUrl, title }: PanoramaViewerProps) => {
  return (
    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt={title || 'Vue panoramique'}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white p-6">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <p className="text-lg font-semibold mb-2">Vue Panoramique 360°</p>
          <p className="text-sm opacity-90">
            {title || 'Visualisation panoramique disponible'}
          </p>
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-medium">
        <Maximize2 className="inline-block h-4 w-4 mr-1" />
        Vue panoramique
      </div>
    </div>
  );
};
