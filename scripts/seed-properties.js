#!/usr/bin/env node

/**
 * Script de seed pour créer des propriétés de test pour Mon Toit
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY est requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Données de test pour les propriétés
const properties = [
  {
    title: "Appartement F3 moderne à Cocody",
    description: "Bel appartement de 3 pièces entièrement rénové, climatisé, avec balcon et vue sur la ville. Situé dans un quartier résidentiel calme à proximité des commerces et écoles.",
    type: "appartement",
    category: "location",
    address_line1: "Rue des Jardins, Cocody",
    neighborhood: "Cocody",
    city: "Abidjan",
    latitude: 5.35995,
    longitude: -3.98901,
    surface: 85,
    rooms_count: 3,
    bedrooms_count: 2,
    bathrooms_count: 1,
    floor_level: 3,
    total_floors: 4,
    price: 250000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 250000,
    furnished: true,
    parking: true,
    elevator: true,
    balcony: true,
    terrace: false,
    air_conditioning: true,
    water_included: false,
    electricity_included: false,
    internet_included: true,
    available_from: "2024-11-01",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Villa 4 pièces avec piscine à Riviera",
    description: "Magnifique villa avec piscine privée, jardin et garage pour 2 voitures. Idéale pour une famille, située dans un quartier sécurisé de Riviera.",
    type: "villa",
    category: "location",
    address_line1: "Avenue des Palmiers, Riviera",
    neighborhood: "Riviera",
    city: "Abidjan",
    latitude: 5.37133,
    longitude: -4.00832,
    surface: 250,
    rooms_count: 6,
    bedrooms_count: 4,
    bathrooms_count: 3,
    floor_level: 0,
    total_floors: 2,
    price: 800000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 800000,
    furnished: false,
    parking: true,
    elevator: false,
    balcony: false,
    terrace: true,
    garden: true,
    pool: true,
    air_conditioning: true,
    water_included: true,
    electricity_included: false,
    internet_included: false,
    available_from: "2024-11-15",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Studio meublé à Plateau",
    description: "Studio fonctionnel et moderne en plein cœur du Plateau. Idéal pour un jeune professionnel. Proche des transports en commun et restaurants.",
    type: "studio",
    category: "location",
    address_line1: "Boulevard de la République, Plateau",
    neighborhood: "Plateau",
    city: "Abidjan",
    latitude: 5.33695,
    longitude: -4.02709,
    surface: 35,
    rooms_count: 1,
    bedrooms_count: 1,
    bathrooms_count: 1,
    floor_level: 5,
    total_floors: 6,
    price: 120000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 120000,
    furnished: true,
    parking: false,
    elevator: true,
    balcony: true,
    terrace: false,
    air_conditioning: true,
    water_included: true,
    electricity_included: false,
    internet_included: true,
    available_from: "2024-11-01",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Maison 3 pièces à Yopougon",
    description: "Maison familiale avec grande cour et garage. Situation calme et sécurisée, proche des écoles et du marché.",
    type: "maison",
    category: "location",
    address_line1: "Quartier Sicogi, Yopougon",
    neighborhood: "Yopougon",
    city: "Abidjan",
    latitude: 5.33851,
    longitude: -4.08677,
    surface: 120,
    rooms_count: 4,
    bedrooms_count: 3,
    bathrooms_count: 2,
    floor_level: 0,
    total_floors: 1,
    price: 180000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 180000,
    furnished: false,
    parking: true,
    elevator: false,
    balcony: false,
    terrace: true,
    garden: true,
    air_conditioning: false,
    water_included: true,
    electricity_included: false,
    internet_included: false,
    available_from: "2024-12-01",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Duplex de luxe à Abidjan",
    description: "Splendide duplex avec vue panoramique sur la lagune. Hautes prestations, entièrement équipé, gardien 24/7.",
    type: "duplex",
    category: "location",
    address_line1: "Les îles, Abidjan",
    neighborhood: "Îles",
    city: "Abidjan",
    latitude: 5.27435,
    longitude: -3.97545,
    surface: 180,
    rooms_count: 5,
    bedrooms_count: 3,
    bathrooms_count: 2,
    floor_level: 1,
    total_floors: 2,
    price: 650000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 650000,
    furnished: true,
    parking: true,
    elevator: true,
    balcony: true,
    terrace: true,
    air_conditioning: true,
    security_system: true,
    water_included: true,
    electricity_included: false,
    internet_included: true,
    available_from: "2024-11-01",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Chambre en colocation à Marcory",
    description: "Chambre meublée en colocation. Cuisine et salon partagés. Ambiance conviviale et internationale.",
    type: "chambre",
    category: "colocation",
    address_line1: "Zone industrielle, Marcory",
    neighborhood: "Marcory",
    city: "Abidjan",
    latitude: 5.30731,
    longitude: -3.99111,
    surface: 18,
    rooms_count: 1,
    bedrooms_count: 1,
    bathrooms_count: 1,
    floor_level: 2,
    total_floors: 3,
    price: 75000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 75000,
    furnished: true,
    parking: false,
    elevator: false,
    balcony: false,
    terrace: false,
    air_conditioning: true,
    water_included: true,
    electricity_included: true,
    internet_included: true,
    available_from: "2024-11-01",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Local commercial à Adjamé",
    description: "Local commercial idéal pour boutique ou bureau. Forte visibilité, grande baie vitrée, proche du grand marché.",
    type: "local_commercial",
    category: "location",
    address_line1: "Marché d'Adjamé, Adjamé",
    neighborhood: "Adjamé",
    city: "Abidjan",
    latitude: 5.35836,
    longitude: -4.01202,
    surface: 60,
    rooms_count: 2,
    bedrooms_count: 0,
    bathrooms_count: 1,
    floor_level: 0,
    total_floors: 1,
    price: 150000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 150000,
    furnished: false,
    parking: false,
    elevator: false,
    balcony: false,
    terrace: false,
    air_conditioning: true,
    water_included: false,
    electricity_included: false,
    internet_included: false,
    available_from: "2024-11-01",
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366216548-375f70e4fbb3?w=800&h=600&fit=crop"
    ]
  },
  {
    title: "Appartement F4 moderne à Treichville",
    description: "Grand appartement de 4 pièces, bien lumineux avec terrasse. Proche du pont et des commodités.",
    type: "appartement",
    category: "location",
    address_line1: "Boulevard Giscard, Treichville",
    neighborhood: "Treichville",
    city: "Abidjan",
    latitude: 5.29677,
    longitude: -4.02348,
    surface: 110,
    rooms_count: 4,
    bedrooms_count: 3,
    bathrooms_count: 2,
    floor_level: 4,
    total_floors: 6,
    price: 320000,
    price_currency: "XOF",
    price_frequency: "monthly",
    deposit_amount: 320000,
    furnished: true,
    parking: true,
    elevator: true,
    balcony: true,
    terrace: true,
    air_conditioning: true,
    water_included: false,
    electricity_included: false,
    internet_included: true,
    available_from: "2024-11-15",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop"
    ]
  }
];

// Fonction pour obtenir le propriétaire (proprietaire@mon-toit.ci)
async function getOwnerId() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'proprietaire@mon-toit.ci')
    .single();

  if (error || !data) {
    console.error('❌ Impossible de trouver le propriétaire:', error?.message);
    return null;
  }

  return data.id;
}

// Fonction principale de seed
async function seedProperties(cleanup = false) {
  try {
    console.log('🏠 Début du seed des propriétés...');

    if (cleanup) {
      console.log('🗑️ Nettoyage des propriétés existantes...');
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .like('title', '%'); // Supprime toutes les propriétés

      if (deleteError) {
        console.warn('⚠️ Erreur lors du nettoyage:', deleteError.message);
      } else {
        console.log('✅ Propriétés existantes supprimées');
      }
    }

    // Obtenir l'ID du propriétaire
    const ownerId = await getOwnerId();
    if (!ownerId) {
      console.error('❌ Impossible de continuer sans propriétaire valide');
      return;
    }

    console.log(`👤 Utilisation du propriétaire ID: ${ownerId}`);

    let successCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        const { data, error } = await supabase
          .from('properties')
          .insert({
            ...property,
            owner_id: ownerId,
            publication_status: 'approuvé',
            status: 'disponible',
            published_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Erreur création propriété "${property.title}":`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Propriété créée: ${property.title} (${data.id})`);
          successCount++;
        }
      } catch (err) {
        console.error(`💥 Erreur inattendue pour "${property.title}":`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résultats du seed:');
    console.log(`   ✅ Succès: ${successCount} propriétés créées`);
    console.log(`   ❌ Erreurs: ${errorCount} propriétés échouées`);

    if (successCount > 0) {
      // Vérification
      const { data: countData, error: countError } = await supabase
        .from('properties')
        .select('count', { count: 'exact' });

      if (!countError && countData !== null) {
        console.log(`📋 Total propriétés en base: ${countData.length || countData[0]?.count || 0}`);
      }
    }

  } catch (error) {
    console.error('💥 Erreur fatale lors du seed:', error.message);
    process.exit(1);
  }
}

// Vérification que nous avons bien les migrations
async function checkMigrations() {
  console.log('🔍 Vérification des tables...');

  const tables = ['properties', 'rental_applications', 'user_verifications', 'search_history', 'user_preferences'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Table ${table} non accessible: ${error.message}`);
        return false;
      } else {
        console.log(`✅ Table ${table}: accessible`);
      }
    } catch (err) {
      console.error(`❌ Table ${table}: erreur inattendue`, err.message);
      return false;
    }
  }

  // Vérifier la fonction RPC
  try {
    const { data, error } = await supabase
      .rpc('get_public_properties');

    if (error) {
      console.error(`❌ Fonction RPC get_public_properties non accessible: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Fonction RPC get_public_properties: accessible`);
    }
  } catch (err) {
    console.error(`❌ Fonction RPC: erreur inattendue`, err.message);
    return false;
  }

  return true;
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const cleanup = args.includes('cleanup');

  // Vérifier les migrations d'abord
  console.log('🔍 Vérification préalable...');
  const migrationsOk = await checkMigrations();

  if (!migrationsOk) {
    console.error('\n❌ Veuillez appliquer les migrations avant de lancer ce script:');
    console.error('   supabase db reset');
    console.error('   ou');
    console.error('   supabase db push');
    process.exit(1);
  }

  console.log('\n🚀 Lancement du seed...');
  await seedProperties(cleanup);

  console.log('\n🎉 Seed des propriétés terminé !');
  console.log('\n🔗 URL de test: http://localhost:8081/');
  console.log('🏠 Propriétés créées: Les 8 propriétés de test sont maintenant disponibles');
  console.log('👤 Utilisateur propriétaire: proprietaire@mon-toit.ci / Proprietaire123!');
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Erreur non capturée:', reason);
  process.exit(1);
});

// Exécuter le script
main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});