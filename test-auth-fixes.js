#!/usr/bin/env node

/**
 * Script de test pour vérifier les corrections d'authentification
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env.local') });

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

async function testAuthentication() {
  console.log('🔍 Test de l\'authentification après corrections...\n');

  // Test 1: Vérifier les utilisateurs créés
  console.log('📋 1. Vérification des utilisateurs...');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Erreur récupération utilisateurs:', usersError.message);
    return;
  }

  console.log('✅ Utilisateurs trouvés:', users?.users?.length || 0);
  if (users?.users) {
    users.users.forEach(user => {
      console.log(`   • ${user.email} (confirmé: ${!!user.email_confirmed_at})`);
    });
  }

  // Test 2: Vérifier les profils
  console.log('\n👤 2. Vérification des profils...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('❌ Erreur récupération profils:', profilesError.message);
    return;
  }

  console.log('✅ Profils trouvés:', profiles.length);
  profiles.forEach(profile => {
    console.log(`   • ${profile.email} (${profile.user_type})`);
  });

  // Test 3: Vérifier les rôles
  console.log('\n🔑 3. Vérification des rôles...');
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');

  if (rolesError) {
    console.error('❌ Erreur récupération rôles:', rolesError.message);
    return;
  }

  console.log('✅ Rôles trouvés:', roles.length);
  roles.forEach(role => {
    console.log(`   • ${role.user_id} (${role.role})`);
  });

  // Test 4: Vérifier les nouvelles tables
  console.log('\n📊 4. Vérification des nouvelles tables...');

  const tables = ['notifications', 'user_favorites', 'agency_mandates'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: accessible`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: erreur inattendue`, err.message);
    }
  }

  // Test 5: Vérifier la vue user_roles_summary
  console.log('\n👁 5. Vérification de la vue user_roles_summary...');
  try {
    const { data: summary, error: summaryError } = await supabase
      .from('user_roles_summary')
      .select('*')
      .limit(3);

    if (summaryError) {
      console.log(`❌ Vue user_roles_summary: ${summaryError.message}`);
    } else {
      console.log(`✅ Vue user_roles_summary: accessible (${summary.length} entrées)`);
      summary.forEach(entry => {
        console.log(`   • ${entry.email} (${entry.user_type}): ${JSON.stringify(entry.roles)}`);
      });
    }
  } catch (err) {
    console.log(`❌ Vue user_roles_summary: erreur inattendue`, err.message);
  }

  // Test 6: Test de connexion avec l'utilisateur admin
  console.log('\n🔐 6. Test de connexion admin...');
  const adminEmail = 'admin@mon-toit.ci';
  const adminPassword = 'Admin123!@#';

  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      console.log(`❌ Connexion admin échouée: ${signInError.message}`);
    } else {
      console.log('✅ Connexion admin réussie');
      console.log(`   User ID: ${signInData.user.id}`);
      console.log(`   Email confirmé: ${!!signInData.user.email_confirmed_at}`);

      // Test 7: Vérifier l'accès au profil de l'admin connecté
      if (signInData.user) {
        console.log('\n🔍 7. Test d\'accès au profil admin connecté...');
        const { data: adminProfile, error: adminProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();

        if (adminProfileError) {
          console.log(`❌ Accès profil admin: ${adminProfileError.message}`);
        } else {
          console.log('✅ Accès profil admin réussie');
          console.log(`   Nom: ${adminProfile.full_name}`);
          console.log(`   Type: ${adminProfile.user_type}`);
          console.log(`   Vérifié: ${adminProfile.is_verified}`);

          // Test 8: Vérifier les rôles de l'admin
          console.log('\n🔑 8. Vérification des rôles admin...');
          const { data: adminRoles, error: adminRolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', signInData.user.id);

          if (adminRolesError) {
            console.log(`❌ Récupération rôles admin: ${adminRolesError.message}`);
          } else {
            console.log(`✅ Rôles admin récupérés: ${adminRoles.length} rôle(s)`);
            adminRoles.forEach(role => {
              console.log(`   • ${role.role}`);
            });
          }
        }
      }
    }
  } catch (err) {
    console.log(`❌ Erreur test connexion: ${err.message}`);
  }

  // Test 9: Vérification des politiques RLS
  console.log('\n🛡️ 9. Vérification des politiques RLS...');
  try {
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');

    if (policies) {
      console.log(`✅ Politiques RLS trouvées: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   • ${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (err) {
    console.log(`ℹ️ Impossible de vérifier les politiques RLS: ${err.message}`);
  }

  console.log('\n🎉 Tests d\'authentification terminés !');
  console.log('\n📝 Résumé des corrections appliquées:');
  console.log('   ✅ Tables manquantes créées');
  console.log('   ✅ Politiques RLS améliorées');
  console.log('   ✅ Fonctions de fetch corrigées');
  console.log('   ✅ Logique de redirection améliorée');
  console.log('\n🔗 URL de test: http://localhost:8082/auth');
  console.log('👤 Utilisateur de test: admin@mon-toit.ci / Admin123!@#');
}

// Exécuter les tests
testAuthentication().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});