import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { propertyId, propertyType, city, neighborhood } = await req.json();

    if (!propertyId || !propertyType || !city) {
      throw new Error("Missing required fields");
    }

    // Descriptions contextuelles par ville
    const getContextualPrompt = (propertyType: string, city: string, neighborhood?: string): string => {
      const architectureStyles: Record<string, string> = {
        'Ouagadougou': 'modern Burkinabè architecture with red clay walls and metal roofing, contemporary design mixed with traditional sahel elements',
        'Bobo-Dioulasso': 'colonial-era architecture blended with modern renovations, distinctive ochre-colored buildings with wide verandas',
        'Koudougou': 'sahel-style residential buildings with earthen walls and functional design, surrounded by acacia trees',
        'Ouahigouya': 'traditional Mossi architecture with modern touches, fortified compound walls, characteristic of northern Burkina',
        'Banfora': 'tropical architecture adapted to savanna climate, buildings with large shaded areas, near natural landscapes'
      };

      const typeDescriptions: Record<string, string> = {
        'appartement': 'apartment building with multiple floors and balconies, typical of urban Burkina Faso',
        'apartment': 'apartment building with multiple floors and balconies, typical of urban Burkina Faso',
        'villa': 'standalone villa with compound walls and private courtyard',
        'studio': 'modern studio complex with secure access',
        'duplex': 'two-story duplex residence with external staircase',
        'maison': 'family house with large front yard and mango trees',
        'house': 'family house with large front yard and mango trees'
      };

      const contextDetails = [
        'red laterite soil visible in surroundings',
        'characteristic Burkinabè green taxis passing by',
        'traditional market stalls in the background',
        'acacia and mango trees providing shade',
        'metal gates painted in bright colors',
        'solar panels on some roofs',
        'concrete walls with decorative patterns',
        'wide dusty streets typical of Sahel cities'
      ];

      const randomDetails = contextDetails.sort(() => 0.5 - Math.random()).slice(0, 3).join(', ');
      
      const architectureStyle = architectureStyles[city] || architectureStyles['Ouagadougou'];
      const typeDesc = typeDescriptions[propertyType] || 'residential property';
      const locationDesc = neighborhood ? `${neighborhood}, ${city}` : city;

      return `Professional real estate photograph of a ${typeDesc} in ${locationDesc}, Burkina Faso. Architecture: ${architectureStyle}. Setting: ${randomDetails}. Lighting: bright West African sunlight, clear blue sky typical of Sahel climate. Style: modern real estate photography, welcoming and authentic, showing true Burkinabè urban life. Quality: ultra high resolution, 16:9 aspect ratio, professional composition. IMPORTANT: Show REAL Burkinabè architectural elements - red clay, metal roofing, compound walls, not European-style buildings.`;
    };

    const imagePrompt = getContextualPrompt(propertyType, city, neighborhood);
    console.log("Generating image for property", propertyId, "with prompt:", imagePrompt);

    // Générer l'image avec Lovable AI
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Image generation failed:", errorText);
      
      if (imageResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (imageResponse.status === 402) {
        throw new Error("Payment required. Please add credits to your Lovable AI workspace.");
      }
      
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      throw new Error('No image generated from AI');
    }

    // Convertir base64 en Uint8Array
    const base64Data = base64Image.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload vers Supabase Storage
    const fileName = `property-${propertyId}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    // Mettre à jour la propriété
    const { error: updateError } = await supabase
      .from('properties')
      .update({ main_image: urlData.publicUrl })
      .eq('id', propertyId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update property: ${updateError.message}`);
    }

    console.log("Image generated successfully for property", propertyId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: urlData.publicUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in generate-property-images:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
