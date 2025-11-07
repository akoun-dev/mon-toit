import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadDocumentRequest {
  action: 'upload_document';
  cni_photo_url: string;
  user_id: string;
}

interface CheckStatusRequest {
  action: 'check_status';
  document_id: string;
}

interface LocalVerificationRequest {
  action: 'local_verification';
  cni_photo_url: string;
  selfie_base64: string;
  user_id: string;
}

type NeoFaceRequest = UploadDocumentRequest | CheckStatusRequest | LocalVerificationRequest;

interface NeoFaceUploadResponse {
  success: boolean;
  document_id?: string;
  selfie_url?: string;
  message?: string;
}

interface NeoFaceStatusResponse {
  status: 'waiting' | 'verified' | 'failed';
  matching_score?: number;
  message?: string;
}

const NEOFACE_BASE_URL = 'https://neoface.aineo.ai/api/v2';
const REQUEST_TIMEOUT = 30000; // 30 secondes
const MAX_RETRIES = 2;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 NeoFace verification request started');

  try {
    // ========================================
    // 1. Authentication
    // ========================================
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      throw new Error('Non authentifié');
    }

    console.log('✅ User authenticated:', user.id);

    // ========================================
    // 2. Parse request
    // ========================================
    const requestData: NeoFaceRequest = await req.json();
    const { action } = requestData;

    console.log('📋 Action requested:', action);

    // Get NeoFace API token
    const NEOFACE_API_TOKEN = Deno.env.get('NEOFACE_API_TOKEN');
    if (!NEOFACE_API_TOKEN) {
      console.error('❌ NEOFACE_API_TOKEN not configured');
      throw new Error('Configuration serveur manquante');
    }

    // ========================================
    // ACTION 1: Upload Document
    // ========================================
    if (action === 'upload_document') {
      const { cni_photo_url, user_id } = requestData as UploadDocumentRequest;

      console.log('📤 Uploading document to NeoFace...', { 
        user_id, 
        cni_photo_url: cni_photo_url.substring(0, 50) + '...' 
      });

      // Validate inputs
      if (!cni_photo_url || !user_id) {
        throw new Error('Paramètres manquants: cni_photo_url et user_id requis');
      }

      // Download image from URL
      console.log('⬇️ Downloading CNIB image...');
      const imageResponse = await fetch(cni_photo_url);
      if (!imageResponse.ok) {
        throw new Error('Impossible de télécharger l\'image CNIB');
      }

      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(imageBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      console.log('✅ Image downloaded and converted to base64');

      // Call NeoFace API with retry
      let uploadResponse: NeoFaceUploadResponse | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} to call NeoFace API...`);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const neoFaceResponse = await fetch(`${NEOFACE_BASE_URL}/document_capture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              document_image: base64Image,
              user_id: user_id,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const responseText = await neoFaceResponse.text();
          console.log('📨 NeoFace raw response:', responseText.substring(0, 200));

          if (!neoFaceResponse.ok) {
            throw new Error(`NeoFace API error: ${neoFaceResponse.status} - ${responseText}`);
          }

          const neoFaceData = JSON.parse(responseText);

          if (!neoFaceData.document_id || !neoFaceData.selfie_url) {
            throw new Error('Réponse NeoFace invalide: document_id ou selfie_url manquant');
          }

          uploadResponse = {
            success: true,
            document_id: neoFaceData.document_id,
            selfie_url: neoFaceData.selfie_url,
          };

          console.log('✅ NeoFace upload successful:', {
            document_id: neoFaceData.document_id,
            selfie_url: neoFaceData.selfie_url.substring(0, 50) + '...',
          });

          break; // Success, exit retry loop

        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Attempt ${attempt} failed:`, error);

          if (attempt < MAX_RETRIES) {
            const backoffDelay = 1000 * attempt; // Exponential backoff
            console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      if (!uploadResponse) {
        throw new Error(`Échec après ${MAX_RETRIES} tentatives: ${lastError?.message}`);
      }

      // Store document_id in user_verifications
      const { error: updateError } = await supabaseClient
        .from('user_verifications')
        .upsert({
          user_id: user_id,
          neoface_document_id: uploadResponse.document_id,
          neoface_status: 'waiting',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('⚠️ Failed to update user_verifications:', updateError);
      } else {
        console.log('✅ user_verifications updated with document_id');
      }

      const duration = Date.now() - startTime;
      console.log(`✨ Upload completed in ${duration}ms`);

      return new Response(
        JSON.stringify(uploadResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ========================================
    // ACTION 2: Check Status
    // ========================================
    if (action === 'check_status') {
      const { document_id } = requestData as CheckStatusRequest;

      console.log('🔍 Checking status for document:', document_id);

      // Validate input
      if (!document_id) {
        throw new Error('Paramètre manquant: document_id requis');
      }

      // Call NeoFace API with retry
      let statusResponse: NeoFaceStatusResponse | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} to check status...`);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const neoFaceResponse = await fetch(
            `${NEOFACE_BASE_URL}/match_verify?document_id=${encodeURIComponent(document_id)}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          const responseText = await neoFaceResponse.text();
          console.log('📨 NeoFace status response:', responseText.substring(0, 200));

          if (!neoFaceResponse.ok) {
            throw new Error(`NeoFace API error: ${neoFaceResponse.status} - ${responseText}`);
          }

          const neoFaceData = JSON.parse(responseText);

          statusResponse = {
            status: neoFaceData.status || 'waiting',
            matching_score: neoFaceData.matching_score,
            message: neoFaceData.message,
          };

          console.log('✅ Status retrieved:', statusResponse);

          // If verified, update database
          if (statusResponse.status === 'verified') {
            console.log('🎉 Verification successful! Updating database...');

            // Update user_verifications
            const { error: verificationError } = await supabaseClient
              .from('user_verifications')
              .update({
                face_verification_status: 'verified',
                face_similarity_score: statusResponse.matching_score,
                face_verified_at: new Date().toISOString(),
                neoface_status: 'verified',
                neoface_matching_score: statusResponse.matching_score,
                updated_at: new Date().toISOString(),
              })
              .eq('neoface_document_id', document_id);

            if (verificationError) {
              console.error('⚠️ Failed to update user_verifications:', verificationError);
            }

            // Update profile
            const { error: profileError } = await supabaseClient
              .from('profiles')
              .update({
                face_verified: true,
                cnib_verified: true, // CNIB aussi vérifié via NeoFace
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            if (profileError) {
              console.error('⚠️ Failed to update profile:', profileError);
            } else {
              console.log('✅ Profile updated: face_verified and cnib_verified set to true');
            }

            // Optionally send success email
            try {
              await supabaseClient.functions.invoke('send-email', {
                body: {
                  to: user.email,
                  subject: '🎉 Certification DONIA réussie !',
                  template: 'verification_success',
                  data: {
                    matching_score: statusResponse.matching_score,
                  },
                },
              });
              console.log('📧 Success email sent');
            } catch (emailError) {
              console.error('⚠️ Failed to send email:', emailError);
            }
          }

          break; // Success, exit retry loop

        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Attempt ${attempt} failed:`, error);

          if (attempt < MAX_RETRIES) {
            const backoffDelay = 1000 * attempt;
            console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      if (!statusResponse) {
        throw new Error(`Échec après ${MAX_RETRIES} tentatives: ${lastError?.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✨ Status check completed in ${duration}ms`);

      return new Response(
        JSON.stringify(statusResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ========================================
    // ACTION 3: Local Verification
    // ========================================
    if (action === 'local_verification') {
      const { cni_photo_url, selfie_base64, user_id } = requestData as LocalVerificationRequest;

      console.log('🎯 Local verification with browser camera...', { user_id });

      // Validate inputs
      if (!cni_photo_url || !selfie_base64 || !user_id) {
        throw new Error('Paramètres manquants: cni_photo_url, selfie_base64 et user_id requis');
      }

      // Download CNIB image
      console.log('⬇️ Downloading CNIB image...');
      const cniResponse = await fetch(cni_photo_url);
      if (!cniResponse.ok) {
        throw new Error('Impossible de télécharger l\'image CNIB');
      }

      const cniBlob = await cniResponse.blob();
      const cniBuffer = await cniBlob.arrayBuffer();
      const cniBase64 = btoa(
        new Uint8Array(cniBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      console.log('✅ CNIB image downloaded and converted to base64');

      // Upload selfie to Storage for persistence
      console.log('📤 Uploading selfie to Storage...');
      const selfieBlob = await fetch(selfie_base64).then(r => r.blob());
      
      const { data: selfieStorageData, error: selfieStorageError } = await supabaseClient.storage
        .from('verification-documents')
        .upload(`${user_id}/selfie-${Date.now()}.jpg`, selfieBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (selfieStorageError) {
        console.error('⚠️ Failed to upload selfie to storage:', selfieStorageError);
      } else {
        console.log('✅ Selfie uploaded to storage');
      }

      // Convert selfie to base64 (remove data:image prefix if present)
      const selfieBase64Clean = selfie_base64.includes('base64,') 
        ? selfie_base64.split('base64,')[1] 
        : selfie_base64;

      // Step 1: Upload CNIB document to NeoFace
      console.log('📤 Uploading CNIB to NeoFace...');
      
      let documentId: string | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const neoFaceUploadResponse = await fetch(`${NEOFACE_BASE_URL}/document_capture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              document_image: cniBase64,
              user_id: user_id,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const uploadText = await neoFaceUploadResponse.text();

          if (!neoFaceUploadResponse.ok) {
            throw new Error(`NeoFace upload error: ${neoFaceUploadResponse.status} - ${uploadText}`);
          }

          const uploadData = JSON.parse(uploadText);
          documentId = uploadData.document_id;
          console.log('✅ CNIB uploaded to NeoFace:', documentId);
          break;

        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Upload attempt ${attempt} failed:`, error);

          if (attempt < MAX_RETRIES) {
            const backoffDelay = 1000 * attempt;
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      if (!documentId) {
        throw new Error(`Échec upload CNIB après ${MAX_RETRIES} tentatives: ${lastError?.message}`);
      }

      // Step 2: Upload selfie to NeoFace using the document_id
      console.log('📤 Uploading selfie to NeoFace...');
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          // Note: NeoFace API might need a different endpoint for selfie upload
          // This is a placeholder - adjust based on actual NeoFace API documentation
          const neoFaceSelfieResponse = await fetch(`${NEOFACE_BASE_URL}/selfie_capture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              document_id: documentId,
              selfie_image: selfieBase64Clean,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const selfieText = await neoFaceSelfieResponse.text();

          if (!neoFaceSelfieResponse.ok) {
            throw new Error(`NeoFace selfie error: ${neoFaceSelfieResponse.status} - ${selfieText}`);
          }

          console.log('✅ Selfie uploaded to NeoFace');
          break;

        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Selfie upload attempt ${attempt} failed:`, error);

          if (attempt < MAX_RETRIES) {
            const backoffDelay = 1000 * attempt;
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      // Step 3: Immediately check verification status
      console.log('🔍 Checking verification status...');
      
      let verificationResult: NeoFaceStatusResponse | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const neoFaceStatusResponse = await fetch(
            `${NEOFACE_BASE_URL}/match_verify?document_id=${encodeURIComponent(documentId)}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          const statusText = await neoFaceStatusResponse.text();

          if (!neoFaceStatusResponse.ok) {
            throw new Error(`NeoFace status error: ${neoFaceStatusResponse.status} - ${statusText}`);
          }

          const statusData = JSON.parse(statusText);
          verificationResult = {
            status: statusData.status || 'waiting',
            matching_score: statusData.matching_score,
            message: statusData.message,
          };

          console.log('✅ Verification status:', verificationResult);
          break;

        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Status check attempt ${attempt} failed:`, error);

          if (attempt < MAX_RETRIES) {
            const backoffDelay = 1000 * attempt;
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      if (!verificationResult) {
        throw new Error(`Échec vérification après ${MAX_RETRIES} tentatives: ${lastError?.message}`);
      }

      // Update database based on result
      if (verificationResult.status === 'verified') {
        console.log('🎉 Local verification successful! Updating database...');

        await supabaseClient
          .from('user_verifications')
          .upsert({
            user_id: user_id,
            face_verification_status: 'verified',
            face_similarity_score: verificationResult.matching_score,
            face_verified_at: new Date().toISOString(),
            neoface_status: 'verified',
            neoface_matching_score: verificationResult.matching_score,
            neoface_document_id: documentId,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        await supabaseClient
          .from('profiles')
          .update({
            face_verified: true,
            cnib_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user_id);

        console.log('✅ Database updated');

        // Send success email
        try {
          await supabaseClient.functions.invoke('send-email', {
            body: {
              to: user.email,
              subject: '🎉 Certification DONIA réussie !',
              template: 'verification_success',
              data: {
                matching_score: verificationResult.matching_score,
              },
            },
          });
        } catch (emailError) {
          console.error('⚠️ Failed to send email:', emailError);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✨ Local verification completed in ${duration}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          verified: verificationResult.status === 'verified',
          matching_score: verificationResult.matching_score || 0,
          message: verificationResult.message || (verificationResult.status === 'verified' ? 'Vérification réussie' : 'Vérification échouée'),
          status: verificationResult.status,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ========================================
    // Invalid action
    // ========================================
    throw new Error(`Action invalide: ${action}`);

  } catch (error) {
    console.error('❌ Error in neoface-verification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    const duration = Date.now() - startTime;
    console.log(`💥 Request failed after ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
