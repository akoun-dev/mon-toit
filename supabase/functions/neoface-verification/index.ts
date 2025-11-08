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

interface UploadSelfieRequest {
  action: 'upload_selfie';
  document_id: string;
  selfie_photo_url: string;
}

interface CheckStatusRequest {
  action: 'check_status';
  document_id: string;
}

type NeoFaceRequest = UploadDocumentRequest | UploadSelfieRequest | CheckStatusRequest;

interface NeoFaceUploadResponse {
  success: boolean;
  document_id?: string;
  url?: string; // NeoFace retourne "url" pas "selfie_url"
  message?: string;
}

interface NeoFaceStatusResponse {
  status: 'waiting' | 'verified' | 'failed';
  matching_score?: number;
  verified_at?: string;
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
      
      console.log('✅ Image downloaded', {
        type: imageBlob.type,
        size: imageBlob.size,
        size_mb: (imageBlob.size / (1024 * 1024)).toFixed(2)
      });

      // Call NeoFace API with retry
      let uploadResponse: NeoFaceUploadResponse | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} to call NeoFace API...`);

        try {
          // Créer FormData avec token + fichier
          const formData = new FormData();
          formData.append('token', NEOFACE_API_TOKEN);
          formData.append('doc_file', imageBlob, 'document.jpg');
          
          console.log('📦 FormData créé:', {
            token_length: NEOFACE_API_TOKEN.length,
            file_type: imageBlob.type,
            file_size: imageBlob.size
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const neoFaceResponse = await fetch(`${NEOFACE_BASE_URL}/document_capture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              // PAS de Content-Type ! FormData le gère automatiquement
            },
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const responseText = await neoFaceResponse.text();
          console.log('📨 NeoFace document_capture response:', {
            status: neoFaceResponse.status,
            body_preview: responseText.substring(0, 200)
          });

          if (!neoFaceResponse.ok) {
            throw new Error(`NeoFace API error: ${neoFaceResponse.status} - ${responseText}`);
          }

          const neoFaceData = JSON.parse(responseText);

          if (!neoFaceData.document_id || !neoFaceData.url) {
            throw new Error('Réponse NeoFace invalide: document_id ou url manquant');
          }

          uploadResponse = {
            success: true,
            document_id: neoFaceData.document_id,
            url: neoFaceData.url, // NeoFace retourne "url" pas "selfie_url"
          };

          console.log('✅ NeoFace upload successful:', {
            document_id: neoFaceData.document_id,
            url_preview: neoFaceData.url?.substring(0, 60) + '...',
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
    // ACTION 2: Upload Selfie
    // ========================================
    if (action === 'upload_selfie') {
      const { document_id, selfie_photo_url } = requestData as UploadSelfieRequest;

      console.log('📤 Uploading selfie to NeoFace...', { 
        document_id, 
        selfie_photo_url: selfie_photo_url.substring(0, 50) + '...' 
      });

      // Validate inputs
      if (!document_id || !selfie_photo_url) {
        throw new Error('Paramètres manquants: document_id et selfie_photo_url requis');
      }

      // Download selfie from URL
      console.log('⬇️ Downloading selfie image...');
      const selfieResponse = await fetch(selfie_photo_url);
      if (!selfieResponse.ok) {
        throw new Error('Impossible de télécharger l\'image selfie');
      }

      const selfieBlob = await selfieResponse.blob();
      
      console.log('✅ Selfie downloaded', {
        type: selfieBlob.type,
        size: selfieBlob.size,
        size_mb: (selfieBlob.size / (1024 * 1024)).toFixed(2)
      });

      // Call NeoFace API with retry
      let uploadResponse: { success: boolean } | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} to upload selfie to NeoFace...`);

        try {
          const formData = new FormData();
          formData.append('token', NEOFACE_API_TOKEN);
          formData.append('document_id', document_id);
          formData.append('selfie_file', selfieBlob, 'selfie.jpg');
          
          console.log('📦 FormData créé pour selfie:', {
            document_id,
            file_type: selfieBlob.type,
            file_size: selfieBlob.size
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          // Construire l'URL directement sans /v2
          const neoFaceSelfieUrl = `https://neoface.aineo.ai/api/selfie_facematch/${document_id}`;
          
          const neoFaceResponse = await fetch(neoFaceSelfieUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
            },
            body: formData,
            signal: controller.signal,
          });

          console.log('🌐 Called NeoFace URL:', neoFaceSelfieUrl);

          clearTimeout(timeoutId);

          const responseText = await neoFaceResponse.text();
          console.log('📨 NeoFace selfie_upload response:', {
            status: neoFaceResponse.status,
            body_preview: responseText.substring(0, 200)
          });

          if (!neoFaceResponse.ok) {
            throw new Error(`NeoFace API error: ${neoFaceResponse.status} - ${responseText}`);
          }

          uploadResponse = { success: true };

          console.log('✅ NeoFace selfie upload successful');
          break;

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

      if (!uploadResponse) {
        throw new Error(`Échec après ${MAX_RETRIES} tentatives: ${lastError?.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✨ Selfie upload completed in ${duration}ms`);

      return new Response(
        JSON.stringify(uploadResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ========================================
    // ACTION 3: Check Status
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

          const neoFaceResponse = await fetch(`${NEOFACE_BASE_URL}/match_verify`, {
            method: 'POST', // POST au lieu de GET
            headers: {
              'Authorization': `Bearer ${NEOFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: NEOFACE_API_TOKEN, // Ajouter token dans le body
              document_id: document_id,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const responseText = await neoFaceResponse.text();
          const neoFaceData = JSON.parse(responseText);
          
          console.log('📨 NeoFace match_verify response:', {
            http_status: neoFaceResponse.status,
            data_status: neoFaceData.status,
            message: neoFaceData.message
          });

          // Gérer les différents codes de statut selon la spec API
          // Status 200 = verified
          if (neoFaceResponse.status === 200 && neoFaceData.status === 'verified') {
            statusResponse = {
              status: 'verified',
              matching_score: neoFaceData.matching_score,
              verified_at: neoFaceData.verified_at,
              message: neoFaceData.message,
            };
            console.log('✅ Verification successful:', statusResponse);
          }
          // Status 201 = waiting
          else if (neoFaceResponse.status === 201 && neoFaceData.status === 'waiting') {
            statusResponse = {
              status: 'waiting',
              message: neoFaceData.message || 'En attente de selfie',
            };
            console.log('⏳ Still waiting:', statusResponse);
          }
          // Status 400 = failed
          else if (neoFaceResponse.status === 400 && neoFaceData.status === 'failed') {
            statusResponse = {
              status: 'failed',
              matching_score: neoFaceData.matching_score,
              message: neoFaceData.message || 'Vérification échouée',
            };
            console.log('❌ Verification failed:', statusResponse);
          }
          // Cas inattendu
          else {
            throw new Error(`NeoFace API unexpected response: ${neoFaceResponse.status} - ${responseText}`);
          }

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
