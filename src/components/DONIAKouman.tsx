import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { logger } from "@/services/logger";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { BRANDING } from "@/config/branding";
import "@/styles/design-system-kouman.css";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  "Comment créer mon dossier DONIA ?",
  "Qu'est-ce que Faso Arzeka ?",
  "Comment vérifier un bail ?",
  "Quels sont les quartiers de Ouagadougou ?",
];

export const DONIAKouman = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [useVoice, setUseVoice] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Bonjour ! Je suis ${BRANDING.CHATBOT.name_full}, ${BRANDING.CHATBOT.meaning.combined}. Comment puis-je vous aider aujourd'hui ?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { speak, stop, isPlaying } = useTextToSpeech();
  const { 
    isListening, 
    isSupported: isVoiceInputSupported, 
    startListening, 
    stopListening 
  } = useVoiceSearch({
    onResult: (transcript) => {
      setInput(transcript);
    },
    onError: (error) => {
      logger.error('Voice input error', { error });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleVoiceMode = () => {
    if (useVoice) {
      stop();
    }
    setUseVoice(!useVoice);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://btxhuqtirylvkgvoutoc.supabase.co';
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/donia-kouman-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && {
              'Authorization': `Bearer ${session.access_token}`
            }),
          },
          body: JSON.stringify({
            message: messageText,
            conversationId,
            sessionId
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Erreur de communication';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si le JSON parse échoue, utiliser le message par défaut
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let currentConversationId = conversationId;

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.conversationId && !currentConversationId) {
                currentConversationId = parsed.conversationId;
                setConversationId(currentConversationId);
              }

              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      if (useVoice && assistantMessage.trim()) {
        speak(assistantMessage).catch(error => {
          logger.error('Failed to speak response', { error });
        });
      }
    } catch (error) {
      logger.error('Error sending DONIA KOUMAN chat message', { error });
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: "Désolée, j'ai rencontré un problème. Pouvez-vous réessayer ?"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Button avec design KOUMAN */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="kouman-chat-bubble fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : (
          <div className="flex items-center justify-center">
            <svg className="h-8 w-8 text-white kouman-wave-animation" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
              <path d="M8 12h2v0h2v-2h-2v2h-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2z" fill="currentColor"/>
            </svg>
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background border-2 rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5" style={{ borderColor: BRANDING.CHATBOT.visual.colors.primary }}>
          {/* Header KOUMAN */}
          <div className="kouman-header flex items-center gap-3 p-4 border-b text-white rounded-t-2xl">
            <Avatar className="kouman-avatar h-12 w-12">
              <AvatarFallback className="bg-transparent text-white">
                <span className="text-2xl font-bold">K</span>
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{BRANDING.CHATBOT.name_full}</h3>
              <p className="text-xs opacity-90">
                {useVoice ? (isPlaying ? "🔊 En train de parler..." : "🎤 Mode vocal") : BRANDING.CHATBOT.tagline_fr}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceMode}
              className="text-white hover:bg-white/10"
              title={useVoice ? "Désactiver la voix" : "Activer la voix"}
            >
              {useVoice ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="kouman-avatar h-8 w-8 mt-1">
                      <AvatarFallback className="bg-transparent text-white">
                        <span className="text-xl font-bold">K</span>
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'kouman-message-assistant'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="kouman-avatar h-8 w-8 mt-1">
                    <AvatarFallback className="bg-transparent text-white">
                      <span className="text-xl font-bold">K</span>
                    </AvatarFallback>
                  </Avatar>
                  <div className="kouman-message-assistant rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          {messages.length === 1 && !isLoading && !useVoice && (
            <div className="p-3 border-t bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">💡 Suggestions :</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-xs h-7"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "🎤 Parlez à Kouman..." : "Posez votre question à Kouman..."}
                disabled={isLoading}
                className="flex-1"
              />
              {isVoiceInputSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  title={isListening ? "Arrêter l'écoute" : "Parler à DONIA KOUMAN"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
