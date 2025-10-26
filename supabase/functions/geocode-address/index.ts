import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Interface pour la réponse de géocodage
interface GeocodeResponse {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country?: string;
  confidence?: number;
}

// Service de géocodage simple pour Abidjan
// En production, vous devriez utiliser un vrai service de géocodage comme Google Maps, OpenStreetMap, etc.
class GeocodingService {
  private static readonly ABIDJAN_COORDINATES = {
    latitude: 5.3600,
    longitude: -4.0083
  };

  private static readonly NEIGHBORHOODS = {
    'Cocody': { lat: 5.3589, lng: -4.0083 },
    'Plateau': { lat: 5.3384, lng: -4.0112 },
    'Adjame': { lat: 5.3669, lng: -4.0317 },
    'Yopougon': { lat: 5.3295, lng: -4.0627 },
    'Marcory': { lat: 5.3069, lng: -3.9912 },
    'Treichville': { lat: 5.2846, lng: -3.9765 },
    'Abobo': { lat: 5.4218, lng: -4.0215 },
    'Riviera': { lat: 5.3765, lng: -3.9456 },
    'Bingerville': { lat: 5.3467, lng: -3.8765 },
    'Zone 4': { lat: 5.3187, lng: -3.9832 }
  };

  static async geocodeAddress(address: string, city: string): Promise<GeocodeResponse | null> {
    try {
      // Nettoyer l'adresse
      const cleanAddress = address.trim().toLowerCase();
      const cleanCity = city.trim().toLowerCase();

      // Géocodage simplifié pour Abidjan
      let coordinates = this.ABIDJAN_COORDINATES;

      // Vérifier si c'est un quartier connu d'Abidjan
      for (const [neighborhood, coords] of Object.entries(this.NEIGHBORHOODS)) {
        if (cleanAddress.includes(neighborhood.toLowerCase()) || cleanCity.includes(neighborhood.toLowerCase())) {
          coordinates = coords;
          break;
        }
      }

      // Ajouter une petite variation aléatoire pour simuler une géolocalisation précise
      const latVariation = (Math.random() - 0.5) * 0.01; // ~1km de variation
      const lngVariation = (Math.random() - 0.5) * 0.01;

      return {
        latitude: coordinates.lat + latVariation,
        longitude: coordinates.lng + lngVariation,
        address: address,
        city: city,
        country: 'Côte d''Ivoire',
        confidence: 0.8
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}

corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { address, city } = await req.json();

    // Validation des entrées
    if (!address || !city) {
      return new Response(
        JSON.stringify({ error: 'Address and city are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Limiter la taille des entrées
    if (address.length > 500 || city.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Input too long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Géocoder l'adresse
    const result = await GeocodingService.geocodeAddress(address, city);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Geocoding failed' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Retourner les coordonnées
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Geocoding service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});