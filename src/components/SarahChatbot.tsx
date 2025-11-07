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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  "Comment créer mon dossier ?",
  "Comment fonctionne MZAKA ?",
  "Comment publier un bien ?",
  "Quels sont les tarifs ?",
];

export const SarahChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [useVoice, setUseVoice] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Bonjour ! Je suis SUTA, votre assistant MZAKA. Comment puis-je vous aider aujourd'hui ?"
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
      
      // Construire l'URL correctement depuis la config Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://btxhuqtirylvkgvoutoc.supabase.co';
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/sarah-chat`,
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

      // Déclencher la synthèse vocale après le streaming complet
      console.log('🔊 TTS Debug:', {
        useVoice,
        hasMessage: !!assistantMessage.trim(),
        messageLength: assistantMessage.length,
        message: assistantMessage.substring(0, 50)
      });
      
      if (useVoice && assistantMessage.trim()) {
        console.log('🎤 Tentative de lecture vocale...');
        speak(assistantMessage).catch(error => {
          console.error('❌ Erreur TTS:', error);
          logger.error('Failed to speak response', { error });
        });
      } else {
        console.log('⏸️ TTS non déclenché:', { useVoice, hasMessage: !!assistantMessage.trim() });
      }
    } catch (error) {
      logger.error('Error sending Sarah chat message', { error });
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
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50 bg-gradient-to-br from-primary to-secondary"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <span className="text-2xl">✨</span>}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-secondary">
              <AvatarFallback className="bg-transparent text-primary-foreground">
                <span className="text-2xl">✨</span>
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">SUTA</h3>
              <p className="text-xs opacity-90">
                {useVoice ? (isPlaying ? "🔊 En train de parler..." : "🎤 Mode vocal activé") : "Assistant MZAKA"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceMode}
              className="text-primary-foreground hover:bg-primary-foreground/10"
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
                    <Avatar className="h-8 w-8 mt-1 bg-gradient-to-br from-primary to-secondary">
                      <AvatarFallback className="bg-transparent text-primary-foreground">
                        <span className="text-xl">✨</span>
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-8 w-8 mt-1 bg-gradient-to-br from-primary to-secondary">
                    <AvatarFallback className="bg-transparent text-primary-foreground">
                      <span className="text-xl">✨</span>
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
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
                placeholder={isListening ? "🎤 Parlez maintenant..." : (useVoice ? "Tapez votre message (avec voix)..." : "Votre message...")}
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
                  title={isListening ? "Arrêter l'écoute" : "Parler à SUTA"}
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
