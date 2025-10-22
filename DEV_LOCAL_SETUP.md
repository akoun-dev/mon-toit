# 🚀 Configuration Développement Local - Mon Toit

## 📋 Vue d'ensemble

Ce document explique comment utiliser l'environnement de développement local avec Supabase au lieu de la base de données distante.

## 🛠️ Prérequis

- Docker et Docker Compose installés
- Node.js 18+ et npm
- CLI Supabase installée: `npm install -g supabase`

## 🚀 Démarrage Rapide

### 1. Démarrer Supabase Local
```bash
npx supabase start
```

### 2. Configurer l'Application
```bash
# Utiliser le script de basculement
./scripts/switch-env.sh local

# Ou configurer manuellement .env.local avec les valeurs locales
```

### 3. Démarrer le Serveur de Développement
```bash
npm run dev
```

L'application sera disponible sur: **http://localhost:8081/**

## 📁 Services Locaux

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:8081/ | Interface web principale |
| **Supabase Studio** | http://127.0.0.1:54323 | Interface d'administration DB |
| **API REST** | http://127.0.0.1:54321 | API Supabase locale |
| **Mail Test** | http://127.0.0.1:54324 | Boîte mail de développement |
| **Base de données** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Connexion directe DB |

## 🔄 Gestion des Environnements

### Script de Basculement Automatique

Utilisez le script pour basculer facilement entre les environnements:

```bash
# Passer en développement local
./scripts/switch-env.sh local

# Passer en production
./scripts/switch-env.sh production

# Redémarrer le serveur après changement
npm run dev
```

### Configuration Manuelle

Les fichiers d'environnement disponibles:

- **`.env.local`** : Configuration active (utilisée par l'application)
- **`.env.development`** : Template pour développement local
- **`.env.local.backup`** : Sauvegarde de la configuration production

## 🗄️ Base de Données Locale

### Connexion Directe
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Réinitialisation
```bash
npx supabase db reset
```

### Migration
```bash
npx supabase db push
```

## 🔍 Vérification du Fonctionnement

### 1. Vérifier la Vue `profiles_public`
```sql
-- Se connecter à la base locale
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

-- Vérifier la vue
\d+ public.profiles_public
```

### 2. Tester la Fonction `get_user_phone`
```sql
-- Vérifier la fonction
\df+ public.get_user_phone
```

### 3. Vérifier les Variables d'Environnement
Dans le navigateur (Outils de développement → Console):
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Node Env:', import.meta.env.VITE_NODE_ENV);
```

## 🛡️ Sécurité Implémentée

### Vue `profiles_public`
- ✅ Exclut la colonne `phone` (protection des données)
- ✅ Accessible aux utilisateurs authentifiés et publics
- ✅ Création dynamique selon les colonnes disponibles

### Fonction `get_user_phone`
- ✅ Accès conditionnel aux numéros de téléphone
- ✅ 5 cas légitimes gérés
- ✅ Retourne `NULL` si pas d'accès autorisé

## 🐛 Dépannage

### Problèmes Communs

1. **Port 8081 déjà utilisé**
   ```bash
   # Trouver le processus
   lsof -i :8081
   # Tuer le processus
   kill -9 <PID>
   ```

2. **Supabase local ne démarre pas**
   ```bash
   # Vérifier Docker
   docker --version
   docker-compose --version

   # Nettoyer et redémarrer
   npx supabase stop
   docker system prune -f
   npx supabase start
   ```

3. **Erreur de connexion à la base**
   ```bash
   # Vérifier le statut
   npx supabase status

   # Réinitialiser complètement
   npx supabase stop
   npx supabase start
   ```

4. **Variables d'environnement non chargées**
   ```bash
   # Redémarrer le serveur de développement
   # Vérifier le fichier .env.local
   cat .env.local
   ```

### Logs Utiles

- **Serveur de développement**: Console du terminal `npm run dev`
- **Supabase**: `npx supabase logs`
- **Base de données**: Logs dans Supabase Studio

## 📝 Notes Développement

### Modifications Appliquées

1. **Correction Migration `20251005184738_90ada810-cce0-4c93-add1-0c3071f0d35c.sql`**
   - Vérification dynamique des colonnes
   - Protection des numéros de téléphone
   - Gestion robuste des erreurs

2. **Vue `profiles_public`**
   - Création dynamique selon schéma
   - Exclusion intentionnelle de `phone`
   - Permissions appropriées

3. **Fonction `get_user_phone`**
   - Sécurisation des accès
   - Vérification des colonnes existantes
   - Gestion des cas d'usage légitimes

### Bonnes Pratiques

- 🔄 Toujours tester les migrations en local avant déploiement
- 📝 Documenter les modifications de schéma
- 🔒 Utiliser la vue `profiles_public` pour l'affichage public
- 📱 Tester les fonctionnalités sensibles (auth, profils, messages)
- 💾 Sauvegarder régulièrement la configuration locale

---

**Dernière mise à jour**: 2025-10-21
**Statut**: ✅ Configuration fonctionnelle et testée