#!/usr/bin/env node

/**
 * Script de création des comptes de test pour Mon Toit
 *
 * Ce script crée les utilisateurs auth et leurs profils associés
 * ainsi que les rôles, préférences et notifications nécessaires
 *
 * Usage: npm run create-test-users
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  console.error('Vérifiez VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local');
  process.exit(1);
}

// Client Supabase avec droits admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Définition des utilisateurs de test
const testUsers = [
  // Administrateur
  {
    email: 'admin@mon-toit.ci',
    password: 'admin123',
    fullName: 'Administrateur Mon Toit',
    phone: '+225 01 23 45 67 89',
    userType: 'admin_ansut',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Administrateur principal du système Mon Toit. Accès complet à toutes les fonctionnalités.',
    city: 'Abidjan, Cocody',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: true,
    faceVerified: true,
    uiDensity: 'comfortable'
  },

  // Propriétaires (9)
  {
    email: 'kouadio.jean@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Kouadio Jean-Baptiste',
    phone: '+225 01 23 45 67 01',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Propriétaire de plusieurs biens à Abidjan',
    city: 'Abidjan, Cocody',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'comfortable'
  },
  {
    email: 'marie.aya@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Marie Aya Bamba',
    phone: '+225 01 23 45 67 02',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Propriétaire de biens commerciaux',
    city: 'Abidjan, Plateau',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },
  {
    email: 'koffi.alain@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Koffi Alain',
    phone: '+225 01 23 45 67 10',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1545996124-1b3d1a1b7a9e?w=150&h=150&fit=crop&crop=face',
    bio: 'Investisseur immobilier, propriétaire de plusieurs appartements F4/F3.',
    city: 'Abidjan, Marcory',
    isVerified: true,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'comfortable'
  },
  {
    email: 'patricia.kouame@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Patricia Kouamé',
    phone: '+225 01 23 45 67 09',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Chef d\'entreprise à la recherche de bureaux',
    city: 'Abidjan, Plateau',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'comfortable'
  },
  {
    email: 'adou.rosine@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Adou Rosine',
    phone: '+225 01 23 45 67 11',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
    bio: 'Propriétaire de petites résidences et studios.',
    city: 'Abidjan, Treichville',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },
  {
    email: 'traore.sami@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Traoré Sami',
    phone: '+225 01 23 45 67 12',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face',
    bio: 'Gère des biens locatifs et locaux commerciaux.',
    city: 'Abidjan, Plateau',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'comfortable'
  },
  {
    email: 'konan.emma@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'Konan Emma',
    phone: '+225 01 23 45 67 13',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1545996130-2f1b6b6d0b6a?w=150&h=150&fit=crop&crop=face',
    bio: 'Investisseuse, focus sur locations de courte durée.',
    city: 'Abidjan, Cocody',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },
  {
    email: 'nguessan.fred@mon-toit.ci',
    password: 'proprietaire123',
    fullName: 'N\'Guessan Fred',
    phone: '+225 01 23 45 67 14',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1524503033411-c9566986fc8f?w=150&h=150&fit=crop&crop=face',
    bio: 'Propriétaire et entrepreneur, possède bureaux et appartements.',
    city: 'Abidjan, Zone 4',
    isVerified: true,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'comfortable'
  },
  {
    email: 'kone.adama@proprietaire.ci',
    password: 'proprietaire123',
    fullName: 'Koné Adama',
    phone: '+225 01 23 45 67 15',
    userType: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1507591064344-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    bio: 'Propriétaire expérimenté, spécialisé en villas de luxe.',
    city: 'Abidjan, Riviera',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: true,
    faceVerified: false,
    uiDensity: 'comfortable'
  },

  // Locataires (4)
  {
    email: 'yao.konan@mon-toit.ci',
    password: 'locataire123',
    fullName: 'Yao Konan',
    phone: '+225 01 23 45 67 03',
    userType: 'locataire',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Jeune professionnel à la recherche d\'un appartement',
    city: 'Abidjan, Yopougon',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },
  {
    email: 'aminata.diarra@mon-toit.ci',
    password: 'locataire123',
    fullName: 'Aminata Diarra',
    phone: '+225 01 23 45 67 04',
    userType: 'locataire',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    bio: 'Étudiante à la recherche d\'un studio',
    city: 'Abidjan, Abobo',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },
  {
    email: 'dr.yeo@mon-toit.ci',
    password: 'locataire123',
    fullName: 'Dr. Yeo Martial',
    phone: '+225 01 23 45 67 08',
    userType: 'locataire',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    bio: 'Médecin résident à Abidjan',
    city: 'Abidjan, Marcory',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },
  {
    email: 'toure.mohamed@locataire.ci',
    password: 'locataire123',
    fullName: 'Touré Mohamed',
    phone: '+225 01 23 45 67 16',
    userType: 'locataire',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face',
    bio: 'Commercial à la recherche d\'un appartement',
    city: 'Abidjan, Abobo',
    isVerified: false,
    oneciVerified: false,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'compact'
  },

  // Agences (2)
  {
    email: 'contact@agence-cocody.ci',
    password: 'agence123',
    fullName: 'Agence Immobilière Cocody',
    phone: '+225 01 23 45 67 05',
    userType: 'agence',
    avatarUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150&h=150&fit=crop&crop=face',
    bio: 'Agence immobilière de premier choix à Cocody',
    city: 'Abidjan, Cocody',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: false,
    faceVerified: false,
    uiDensity: 'comfortable'
  },
  {
    email: 'info@ankou-realestate.ci',
    password: 'agence123',
    fullName: 'Ankou Real Estate',
    phone: '+225 01 23 45 67 06',
    userType: 'agence',
    avatarUrl: 'https://images.unsplash.com/photo-1556659793-08538906a9f8?w=150&h=150&fit=crop&crop=face',
    bio: 'Expert en gestion immobilière à Abidjan',
    city: 'Abidjan, Plateau',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: true,
    faceVerified: false,
    uiDensity: 'compact'
  },

  // Tiers de confiance (1)
  {
    email: 'notaire.konan@mon-toit.ci',
    password: 'tiers123',
    fullName: 'Notaire Konan',
    phone: '+225 01 23 45 67 07',
    userType: 'tiers_de_confiance',
    avatarUrl: 'https://images.unsplash.com/photo-1507591064344-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    bio: 'Notaire certifié pour transactions immobilières',
    city: 'Abidjan, Cocody',
    isVerified: true,
    oneciVerified: true,
    cnamVerified: true,
    faceVerified: true,
    uiDensity: 'comfortable'
  }
];

// Fonction pour créer un utilisateur et son profil
async function createUserWithProfile(userData) {
  try {
    console.log(`📝 Création de l'utilisateur: ${userData.email}`);

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        user_type: userData.userType,
        phone: userData.phone
      }
    });

    if (authError) {
      if (authError.message.includes('duplicate key')) {
        console.log(`⚠️  L'utilisateur ${userData.email} existe déjà, mise à jour du profil...`);

        // Récupérer l'utilisateur existant
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email);
        if (existingUser?.user) {
          // Mettre à jour le mot de passe
          await supabase.auth.admin.updateUserById(existingUser.user.id, {
            password: userData.password
          });

          // Continuer avec la création du profil
          return await createUserProfile(existingUser.user.id, userData);
        }
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Utilisateur non créé');
    }

    console.log(`✅ Utilisateur auth créé: ${userData.email}`);

    // 2. Créer le profil dans public.profiles
    return await createUserProfile(authData.user.id, userData);

  } catch (error) {
    console.error(`❌ Erreur lors de la création de ${userData.email}:`, error.message);
    return null;
  }
}

// Fonction pour créer le profil utilisateur
async function createUserProfile(userId, userData) {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: userData.fullName,
        phone: userData.phone,
        avatar_url: userData.avatarUrl,
        bio: userData.bio,
        city: userData.city,
        user_type: userData.userType,
        is_verified: userData.isVerified,
        oneci_verified: userData.oneciVerified,
        cnam_verified: userData.cnamVerified,
        face_verified: userData.faceVerified,
        ui_density: userData.uiDensity,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.warn(`⚠️  Erreur profil pour ${userData.email}:`, profileError.message);
    } else {
      console.log(`✅ Profil créé pour: ${userData.email}`);
    }

    // 3. Créer les rôles utilisateur
    await createUserRoles(userId, userData);

    // 4. Créer les préférences utilisateur
    await createUserPreferences(userId, userData);

    // 5. Créer les notifications
    await createUserNotifications(userId, userData);

    return profileData;

  } catch (error) {
    console.error(`❌ Erreur lors de la création du profil pour ${userData.email}:`, error.message);
    return null;
  }
}

// Fonction pour créer les rôles utilisateur
async function createUserRoles(userId, userData) {
  try {
    // Définir les rôles disponibles en fonction du type d'utilisateur
    const getAvailableRoles = (userType) => {
      switch (userType) {
        case 'admin_ansut':
          return ['admin_ansut', 'proprietaire', 'locataire', 'agence', 'tiers_de_confiance'];
        case 'proprietaire':
          return ['proprietaire', 'locataire'];
        case 'agence':
          return ['agence', 'proprietaire'];
        case 'locataire':
          return ['locataire', 'proprietaire'];
        case 'tiers_de_confiance':
          return ['tiers_de_confiance'];
        default:
          return [userType];
      }
    };

    const availableRoles = getAvailableRoles(userData.userType);

    // Insérer dans user_roles
    await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: userData.userType,
        created_at: new Date().toISOString()
      });

    // Insérer dans user_active_roles
    await supabase
      .from('user_active_roles')
      .upsert({
        user_id: userId,
        active_role: userData.userType,
        available_roles: availableRoles,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log(`✅ Rôles créés pour: ${userData.email}`);

  } catch (error) {
    console.warn(`⚠️  Erreur rôles pour ${userData.email}:`, error.message);
  }
}

// Fonction pour créer les préférences utilisateur
async function createUserPreferences(userId, userData) {
  try {
    const defaultPreferences = {
      user_id: userId,
      theme: userData.userType === 'admin_ansut' ? 'dark' : 'light',
      language: 'fr',
      notifications_enabled: true,
      email_notifications: true,
      push_notifications: userData.userType === 'admin_ansut',
      property_alerts: userData.userType === 'locataire'
    };

    await supabase
      .from('user_preferences')
      .upsert(defaultPreferences);

    console.log(`✅ Préférences créées pour: ${userData.email}`);

  } catch (error) {
    console.warn(`⚠️  Erreur préférences pour ${userData.email}:`, error.message);
  }
}

// Fonction pour créer les notifications utilisateur
async function createUserNotifications(userId, userData) {
  try {
    const notifications = [];

    // Notification de bienvenue
    notifications.push({
      id: crypto.randomUUID(),
      user_id: userId,
      title: 'Bienvenue sur Mon Toit!',
      message: `Votre compte ${userData.userType} a été créé avec succès. Explorez toutes les fonctionnalités disponibles.`,
      type: 'success',
      read: false,
      metadata: { priority: 'high' },
      created_at: new Date().toISOString()
    });

    // Notifications spécifiques selon le rôle
    if (userData.userType === 'admin_ansut') {
      notifications.push({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Accès administrateur',
        message: 'Vous avez accès complet à toutes les fonctionnalités du système.',
        type: 'info',
        read: false,
        metadata: { priority: 'medium' },
        created_at: new Date().toISOString()
      });
    } else if (userData.userType === 'proprietaire') {
      notifications.push({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Gestion de biens',
        message: 'Vous pouvez maintenant ajouter et gérer vos propriétés.',
        type: 'info',
        read: false,
        metadata: { priority: 'medium' },
        created_at: new Date().toISOString()
      });
    } else if (userData.userType === 'locataire') {
      notifications.push({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Recherche de logement',
        message: 'Commencez votre recherche parmi les propriétés disponibles.',
        type: 'info',
        read: false,
        metadata: { priority: 'medium' },
        created_at: new Date().toISOString()
      });
    }

    // Insérer les notifications
    await supabase
      .from('notifications')
      .upsert(notifications);

    console.log(`✅ Notifications créées pour: ${userData.email}`);

  } catch (error) {
    console.warn(`⚠️  Erreur notifications pour ${userData.email}:`, error.message);
  }
}

// Fonction pour associer des propriétés aux propriétaires
async function assignPropertiesToOwners() {
  try {
    console.log('🏠 Association des propriétés aux propriétaires...');

    // Récupérer tous les propriétaires
    const { data: owners, error: ownersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('user_type', 'proprietaire');

    if (ownersError) {
      console.warn('⚠️  Erreur récupération propriétaires:', ownersError.message);
      return;
    }

    // Récupérer les propriétés sans owner_id
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id')
      .is('owner_id', null)
      .limit(owners?.length || 10);

    if (propsError) {
      console.warn('⚠️  Erreur récupération propriétés:', propsError.message);
      return;
    }

    // Associer les propriétés aux propriétaires
    for (let i = 0; i < Math.min(owners.length, properties.length); i++) {
      await supabase
        .from('properties')
        .update({ owner_id: owners[i].id })
        .eq('id', properties[i].id);

      console.log(`✅ Propriété ${properties[i].id} associée à ${owners[i].email}`);
    }

  } catch (error) {
    console.warn('⚠️  Erreur association propriétés:', error.message);
  }
}

// Fonction principale
async function createTestUsers() {
  console.log('🚀 Démarrage de la création des comptes de test...\n');

  try {
    // Test de connexion à Supabase
    const { data, error } = await supabase.from('profiles').select('count').single();
    if (error) {
      console.error('❌ Erreur de connexion à Supabase:', error.message);
      process.exit(1);
    }

    console.log('✅ Connexion à Supabase établie\n');

    let successCount = 0;
    let errorCount = 0;

    // Créer chaque utilisateur
    for (const userData of testUsers) {
      const result = await createUserWithProfile(userData);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }

      // Petite pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Associer les propriétés aux propriétaires
    await assignPropertiesToOwners();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA CRÉATION');
    console.log('='.repeat(60));
    console.log(`✅ Utilisateurs créés avec succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📋 Total: ${testUsers.length} comptes de test`);

    console.log('\n🔑 COMPTES DISPONIBLES:');
    console.log('─'.repeat(40));

    // Afficher les comptes par rôle
    const usersByRole = {};
    testUsers.forEach(user => {
      if (!usersByRole[user.userType]) {
        usersByRole[user.userType] = [];
      }
      usersByRole[user.userType].push(user);
    });

    Object.entries(usersByRole).forEach(([role, users]) => {
      const roleNames = {
        'admin_ansut': '👑 ADMINISTRATEUR',
        'proprietaire': '🏠 PROPRIÉTAIRES',
        'locataire': '👤 LOCATAIRES',
        'agence': '🏢 AGENCES',
        'tiers_de_confiance': '🤝 TIERS DE CONFIANCE'
      };

      console.log(`\n${roleNames[role] || role.toUpperCase()}:`);
      users.forEach(user => {
        console.log(`   ${user.email} (${user.password})`);
      });
    });

    console.log('\n🌐 URL de connexion: http://localhost:8085/login');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUsers();
}

export { createTestUsers, testUsers };