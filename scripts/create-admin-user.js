#!/usr/bin/env node

/**
 * Script pour créer un utilisateur admin de test
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

async function createTestAdmin() {
  try {
    console.log('👤 Création de l\'utilisateur admin de test...');

    // Créer l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@mon-toit.ci',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        user_type: 'admin_ansut',
        full_name: 'Administrateur Test'
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
        email: 'admin@mon-toit.ci',
        full_name: 'Administrateur Test',
        user_type: 'admin_ansut',
        phone: '+22500000001',
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

    // Ajouter les rôles admin
    const { error: roleError1 } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin',
        granted_by: authData.user.id,
        granted_at: new Date().toISOString()
      });

    if (roleError1) {
      console.warn('⚠️ Erreur création rôle admin:', roleError1.message);
    }

    const { error: roleError2 } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'super_admin',
        granted_by: authData.user.id,
        granted_at: new Date().toISOString()
      });

    if (roleError2) {
      console.warn('⚠️ Erreur création rôle super_admin:', roleError2.message);
    }

    console.log('\n🎉 Utilisateur admin créé avec succès !');
    console.log('📧 Email: admin@mon-toit.ci');
    console.log('🔐 Mot de passe: Admin123!');
    console.log('👤 Type: admin_ansut');
    console.log('🔑 Rôles: admin, super_admin');

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
    .eq('email', 'admin@mon-toit.ci')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Erreur vérification utilisateur:', error.message);
    return false;
  }

  if (data) {
    console.log(`✅ Utilisateur admin existe déjà: ${data.email} (${data.id})`);
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Vérification de l\'utilisateur admin...');

  const exists = await checkUserExists();

  if (!exists) {
    await createTestAdmin();
  }
}

main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});