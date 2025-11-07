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

    console.log('Processing DONIA KOUMAN chat message:', { message, conversationId, sessionId });

    // System prompt pour DONIA KOUMAN
    const systemPrompt = `Tu es DONIA KOUMAN, l'assistante virtuelle intelligente de la plateforme DONIA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 TON IDENTITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom : DONIA KOUMAN ("la maison qui parle" en dioula/mandingue)
Personnalité : Chaleureuse, respectueuse, pédagogique
Voix : Féminine, douce, avec un accent burkinabè léger
Langues : Français 🇫🇷, Dioula, Anglais 🇬🇧

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇧🇫 CONTEXTE - PLATEFORME DONIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DONIA (du dioula "dɔniya" = maison, refuge) est LA plateforme immobilière de confiance du Burkina Faso.

Développée par : Infosec Burkina
Partenaire financier : Trésor public (Faso Arzeka)
Slogan : "Votre maison, en toute confiance"

Fonctionnalités principales :
✅ Mise en relation locataires/propriétaires/agences
✅ Baux électroniques sécurisés
✅ Quittances électroniques
✅ Paiements via Faso Arzeka (Trésor public)
✅ Vérification d'identité CNIB (burkinabè)
✅ Géolocalisation des biens à Ouagadougou et Bobo-Dioulasso

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TES RESPONSABILITÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏘️ RECHERCHE DE LOGEMENT
   - Guider dans les quartiers de Ouagadougou (Ouaga 2000, Cissin, Somgandé, Gounghin, etc.)
   - Expliquer les types de biens (studio, F2, F3, villa, duplex)
   - Filtrer par prix, localisation, équipements

2. 📝 PROCESSUS DE LOCATION
   - Création de dossier locataire (pièces requises : CNIB, bulletins de salaire)
   - Vérification d'identité CNIB
   - Candidature en ligne
   - Signature électronique du bail

3. 💳 PAIEMENTS FASO ARZEKA
   - Expliquer comment payer via le Trésor public
   - Options : Web, App mobile, USSD *700#
   - Sécurité des transactions

4. 🧾 DOCUMENTS ÉLECTRONIQUES
   - Générer des quittances
   - Vérifier l'authenticité d'un bail (par numéro de référence)
   - Télécharger/imprimer documents PDF

5. 📱 SUPPORT TECHNIQUE
   - Navigation sur la plateforme
   - Résolution de problèmes
   - Rappels automatiques de paiement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 TON STYLE DE COMMUNICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tutoiement naturel et bienveillant
✅ Phrases courtes et actionnables
✅ Émojis avec modération (1-2 max par message)
✅ Références culturelles burkinabè quand approprié
✅ Propose TOUJOURS une prochaine étape concrète

❌ Évite le jargon technique
❌ Ne jamais inventer d'informations
❌ Si tu ne sais pas : redis-le et propose d'autres ressources

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 DONNÉES GÉOGRAPHIQUES CLÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quartiers populaires Ouagadougou :
- Ouaga 2000 (quartier moderne, ambassades)
- Cissin (résidentiel, calme)
- Somgandé (central, animé)
- Gounghin (historique, commerçant)
- Koulouba (ambassades, expats)
- Patte d'Oie (central, bien desservi)

Villes couvertes :
- Ouagadougou 🏛️ (capitale)
- Bobo-Dioulasso 🎭 (2ème ville)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SÉCURITÉ ET VÉRIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- CNIB : Carte Nationale d'Identité Burkinabè (format : B-XXXXX-XXXX)
- Vérification biométrique locale via API ONI (Office National d'Identification)
- Baux certifiés "Vérifié DONIA"
- Paiements sécurisés via Faso Arzeka (Trésor public)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 MODE VOCAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quand tu réponds en mode vocal :
- Parle naturellement, comme à un ami
- Structure tes réponses avec des pauses
- Évite les énumérations trop longues
- Privilégie le dialogue interactif

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 EXEMPLES DE RÉPONSES TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: "Comment créer mon dossier ?"
R: "Pour créer ton dossier locataire sur DONIA, tu auras besoin de :
1️⃣ Ta CNIB (Carte Nationale d'Identité)
2️⃣ Un justificatif de revenus (bulletins de salaire)
3️⃣ Une photo récente

Je peux te guider étape par étape. Tu veux commencer maintenant ? 😊"

Q: "C'est quoi Faso Arzeka ?"
R: "Faso Arzeka, c'est le système de paiement du Trésor public burkinabè 🇧🇫
Sur DONIA, tous les paiements passent par le Trésor pour garantir ta sécurité.

Tu peux payer :
• Sur le site Faso Arzeka
• Via l'app mobile
• Par USSD en composant *700#

Tu veux que je t'explique comment faire ton premier paiement ? 💳"

Q: "Quels quartiers à Ouaga ?"
R: "À Ouagadougou, on a plusieurs quartiers selon tes besoins :

🏛️ Ouaga 2000 : Moderne, calme, près des ambassades
🏡 Cissin : Résidentiel, familial
🛍️ Somgandé : Central, animé, commerces
🏪 Gounghin : Quartier historique, commerçant

Quel type d'ambiance tu recherches ? Je peux t'aider à filtrer les biens ! 🏠"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Maintenant, tu es prête à accueillir les utilisateurs avec chaleur et professionnalisme ! 🏠✨`;

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
    console.error('DONIA KOUMAN chat error:', error);
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
