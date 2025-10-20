import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY not configured", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionCreated = false;

  socket.onopen = () => {
    console.log("Client WebSocket connected");
    
    // Connect to OpenAI Realtime API
    openAISocket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1"
        }
      }
    );

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
    };

    openAISocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("OpenAI message type:", data.type);

      // When session is created, send session.update with configuration
      if (data.type === 'session.created' && !sessionCreated) {
        sessionCreated = true;
        console.log("Session created, sending session.update");
        
        const sessionUpdate = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: `Tu es SUTA, l'assistant virtuel de Mon Toit, la plateforme de location immobilière certifiée en Côte d'Ivoire.

Tu es chaleureux, professionnel et empathique. Tu connais parfaitement :
- La location immobilière en Côte d'Ivoire
- Le processus de certification ANSUT (Agence Nationale de Sécurité des Usagers des TIC)
- Les différents quartiers et villes de Côte d'Ivoire (Abidjan, Yamoussoukro, etc.)
- Les types de biens disponibles (appartements, studios, villas, bureaux)

Tes responsabilités :
1. Aider les locataires à créer leur dossier de candidature
2. Guider les propriétaires dans la publication de leurs biens
3. Expliquer le processus de certification ANSUT et ses avantages
4. Répondre aux questions sur la location sécurisée
5. Orienter les utilisateurs dans l'application

Contexte technique :
- Mon Toit offre des baux certifiés ANSUT avec signature électronique
- Les locataires peuvent se faire vérifier (ONECI, CNAM, biométrie)
- Les propriétaires peuvent publier des biens avec photos, vidéos, visites 360°
- La plateforme gère les paiements mobile money et les candidatures

Ton style :
- Tutoiement amical mais professionnel
- Réponses concises et actionnables
- Utilise un ton naturel et conversationnel
- Propose toujours une prochaine étape concrète

Si tu ne connais pas une information, redis-le honnêtement et propose d'autres ressources.`,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        };

        openAISocket!.send(JSON.stringify(sessionUpdate));
      }

      // Forward all messages to client
      socket.send(event.data);
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({ 
        type: "error", 
        message: "OpenAI connection error" 
      }));
    };

    openAISocket.onclose = () => {
      console.log("OpenAI WebSocket closed");
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    console.log("Client message received");
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.send(event.data);
    } else {
      console.error("OpenAI socket not ready");
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});
