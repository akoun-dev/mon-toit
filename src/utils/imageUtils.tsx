import { logger } from '@/services/logger';

// Configuration
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
export const IMAGE_QUALITY = 0.85;
export const MAX_IMAGE_DIMENSION = 1920;

interface SimpleProgressProps {
  value: number;
  className?: string;
}

// Simple progress bar component
export const SimpleProgress: React.FC<SimpleProgressProps> = ({ value, className = '' }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
    <div 
      className="h-full bg-primary transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
);

/**
 * Compresse une image base64 tout en gardant le ratio
 */
export const compressImage = async (
  base64: string,
  maxWidth: number = MAX_IMAGE_DIMENSION,
  quality: number = IMAGE_QUALITY
): Promise<string> => {
  logger.debug('Compression image démarrée');
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      logger.debug('Dimensions originales image', { width, height });

      // Calculer les nouvelles dimensions en gardant le ratio
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = (height / width) * maxWidth;
          width = maxWidth;
        } else {
          width = (width / height) * maxWidth;
          height = maxWidth;
        }
        logger.debug('Nouvelles dimensions', { width, height });
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/jpeg', quality);
      const originalSize = (base64.length * 3) / 4 / 1024 / 1024;
      const compressedSize = (compressed.length * 3) / 4 / 1024 / 1024;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      logger.debug('Compression terminée', {
        original: `${originalSize.toFixed(2)}MB`,
        compressed: `${compressedSize.toFixed(2)}MB`,
        reduction: `${reduction}%`
      });
      
      resolve(compressed);
    };
    img.onerror = () => {
      logger.error('Erreur chargement image pour compression');
      reject(new Error('Erreur de chargement de l\'image'));
    };
    img.src = base64;
  });
};

/**
 * Valide un fichier image (type et taille)
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  logger.debug('Validation fichier', {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
  });
  
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPG ou PNG.' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Taille maximale: ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
  }
  return { valid: true };
};
