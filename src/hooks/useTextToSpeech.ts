import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/services/logger";

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  // Cleanup lors du démontage du composant
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsPlaying(false);
  };

  const speak = async (text: string) => {
    // Arrêter l'audio en cours si existant
    if (isPlaying) {
      cleanup();
    }

    try {
      setIsPlaying(true);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
      });

      if (error) throw error;
      if (!data?.audioContent) throw new Error('No audio content received');

      // Convert base64 to audio blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      // Créer et configurer l'audio
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = (error) => {
        logger.error('Audio playback error', { error });
        cleanup();
      };

      await audio.play();
    } catch (error) {
      logger.error('Text-to-speech error', { error });
      cleanup();
      throw error;
    }
  };

  const stop = () => {
    cleanup();
  };

  return {
    speak,
    stop,
    isPlaying
  };
};
