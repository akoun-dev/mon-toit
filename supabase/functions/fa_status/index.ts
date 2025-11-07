// MZAKA-BF Faso Arzeka Payment Status Check
// Permet au client de vérifier le statut d'un paiement

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optionnel: vérifier auth user
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.error('Auth error:', userError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const { reference } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Reference required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Récupérer le payment intent
    const { data: intent, error: intentError } = await supabase
      .from('payment_intents_fa')
      .select('*')
      .eq('reference', reference)
      .single();

    if (intentError || !intent) {
      console.error('Intent not found:', reference);
      return new Response(JSON.stringify({ 
        error: 'Payment intent not found',
        reference 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Vérifier si expiré
    const isExpired = new Date(intent.expires_at) < new Date();
    const currentStatus = isExpired && intent.status === 'created' ? 'expired' : intent.status;

    // Si expiré, mettre à jour
    if (isExpired && intent.status !== 'paid') {
      await supabase
        .from('payment_intents_fa')
        .update({ status: 'expired' })
        .eq('id', intent.id);
    }

    console.log('🔍 Status check:', { reference, status: currentStatus });

    return new Response(JSON.stringify({
      reference,
      status: currentStatus,
      amount_cfa: intent.amount_cfa,
      purpose: intent.purpose,
      channel: intent.channel,
      created_at: intent.created_at,
      paid_at: intent.paid_at,
      expires_at: intent.expires_at,
      redirect_url: intent.redirect_url,
      metadata: intent.metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ fa_status error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
