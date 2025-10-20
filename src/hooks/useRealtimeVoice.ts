import { useEffect, useRef, useState } from "react";
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from "@/utils/RealtimeAudio";
import { logger } from "@/services/logger";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useRealtimeVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const currentTranscriptRef = useRef<string>("");
  const currentResponseRef = useRef<string>("");

  const connect = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Connect to edge function WebSocket
      const ws = new WebSocket(
        `wss://btxhuqtirylvkgvoutoc.supabase.co/functions/v1/realtime-voice`
      );

      ws.onopen = () => {
        console.log("WebSocket connected to edge function");
        setIsConnected(true);
        
        // Start audio recorder
        if (!recorderRef.current) {
          recorderRef.current = new AudioRecorder((audioData) => {
            if (ws.readyState === WebSocket.OPEN) {
              const base64Audio = encodeAudioForAPI(audioData);
              ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Audio
              }));
            }
          });
          
          recorderRef.current.start().catch(error => {
            logger.error("Failed to start audio recorder", { error });
          });
        }
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message type:", data.type);

        switch (data.type) {
          case 'session.created':
            console.log("Session created");
            break;

          case 'session.updated':
            console.log("Session updated");
            break;

          case 'input_audio_buffer.speech_started':
            console.log("User started speaking");
            currentTranscriptRef.current = "";
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log("User stopped speaking");
            break;

          case 'conversation.item.input_audio_transcription.completed':
            if (data.transcript) {
              console.log("User transcript:", data.transcript);
              currentTranscriptRef.current = data.transcript;
              setMessages(prev => [...prev, { 
                role: 'user', 
                content: data.transcript 
              }]);
            }
            break;

          case 'response.created':
            console.log("AI response started");
            setIsSpeaking(true);
            currentResponseRef.current = "";
            break;

          case 'response.audio_transcript.delta':
            if (data.delta) {
              currentResponseRef.current += data.delta;
            }
            break;

          case 'response.audio_transcript.done':
            if (currentResponseRef.current) {
              console.log("AI transcript complete:", currentResponseRef.current);
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: currentResponseRef.current 
              }]);
            }
            break;

          case 'response.audio.delta':
            if (data.delta && audioContextRef.current) {
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await playAudioData(audioContextRef.current, bytes);
            }
            break;

          case 'response.audio.done':
            console.log("AI audio complete");
            break;

          case 'response.done':
            console.log("AI response fully complete");
            setIsSpeaking(false);
            break;

          case 'error':
            console.error("Error from server:", data);
            logger.error("Realtime voice error", { error: data });
            break;
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        logger.error("WebSocket error", { error });
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsSpeaking(false);
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error("Failed to connect to realtime voice", { error });
      throw error;
    }
  };

  const disconnect = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    clearAudioQueue();
    setIsConnected(false);
    setIsSpeaking(false);
  };

  const sendTextMessage = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text
            }
          ]
        }
      };
      
      wsRef.current.send(JSON.stringify(event));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
      
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isSpeaking,
    messages,
    connect,
    disconnect,
    sendTextMessage
  };
};
