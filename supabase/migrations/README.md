# Supabase Migrations Documentation

Ce document décrit l'architecture complète de la base de données de l'application Mon Toit à travers ses migrations Supabase.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Types et Enums](#types-et-enums)
- [Structure des Tables](#structure-des-tables)
- [Sécurité et Permissions](#sécurité-et-permissions)
- [Relations et Clés Étrangères](#relations-et-clés-étrangères)
- [Indexes et Performance](#indexes-et-performance)
- [Configuration et Administration](#configuration-et-administration)
- [Utilisation Courante](#utilisation-courante)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

L'application Mon Toit utilise une architecture de base de données PostgreSQL avec Supabase, conçue pour une plateforme immobilière multi-rôles en Côte d'Ivoire.

### Caractéristiques Principales

- **Multi-tenancy** : 5 rôles d'utilisateurs distincts
- **Sécurité** : RLS (Row Level Security), audit complet, MFA
- **Géolocalisation** : Support PostGIS pour la cartographie
- **Médias** : Images, vidéos, tours 3D
- **Communications** : Messagerie, notifications, alerts
- **Analytics** : Suivi détaillé des activités
- **Signatures** : Documents signés numériquement

---

## 🏗️ Types et Enums

### Types Utilisateur (`user_type`)

```sql
CREATE TYPE user_type AS ENUM (
  'locataire',          # Locataire recherche de logement
  'proprietaire',       # Propriétaire de biens
  'agence',            # Agence immobilière
  'tiers_de_confiance', # Notaire, vérificateur
  'admin_ansut'        # Administrateur plateforme
);
```

### États des Processus

- **`application_status`** : `pending`, `approved`, `rejected`, `cancelled`, `expired`
- **`certificate_status`** : `pending`, `verified`, `expired`, `revoked`
- **`verification_status`** : `not_attempted`, `pending`, `verified`, `rejected`

---

## 📊 Structure des Tables

### 1. 👤 Utilisateurs et Authentification

#### `profiles` - Profil Principal
- **ID** : UUID correspondant à `auth.users`
- **Vérifications** : ONECI, CNAM, faciale
- **Préférences** : Densité UI, méthode MFA
- **Localisation** : Ville, pays (+225 par défaut)

#### `user_roles` & `user_active_roles` - Gestion des Rôles
- Support multi-rôles par utilisateur
- Rôle actif avec basculement possible
- Historique des changements de rôle

#### `user_sessions` - Sessions Utilisateurs
- Token de session unique
- Tracking IP et user agent
- Expiration automatique

### 2. ✅ Vérifications et Certificats

#### `user_verifications` - Statuts de Vérification
- **ONECI** : Carte d'identité
- **CNAM** : Assurance maladie
- **Face** : Reconnaissance faciale
- **Scoring** : Score de fiabilité locataire

#### `digital_certificates` - Certificats Numériques
- Numéro de certificat unique
- Signatures numériques
- Historique de vérification
- Révocation possible

#### `phone_verifications` - Vérification Téléphonique
- Méthodes : SMS, appel, WhatsApp
- Limitation des tentatives
- Tracking des pays

### 3. 🏠 Propriétés Immobilières

#### `properties` - Biens Immobiliers
- **Localisation** : Coordonnées GPS, quartier
- **Caractéristiques** : Surface, chambres, salles de bain
- **Équipements** : AC, parking, jardin, mobilier
- **Prix** : Loyer mensuel, charges, dépôt de garantie
- **Médias** : Images, vidéos, tours 3D
- **Travaux** : Statut et description des travaux

#### `property_media` - Fichiers Médias
- Types : image, video, floor_plan, panoramic, virtual_tour
- Ordre d'affichage configurable
- Métadonnées EXIF

#### `property_utility_costs` - Coûts des Services
- Électricité, eau, internet, entretien
- Fréquence : mensuel, trimestriel, annuel
- Inclus ou non dans le loyer

#### `property_work` - Travaux et Rénovations
- Statut : none, planned, in_progress, completed
- Coûts estimés et durée
- Informations sur l'entrepreneur

### 4. 📋 Location et Candidatures

#### `rental_applications` - Candidatures de Location
- **Scoring IA** : Évaluation automatique
- **Documents** : Pièces jointes vérifiées
- **Vérifications** : Background, crédit, références
- **Préférences** : Budget, localisation, équipements
- **Suivi** : Rappels automatiques, deadlines

#### `application_documents` - Documents des Candidatures
- Types : id_card, proof_of_income, guaranty, etc.
- Statuts de vérification
- Métadonnées de fichiers

#### `leases` - Baux de Location
- **Termes légaux** : Dates, montant, dépôt
- **Pénalités** : Frais de retard, grace period
- **Renouvellement** : Auto-renouvellement configurable
- **Signatures** : URLs des documents signés

#### `lease_terms` - Conditions Spécifiques
- Types : rental_terms, security_deposit, late_fees, etc.
- Conditions personnalisables par bail

### 5. 🏢 Agences et Mandats

#### `agency_mandates` - Mandats de Gestion
- Types : exclusive, non-exclusive
- Commission : Taux ou frais fixe
- Territoire et budget marketing
- Responsabilités et restrictions

### 6. 💰 Paiements

#### `payments` - Transactions Financières
- **Multi-devises** : XOF par défaut
- **Gateways** : Intégration CinetPay, etc.
- **Refunds** : Gestion des remboursements
- **Métadonnées** : Réponses des gateways

### 7. 💬 Communications

#### `conversations` - Discussions
- Participants : user1_id, user2_id
- Contexte : property_id optionnel
- Chronologie : last_message_at

#### `messages` - Messages
- **Priorités** : normal, high, urgent
- **Statuts** : sent, delivered, read, replied
- **Attachments** : Fichiers joints
- **Expiration** : Messages temporaires possibles

#### `notifications` - Notifications Utilisateurs
- Types : info, warning, error, success
- Métadonnées contextuelles
- Expiration configurable

#### `notification_preferences` - Préférences par Catégorie
- Catégories : recommendations, messages, visits, etc.
- Canaux : email, SMS, push
- Fréquence : immediate, daily, weekly, never
- Quiet hours : Plages horaires silencieuses

### 8. 📈 Analytics et Visites

#### `property_visits` - Visites Programmées
- Statuts : scheduled, completed, cancelled, no_show
- Tracking des visites par propriété

#### `property_analytics` - Statistiques de Vues
- Vues totales et uniques par jour
- Tracking des performances des annonces

#### `search_history` - Historique de Recherche
- Filtres de recherche JSON
- Nombre de résultats
- Optimisation des recommandations

#### `user_favorites` - Favoris
- Bookmark des propriétés intéressantes

### 9. 🔒 Sécurité et Audit

#### `security_audit_logs` - Logs d'Audit
- Actions CRUD sur toutes les tables
- Tracking IP et user agent
- Détails JSON des changements

#### `security_events` - Événements de Sécurité
- Sévérité : low, medium, high, critical
- Types : login_failure, permission_denied, etc.
- Corrélation d'événements

#### `login_attempts` - Tentatives de Connexion
- Tracking des succès/échecs
- Blocage automatique après tentatives
- Fingerprinting des appareils

#### `electronic_signature_logs` - Signatures Numériques
- Audit trail complet des signatures
- Tokens de vérification
- Métadonnées de l'appareil

### 10. 🔐 OTP et SMS

#### `otp_codes` - Codes à Usage Unique
- Email + code temporaire
- Expiration configurable
- Tracking d'utilisation

#### `otp_verifications` - Tokens OTP Chiffrés
- Types : signup, reset_password, email_change
- Chiffrement des tokens
- Expiration automatique

#### `sms_verification_codes` - Codes SMS
- Hash des codes pour sécurité
- Limitation des tentatives
- Multi-pays (+225 par défaut)

#### `sms_delivery_logs` - Logs de Livraison SMS
- Statuts de livraison
- Coûts et provider response
- Tracking des échecs

#### `sms_rate_limits` - Limites Anti-Spam
- Par téléphone, IP, ou user_id
- Fenêtre temporelle configurable
- Blocage automatique

### 11. ⚙️ Préférences et Alertes

#### `user_preferences` - Préférences Utilisateur
- Thème : light/dark
- Langue : fr par défaut
- Budget et zones préférées
- Notifications activées/désactivées

#### `property_alerts` - Alertes Automatiques
- Critères de recherche JSON
- Fréquence de notification
- Historique des envois

### 12. 🛠️ Administration

#### `role_change_requests` - Changements de Rôle
- Workflow d'approbation
- Documents justificatifs
- Historique des décisions

#### `user_roles_summary` - Statistiques par Rôle
- Agrégation des comptes utilisateurs
- Utilisateurs vérifiés/non-vérifiés
- Croissance mensuelle

#### `processing_config` - Configuration Système
- Clé-valeur pour paramètres
- Catégorisation des options
- Historique des modifications

#### `disputes` - Litiges
- Workflow de résolution
- Evidence et documents
- Statut de résolution

#### `reviews` - Avis et Modération
- Notation 1-5 étoiles
- Modération des contenus
- Validation par administrateur

### 13. 🗺️ Spatial

#### `spatial_ref_sys` - Système de Référence PostGIS
- Support des projections géographiques
- Pour analyses spatiales avancées

---

## 🔐 Sécurité et Permissions

### Row Level Security (RLS)

Toutes les tables implémentent des politiques RLS :

```sql
-- Exemple de politique RLS pour les profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Rôles et Permissions

- **`anon`** : Utilisateurs non authentifiés (lecture publique limitée)
- **`authenticated`** : Utilisateurs connectés (accès selon profil)
- **`service_role`** : Services backend (accès complet)

### Fonctions RPC

Fonctions sécurisées pour opérations complexes :

- `check_login_rate_limit(email)` : Vérification anti-brute-force
- `update_user_role(user_id, new_role)` : Changement de rôle
- `verify_otp_code(email, code)` : Vérification OTP

---

## 🔗 Relations et Clés Étrangères

### Diagramme des Relations Principales

```
profiles (1) ──────── (N) properties
   │                      │
   │                      │
   │                      └── (1) ── (N) rental_applications
   │                                │
   │                                └── (1) ── (N) application_documents
   │
   └── (1) ── (N) user_roles
               │
               └── (1) ── (N) leases
                          │
                          └── (1) ── (N) lease_terms

properties (1) ── (N) property_media
   │
   └── (1) ── (N) property_visits
```

### Intégrité Référentielle

- Toutes les clés étrangères avec `ON DELETE RESTRICT`
- Contraintes `CHECK` sur les données critiques
- Triggers pour les timestamps automatiques

---

## 📊 Indexes et Performance

### Indexes Stratégiques

```sql
-- Recherche géospatiale
CREATE INDEX idx_properties_location ON properties USING GIST (point(longitude, latitude));

-- Recherche par prix
CREATE INDEX idx_properties_rent ON properties (monthly_rent);

-- Recherche textuelle
CREATE INDEX idx_properties_search ON properties USING GIN (to_tsvector('french', title || ' ' || description));

-- Sessions utilisateurs
CREATE INDEX idx_user_sessions_active ON user_sessions (user_id, is_active, expires_at);
```

### Partitionnement (Recommandé)

Pour tables à forte croissance :

- `security_audit_logs` : Partitionnement mensuel
- `property_analytics` : Partitionnement par propriété+mois
- `sms_delivery_logs` : Partitionnement hebdomadaire

---

## ⚙️ Configuration et Administration

### Variables d'Environnement

```bash
# Supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Services Externes
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
CINETPAY_API_KEY=...

# Sécurité
JWT_SECRET=...
OTP_EXPIRY_MINUTES=10
MAX_LOGIN_ATTEMPTS=5
```

### Backup et Recovery

- **Backups automatiques** : Quotidiens (Supabase)
- **Point-in-time recovery** : 7 jours
- **Export manuel** : `pg_dump` disponible
- **Cross-region replication** : Optionnel

---

## 🚀 Utilisation Courante

### Lancement des Migrations

```bash
# Appliquer toutes les migrations
supabase db push

# Appliquer une migration spécifique
supabase migration up 20240101_create_properties.sql

# Créer une nouvelle migration
supabase migration new add_new_feature.sql
```

### Seed de Données

```bash
# Charger les données de test
supabase db seed

# Données incluses :
# - 17 utilisateurs avec rôles variés
# - 30+ propriétés dans Abidjan
# - Exemples de candidatures et baux
# - Configuration de base
```

### Monitoring

```sql
-- Vérifier les connexions actives
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Taille des tables
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Performance des requêtes
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;
```

---

## 🔧 Dépannage

### Problèmes Courants

#### 1. RLS Policies Bloquantes

```sql
-- Vérifier les politiques actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Désactiver temporairement pour debug
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

#### 2. Connexions Expirées

```sql
-- Nettoyer les sessions expirées
DELETE FROM user_sessions
WHERE expires_at < NOW() OR is_active = false;
```

#### 3. Limites de SMS Dépassées

```sql
-- Vérifier les limites actives
SELECT * FROM sms_rate_limits
WHERE is_blocked = true
  AND block_until > NOW();

-- Réinitialiser les limites
UPDATE sms_rate_limits
SET is_blocked = false, block_until = NULL
WHERE identifier = '+22512345678';
```

#### 4. Performance des Requêtes

```sql
-- Analyser les requêtes lentes
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Recommander des indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'properties';
```

### Logs et Debug

```sql
-- Logs de sécurité récents
SELECT * FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND severity IN ('high', 'critical')
ORDER BY created_at DESC;

-- Tentatives de connexion suspectes
SELECT email, COUNT(*) as attempts,
       MAX(created_at) as last_attempt
FROM login_attempts
WHERE success = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 3;
```

---

## 📚 Bonnes Pratiques

### Sécurité

1. **Jamais exposer** `service_role_key` côté client
2. **Valider toutes les entrées** côté serveur
3. **Utiliser HTTPS** obligatoirement
4. **Limiter les requêtes** avec des indexes appropriés
5. **Surveiller les logs** d'audit régulièrement

### Performance

1. **Indexer** les colonnes de recherche fréquentes
2. **Éviter les N+1** avec des jointures appropriées
3. **Utiliser des vues matérialisées** pour données lourdes
4. **Partitionner** les tables à forte croissance
5. **Maintenir les statistiques** avec `ANALYZE`

### Développement

1. **Versionner** toutes les migrations
2. **Tester** avec des données réalistes
3. **Documenter** les changements de schema
4. **Utiliser des transactions** pour modifications multiples
5. **Backup** avant modifications majeures

---

## 📞 Support

Pour toute question sur les migrations ou la base de données :

- **Documentation Supabase** : https://supabase.com/docs
- **PostgreSQL Docs** : https://postgresql.org/docs/
- **Issues GitHub** : Créer une issue dans le repository

---

*Dernière mise à jour : 27 Octobre 2024*