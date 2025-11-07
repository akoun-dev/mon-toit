// MZAKA-BF Faso Arzeka Payment Initialization
// Crée un payment intent et retourne les infos de paiement

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

    // Récupérer auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { contract_id, purpose, amount_cfa, channel = 'web' } = await req.json();

    if (!purpose || !amount_cfa) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Générer référence unique
    const { data: refData, error: refError } = await supabase
      .rpc('generate_fa_reference');
    
    if (refError) {
      console.error('Reference generation error:', refError);
      return new Response(JSON.stringify({ error: 'Failed to generate reference' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const reference = refData as string;

    // Créer payment_intents_fa
    const { data: intentData, error: intentError } = await supabase
      .from('payment_intents_fa')
      .insert({
        user_id: user.id,
        contract_id,
        purpose,
        reference,
        amount_cfa: parseInt(amount_cfa),
        channel,
        status: 'created',
        redirect_url: `${Deno.env.get('FA_REDIRECT_BASE') || 'https://app.mzaka.bf/pay/fa'}/pending/${reference}`,
        metadata: { created_via: 'fa_init' }
      })
      .select()
      .single();

    if (intentError) {
      console.error('Intent creation error:', intentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment intent' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Créer entry dans payments (compatible avec existant)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        payer_id: user.id,
        receiver_id: user.id, // TODO: set to property owner
        property_id: contract_id, // TODO: récupérer property_id depuis contract
        amount: amount_cfa,
        payment_type: purpose === 'BAIL_FEE' ? 'loyer' : 'autre',
        payment_method: 'faso_arzeka',
        status: 'pending',
        transaction_id: reference
      });

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      // Continue même si payments échoue (pour compatibilité)
    }

    // TODO: Intégrer vraie API Faso Arzeka ici
    // const FA_PARTNER_ID = Deno.env.get('FA_PARTNER_ID');
    // const FA_PARTNER_SECRET = Deno.env.get('FA_PARTNER_SECRET');
    // const faResponse = await fetch('https://api.fasoarzeka.bf/v1/payments/init', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${FA_PARTNER_SECRET}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     partner_id: FA_PARTNER_ID,
    //     reference,
    //     amount: amount_cfa,
    //     currency: 'XOF',
    //     callback_url: `${supabaseUrl}/functions/v1/fa_callback`,
    //     return_url: intentData.redirect_url
    //   })
    // });

    console.log('✅ Payment intent created:', {
      reference,
      amount_cfa,
      purpose,
      user_id: user.id
    });

    return new Response(JSON.stringify({
      success: true,
      reference,
      redirect_url: intentData.redirect_url,
      ussd_code: '*700#',
      amount_cfa,
      channel,
      instructions: {
        app: 'Ouvrez l\'application Faso Arzeka et entrez la référence',
        web: 'Vous allez être redirigé vers le portail de paiement Faso Arzeka',
        ussd: `Composez *700# et suivez les instructions. Référence: ${reference}`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ fa_init error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
