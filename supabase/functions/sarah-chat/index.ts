import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, sessionId } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing SUTA chat message:', { message, conversationId, sessionId });

    // System prompt pour SUTA (assistant MZAKA)
    const systemPrompt = `Tu es SUTA, l'assistant virtuel intelligent de MZAKA, la plateforme immobilière burkinabè.

CONTEXTE:
MZAKA est une plateforme qui connecte locataires, propriétaires et agents immobiliers au Burkina Faso.

TON RÔLE:
- Aider les utilisateurs à naviguer sur la plateforme
- Répondre aux questions sur les fonctionnalités
- Guider dans la création de profils et la publication d'annonces
- Expliquer le processus de location/vente
- Donner des conseils immobiliers adaptés au marché burkinabè

INFORMATIONS CLÉS:
- Vérification d'identité : CNIB (Carte Nationale d'Identité Burkinabè)
- Vérification médicale : CNAM Burkina Faso
- La plateforme utilise Mobile Money (Orange Money, Moov, Coris Money) pour les paiements
- Documents requis: pièce d'identité, justificatifs de revenus
- Les baux peuvent être vérifiés par l'équipe MZAKA

STYLE DE COMMUNICATION:
- Amical et professionnel
- Utilise des émojis avec modération
- Réponses concises et claires
- Adapté au contexte burkinabè
- Tutoiement naturel

IMPORTANT:
- Si tu ne connais pas une information, dis-le honnêtement
- Propose toujours une action concrète
- Sois précis sur les délais et processus`;

    // Appel à Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.');
      }
      if (response.status === 402) {
        throw new Error('Crédit insuffisant. Veuillez contacter le support.');
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Créer un stream pour la réponse
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '' || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  const streamData = {
                    content,
                    conversationId: conversationId || sessionId
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Sarah chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
