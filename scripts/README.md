# Scripts de création des utilisateurs de test

## Vue d'ensemble

Ce dossier contient les scripts pour la gestion des données de test de l'application Mon Toit.

## Scripts disponibles

### `create-test-users.js`

Ce script crée tous les comptes utilisateurs de test nécessaires pour le développement et les tests.

#### Utilisation

```bash
npm run create-test-users
```

#### Ce que fait le script

1. **Création des comptes utilisateurs auth** dans Supabase Auth
2. **Création des profils** dans la table `public.profiles`
3. **Configuration des rôles** dans `user_roles` et `user_active_roles`
4. **Création des préférences** utilisateur dans `user_preferences`
5. **Génération des notifications** de bienvenue
6. **Association des propriétés** aux propriétaires

#### Comptes créés

Le script crée 16 comptes de test répartis ainsi :

- **1 Administrateur** : `admin@mon-toit.ci` / `admin123`
- **9 Propriétaires** : emails en `@mon-toit.ci` / `proprietaire123`
- **4 Locataires** : emails en `@mon-toit.ci` et `@locataire.ci` / `locataire123`
- **2 Agences** : emails en `@agence-cocody.ci` et `@ankou-realestate.ci` / `agence123`
- **1 Tiers de confiance** : `notaire.konan@mon-toit.ci` / `tiers123`

## Configuration requise

### Variables d'environnement

Le script nécessite les variables suivantes dans `.env.local` :

```bash
# URL et clé Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Note: La clé SERVICE_ROLE est nécessaire pour créer des utilisateurs
# Ne jamais exposer cette clé côté client !
```

### Permissions

Assurez-vous que :
- L'utilisateur de la base de données a les permissions nécessaires
- Les politiques RLS permettent les opérations admin
- Le service Supabase est accessible

## Flux de travail recommandé

### 1. Nouvelle installation

```bash
# 1. Démarrer Supabase (local ou distant)
supabase start

# 2. Appliquer les migrations
supabase db push

# 3. Charger les données de test (propriétés, etc.)
supabase db reset

# 4. Créer les comptes utilisateurs
npm run create-test-users

# 5. Démarrer l'application
npm run dev
```

### 2. Mise à jour des utilisateurs

Pour recréer les utilisateurs avec de nouveaux mots de passe :

```bash
npm run create-test-users
```

Le script gère automatiquement les doublons et met à jour les comptes existants.

### 3. Réinitialisation complète

```bash
# Arrêter Supabase
supabase stop

# Nettoyer les volumes Docker
docker volume prune -f

# Redémarrer
supabase start
npm run create-test-users
```

## Structure des données

### Profils créés

Chaque utilisateur obtient :
- Un profil complet avec avatar, bio, coordonnées
- Un rôle principal et des rôles disponibles
- Des préférences par défaut (thème, notifications, etc.)
- Des notifications de bienvenue

### Propriétés associées

Les propriétaires se voient automatiquement assigner des propriétés :
- Les propriétaires existants gardent leurs biens
- Les nouveaux propriétaires reçoivent des propriétés disponibles
- Les propriétés sans `owner_id` sont distribuées automatiquement

## Dépannage

### Erreurs communes

1. **"Variable d'environnement manquante"**
   - Vérifiez `.env.local` et les variables Supabase

2. **"Permission denied"**
   - Utilisez la clé SERVICE_ROLE (pas la clé ANON)
   - Vérifiez les permissions de la base de données

3. **"User already registered"**
   - Normal si les utilisateurs existent déjà
   - Le script met à jour les mots de passe automatiquement

4. **"Connection failed"**
   - Vérifiez que Supabase est démarré
   - Validez l'URL et la clé d'API

### Vérification

Après exécution, vérifiez dans la console Supabase :
- Table `auth.users` : 16 utilisateurs
- Table `public.profiles` : 16 profils
- Table `public.user_active_roles` : 16 rôles actifs

## Sécurité

- ⚠️ **Ne jamais commiter la clé SERVICE_ROLE**
- 🔄 **Changez les mots de passe en production**
- 👥 **Utilisez des emails de test uniquement**
- 🔐 **Supprimez les comptes de test avant le déploiement**

## Maintenance

- Mettez à jour les comptes de test après les migrations
- Recréez les utilisateurs après les changements de schéma
- Documentez tout changement dans les rôles ou permissions