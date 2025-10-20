import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/services/logger";

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const speak = async (text: string) => {
    if (isPlaying) {
      stop();
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

      // Play audio
      const audio = new Audio(url);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        setAudioElement(null);
      };

      audio.onerror = (error) => {
        logger.error('Audio playback error', { error });
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        setAudioElement(null);
      };

      await audio.play();
    } catch (error) {
      logger.error('Text-to-speech error', { error });
      setIsPlaying(false);
      throw error;
    }
  };

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    setIsPlaying(false);
  };

  return {
    speak,
    stop,
    isPlaying
  };
};
