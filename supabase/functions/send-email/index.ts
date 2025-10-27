import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Vérifier que c'est une requête POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parser le corps de la requête
    const body = await req.json();
    const { to, subject, html, text, from, replyTo } = body;

    // Valider les données requises
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Configuration SMTP depuis les variables d'environnement
    // Essayer d'abord les variables d'environnement de la fonction
    let smtpHost = Deno.env.get('SMTP_HOST');
    let smtpPort = Deno.env.get('SMTP_PORT');
    let smtpSecure = Deno.env.get('SMTP_SECURE');
    let smtpUser = Deno.env.get('SMTP_USER');
    let smtpPassword = Deno.env.get('SMTP_PASSWORD');
    let smtpFrom = from || Deno.env.get('SMTP_FROM_EMAIL');

    // Si les variables ne sont pas définies, utiliser les valeurs par défaut pour le développement
    if (!smtpHost) smtpHost = 'smtp.gmail.com';
    if (!smtpPort) smtpPort = '587';
    if (!smtpSecure) smtpSecure = 'false';
    if (!smtpUser) smtpUser = 'aboa.akoun40@gmail.com';
    if (!smtpPassword) smtpPassword = 'qnvyzoafqxfmkjnt';
    if (!smtpFrom) smtpFrom = smtpUser;

    // Debug: Afficher les variables d'environnement (sans les mots de passe)
    console.log('SMTP Configuration:', {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser: smtpUser ? 'configured' : 'missing',
      smtpPassword: smtpPassword ? 'configured' : 'missing',
      smtpFrom
    });

    if (!smtpUser || !smtpPassword) {
      console.error('SMTP credentials not configured:', {
        smtpUser: !!smtpUser,
        smtpPassword: !!smtpPassword
      });
      
      return new Response(JSON.stringify({ error: 'SMTP credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Créer le message email
    const emailData = {
      from: smtpFrom,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html || text,
      text: text || html,
      replyTo: replyTo || smtpFrom
    };

    // Envoyer l'email via l'API Resend (plus simple que SMTP direct)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: smtpFrom,
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          html: html || text,
          text: text || html,
          replyTo: replyTo || smtpFrom
        })
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error('Resend API error:', errorData);
        return new Response(JSON.stringify({ 
          error: `Resend API error: ${resendResponse.status} ${resendResponse.statusText}`,
          details: errorData
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await resendResponse.json();
      console.log('Email sent successfully via Resend:', result);

      return new Response(JSON.stringify({ 
        success: true, 
        messageId: result.id 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Si Resend n'est pas configuré, utiliser une réponse simulée pour le développement
    console.log('Email would be sent (simulated):', emailData);
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: `simulated-${Date.now()}`,
      message: 'Email simulated (Resend API key not configured)'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});