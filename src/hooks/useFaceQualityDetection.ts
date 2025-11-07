import { useEffect, useRef, useState, useCallback } from 'react';
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

interface QualityMetrics {
  faceDetected: boolean;
  facePosition: { x: number; y: number; width: number; height: number } | null;
  brightness: number;
  distance: 'too-close' | 'too-far' | 'perfect';
  overallQuality: 'good' | 'medium' | 'poor';
  feedback: string;
}

interface UseFaceQualityDetectionReturn {
  quality: QualityMetrics | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  startAnalysis: () => void;
  stopAnalysis: () => void;
}

export function useFaceQualityDetection(
  videoRef: React.RefObject<HTMLVideoElement>
): UseFaceQualityDetectionReturn {
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<any>(null);
  const frameCountRef = useRef(0);

  const initializeDetector = useCallback(async () => {
    if (detectorRef.current) return;
    
    setIsLoading(true);
    try {
      detectorRef.current = await pipeline(
        'object-detection',
        'Xenova/yolos-tiny',
        { device: 'webgpu' }
      );
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU', error);
      try {
        detectorRef.current = await pipeline(
          'object-detection',
          'Xenova/yolos-tiny'
        );
      } catch (fallbackError) {
        console.error('Failed to initialize face detector:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateBrightness = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): number => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let total = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += (r + g + b) / 3;
    }
    
    return total / (data.length / 4);
  }, []);

  const calculateDistance = useCallback((
    faceWidth: number,
    faceHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): 'too-close' | 'too-far' | 'perfect' => {
    const faceArea = faceWidth * faceHeight;
    const canvasArea = canvasWidth * canvasHeight;
    const ratio = faceArea / canvasArea;

    if (ratio > 0.6) return 'too-close';
    if (ratio < 0.15) return 'too-far';
    return 'perfect';
  }, []);

  const generateFeedback = useCallback((metrics: QualityMetrics): string => {
    if (!metrics.faceDetected) {
      return '❌ Aucun visage détecté • Positionnez-vous face à la caméra';
    }

    const issues: string[] = [];

    if (metrics.brightness < 60) {
      issues.push('⚠️ Trop sombre • Ajoutez de l\'éclairage');
    } else if (metrics.brightness > 180) {
      issues.push('⚠️ Trop lumineux • Réduisez la lumière directe');
    }

    if (metrics.distance === 'too-close') {
      issues.push('⚠️ Trop proche • Reculez légèrement');
    } else if (metrics.distance === 'too-far') {
      issues.push('⚠️ Trop loin • Rapprochez-vous');
    }

    if (issues.length === 0) {
      return '✅ Parfait ! Vous pouvez capturer';
    }

    return issues.join(' • ');
  }, []);

  const calculateOverallQuality = useCallback((
    faceDetected: boolean,
    brightness: number,
    distance: 'too-close' | 'too-far' | 'perfect'
  ): 'good' | 'medium' | 'poor' => {
    let score = 0;

    if (faceDetected) score += 3;
    if (brightness >= 60 && brightness <= 180) score += 2;
    if (distance === 'perfect') score += 2;

    if (score >= 6) return 'good';
    if (score >= 4) return 'medium';
    return 'poor';
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || !isAnalyzing) return;

    frameCountRef.current++;

    // Analyze 1 frame out of 10 for performance
    if (frameCountRef.current % 10 !== 0) {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Detect faces
      const detections = await detectorRef.current(canvas.toDataURL('image/jpeg', 0.5));
      
      // Find person/face detection
      const faceDetection = detections.find((d: any) => 
        d.label === 'person' && d.score > 0.5
      );

      const faceDetected = !!faceDetection;
      const facePosition = faceDetection ? {
        x: faceDetection.box.xmin,
        y: faceDetection.box.ymin,
        width: faceDetection.box.xmax - faceDetection.box.xmin,
        height: faceDetection.box.ymax - faceDetection.box.ymin
      } : null;

      // Calculate brightness
      const brightness = calculateBrightness(canvas, ctx);

      // Calculate distance
      const distance = facePosition 
        ? calculateDistance(facePosition.width, facePosition.height, canvas.width, canvas.height)
        : 'too-far';

      // Calculate overall quality
      const overallQuality = calculateOverallQuality(faceDetected, brightness, distance);

      const metrics: QualityMetrics = {
        faceDetected,
        facePosition,
        brightness,
        distance,
        overallQuality,
        feedback: ''
      };

      metrics.feedback = generateFeedback(metrics);

      setQuality(metrics);
    } catch (error) {
      console.error('Error analyzing frame:', error);
    }

    animationFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [isAnalyzing, videoRef, calculateBrightness, calculateDistance, calculateOverallQuality, generateFeedback]);

  const startAnalysis = useCallback(async () => {
    await initializeDetector();
    setIsAnalyzing(true);
    frameCountRef.current = 0;
  }, [initializeDetector]);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setQuality(null);
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      analyzeFrame();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnalyzing, analyzeFrame]);

  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    quality,
    isAnalyzing,
    isLoading,
    startAnalysis,
    stopAnalysis
  };
}
