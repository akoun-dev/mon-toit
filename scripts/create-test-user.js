#!/usr/bin/env node

/**
 * Script pour créer un utilisateur propriétaire de test
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

async function createTestOwner() {
  try {
    console.log('👤 Création de l\'utilisateur propriétaire de test...');

    // Créer l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'proprietaire@mon-toit.ci',
      password: 'Proprietaire123!',
      email_confirm: true,
      user_metadata: {
        user_type: 'proprietaire',
        full_name: 'Propriétaire Test'
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur auth:', authError.message);
      return;
    }

    console.log(`✅ Utilisateur auth créé: ${authData.user.id}`);

    // Créer le profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'proprietaire@mon-toit.ci',
        full_name: 'Propriétaire Test',
        user_type: 'proprietaire',
        phone: '+22500000000',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError.message);
      return;
    }

    console.log(`✅ Profil créé: ${profileData.full_name} (${profileData.id})`);
    console.log('\n🎉 Utilisateur propriétaire créé avec succès !');
    console.log('📧 Email: proprietaire@mon-toit.ci');
    console.log('🔐 Mot de passe: Proprietaire123!');
    console.log('👤 Type: proprietaire');

  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Vérifier si l'utilisateur existe déjà
async function checkUserExists() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'proprietaire@mon-toit.ci')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Erreur vérification utilisateur:', error.message);
    return false;
  }

  if (data) {
    console.log(`✅ Utilisateur propriétaire existe déjà: ${data.email} (${data.id})`);
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Vérification de l\'utilisateur propriétaire...');
  
  const exists = await checkUserExists();
  
  if (!exists) {
    await createTestOwner();
  }
}

main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});