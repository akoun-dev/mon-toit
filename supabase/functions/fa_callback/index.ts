// MZAKA-BF Faso Arzeka Payment Callback
// Webhook appelé par Faso Arzeka lors du changement de statut

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

    const payload = await req.json();
    const { reference, status, signature, amount, metadata } = payload;

    console.log('📥 FA callback received:', { reference, status });

    // TODO: Vérifier signature HMAC/RSA
    // const FA_PARTNER_SECRET = Deno.env.get('FA_PARTNER_SECRET');
    // const isValidSignature = verifySignature(payload, signature, FA_PARTNER_SECRET);
    const isValidSignature = true; // Mock pour développement

    // Logger le callback
    const { error: logError } = await supabase
      .from('fa_callbacks')
      .insert({
        reference,
        raw_payload: payload,
        status_after: status,
        signature_ok: isValidSignature,
        processed: false
      });

    if (logError) {
      console.error('Callback logging error:', logError);
    }

    if (!isValidSignature) {
      console.error('❌ Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 403,
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
      return new Response(JSON.stringify({ error: 'Payment intent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('payment_intents_fa')
      .update({
        status: status.toLowerCase(),
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        metadata: { ...intent.metadata, fa_response: metadata }
      })
      .eq('id', intent.id);

    if (updateError) {
      console.error('Intent update error:', updateError);
    }

    // Mettre à jour payments (table existante)
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: status === 'paid' ? 'completed' : 'failed',
        completed_at: status === 'paid' ? new Date().toISOString() : null
      })
      .eq('transaction_id', reference);

    if (paymentUpdateError) {
      console.error('Payment update error:', paymentUpdateError);
    }

    // Si paiement validé, déclencher actions
    if (status === 'paid') {
      console.log('💰 Payment confirmed:', reference);

      // Si BAIL_FEE, générer PDF bail + signature
      if (intent.purpose === 'BAIL_FEE' && intent.contract_id) {
        console.log('📄 Generating lease contract...');
        
        // TODO: Appeler generate-lease-pdf
        // await supabase.functions.invoke('generate-lease-pdf', {
        //   body: { contract_id: intent.contract_id }
        // });

        // TODO: Créer entry pour signature
        // await supabase.functions.invoke('sign_document', {
        //   body: { 
        //     contract_id: intent.contract_id,
        //     signer_id: intent.user_id,
        //     method: 'otp'
        //   }
        // });
      }

      // Si RECEIPT_*, générer quittance
      if (intent.purpose.includes('RECEIPT')) {
        console.log('🧾 Generating receipt...');
        
        // Créer receipt
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            payment_id: intent.id,
            contract_id: intent.contract_id,
            month_year: new Date().toISOString().slice(0, 7), // YYYY-MM
            amount_cfa: intent.amount_cfa,
            qr_id: `QR-${reference}`
          })
          .select()
          .single();

        if (receiptError) {
          console.error('Receipt creation error:', receiptError);
        } else {
          console.log('✅ Receipt created:', receiptData.id);
        }
      }

      // Marquer le callback comme traité
      await supabase
        .from('fa_callbacks')
        .update({ processed: true })
        .eq('reference', reference);
    }

    return new Response(JSON.stringify({
      success: true,
      reference,
      status: status.toLowerCase(),
      processed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ fa_callback error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
