#!/usr/bin/env node

/**
 * Script de seed pour l'authentification
 * Crée des utilisateurs de test avec différents rôles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY est requis pour ce script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Utilisateurs de test
const testUsers = [
  {
    email: 'admin@mon-toit.ci',
    password: 'Admin123!@#',
    full_name: 'Admin ANSUT',
    user_type: 'admin_ansut'
  },
  {
    email: 'proprietaire@mon-toit.ci',
    password: 'Proprietaire123!',
    full_name: 'Jean Kouamé',
    user_type: 'proprietaire'
  },
  {
    email: 'locataire@mon-toit.ci',
    password: 'Locataire123!',
    full_name: 'Awa Touré',
    user_type: 'locataire'
  },
  {
    email: 'agence@mon-toit.ci',
    password: 'Agence123!',
    full_name: 'Agence Immobilière Abidjan',
    user_type: 'agence'
  },
  {
    email: 'tiers@mon-toit.ci',
    password: 'Tiers123!',
    full_name: 'Tiers de Confiance',
    user_type: 'tiers_de_confiance'
  }
];

async function createUser(userData) {
  try {
    console.log(`📝 Création de l'utilisateur: ${userData.email}`);

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        user_type: userData.user_type
      }
    });

    if (authError) {
      // Si l'utilisateur existe déjà, récupérer ses données
      if (authError.message.includes('already registered')) {
        console.log(`ℹ️ L'utilisateur ${userData.email} existe déjà`);
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === userData.email);
        return existingUser;
      }
      throw authError;
    }

    console.log(`✅ Utilisateur auth créé: ${userData.email}`);
    return authData.user;

  } catch (error) {
    console.error(`❌ Erreur création utilisateur ${userData.email}:`, error.message);
    throw error;
  }
}

async function createProfile(user, userData) {
  try {
    console.log(`👤 Création du profil pour: ${userData.email}`);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: userData.full_name,
        user_type: userData.user_type,
        is_verified: userData.user_type === 'admin_ansut', // Auto-vérifier les admins
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      throw profileError;
    }

    console.log(`✅ Profil créé pour: ${userData.email}`);

  } catch (error) {
    console.error(`❌ Erreur création profil ${userData.email}:`, error.message);
    throw error;
  }
}

async function createRole(user, userData) {
  try {
    console.log(`🔑 Création du rôle pour: ${userData.email}`);

    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: userData.user_type,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,role',
        ignoreDuplicates: true
      });

    if (roleError) {
      throw roleError;
    }

    console.log(`✅ Rôle créé pour: ${userData.email}`);

  } catch (error) {
    console.error(`❌ Erreur création rôle ${userData.email}:`, error.message);
    throw error;
  }
}

async function seedAuth() {
  console.log('🚀 Démarrage du seed des données d\'authentification...\n');

  try {
    for (const userData of testUsers) {
      console.log(`\n--- Traitement de: ${userData.email} ---`);

      try {
        // Créer l'utilisateur
        const user = await createUser(userData);

        // Créer le profil
        await createProfile(user, userData);

        // Créer le rôle
        await createRole(user, userData);

        console.log(`✅ ${userData.email} complété avec succès`);

      } catch (error) {
        console.error(`❌ Erreur traitement ${userData.email}:`, error.message);
        // Continuer avec les autres utilisateurs même si celui-ci échoue
      }
    }

    console.log('\n🎉 Seed des données d\'authentification terminé!');
    console.log('\n📝 Comptes créés:');
    testUsers.forEach(user => {
      console.log(`  • ${user.email} (${user.user_type}) - Mot de passe: ${user.password}`);
    });

  } catch (error) {
    console.error('\n💥 Erreur fatale lors du seed:', error);
    process.exit(1);
  }
}

// Fonction de nettoyage (optionnelle)
async function cleanupAuth() {
  console.log('🧹 Nettoyage des données de test...');

  try {
    for (const userData of testUsers) {
      console.log(`🗑️ Suppression de: ${userData.email}`);

      // Supprimer d'abord les rôles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email);

      if (profiles && profiles.length > 0) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', profiles[0].id);

        // Supprimer le profil
        await supabase
          .from('profiles')
          .delete()
          .eq('email', userData.email);
      }

      // Supprimer l'utilisateur auth
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const userToDelete = users.find(u => u.email === userData.email);

      if (userToDelete) {
        await supabase.auth.admin.deleteUser(userToDelete.id);
      }

      console.log(`✅ ${userData.email} supprimé`);
    }

    console.log('🧹 Nettoyage terminé');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Vérifier les arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'cleanup') {
  await cleanupAuth();
} else if (command === 'seed' || !command) {
  await seedAuth();
} else {
  console.log('Usage: node seed-auth.js [seed|cleanup]');
  console.log('  seed   - Crée les utilisateurs de test (défaut)');
  console.log('  cleanup - Supprime les utilisateurs de test');
  process.exit(1);
}