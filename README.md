# 🏠 Mon Toit - Plateforme Immobilière Certifiée ANSUT

**La première plateforme immobilière certifiée en Côte d'Ivoire**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SOMET1010/mon-toit)

---

## 🌟 Fonctionnalités

### 🎨 Interface Moderne
- ✅ Design premium avec gradients animés
- ✅ Patterns culturels ivoiriens (Kente, Akan, Bogolan)
- ✅ Typographie professionnelle (Poppins + Inter)
- ✅ Sidebar moderne avec icônes colorées
- ✅ Hero avec image de fond Abidjan

### 🗺️ Carte Intelligente
- ✅ Clustering des biens avec Supercluster
- ✅ Heatmap des prix
- ✅ 28 POI en 6 catégories
- ✅ 10 quartiers d'Abidjan délimités
- ✅ Analyse de quartier avec scores
- ✅ Filtres avancés en temps réel

### 📱 PWA Mobile
- ✅ Installable sur Android et iOS
- ✅ Bottom Navigation native
- ✅ Swipe gestures
- ✅ Pull to refresh
- ✅ Splash screen animé
- ✅ Mode hors ligne

### 🤖 Application Native (Capacitor)
- ✅ APK Android prêt
- ✅ IPA iOS prêt
- ✅ 7 plugins natifs (géolocalisation, notifications, etc.)

### 🔐 Sécurité & Certification
- ✅ Authentification multi-facteurs (MFA)
- ✅ Système de rôles (propriétaire, locataire, agence, tiers de confiance)
- ✅ Certification ANSUT intégrée
- ✅ Signatures électroniques et contrats certifiés

---

## 🚀 Développement Local

### Prérequis
- Node.js 18+
- npm ou yarn

### 1. Installation

```bash
git clone https://github.com/SOMET1010/mon-toit.git
cd mon-toit
npm install
```

### 2. Configuration

Créez `.env.local` (les valeurs Supabase sont déjà en fallback dans le code) :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_MAPBOX_PUBLIC_TOKEN=votre_token_mapbox
```

### 3. Démarrer le développement

```bash
# Serveur de développement (port 8080)
npm run dev

# Build de développement
npm run build:dev

# Build de production
npm run build

# Linter le code
npm run lint

# Prévisualiser le build
npm run preview
```

### 4. Application Mobile

```bash
# Synchroniser avec les plateformes natives
npx cap sync

# Ouvrir Android Studio
npx cap open android

# Ouvrir Xcode
npx cap open ios

# Tester sur device/emulator
npx cap run android
npx cap run ios
```

### 5. Déploiement

**Vercel (recommandé) :**
```bash
npm install -g vercel
vercel login
vercel
```

Ou directement via https://vercel.com/new

**Capacitor (Production Mobile) :**
```bash
# Build pour mobile
npm run build
CAPACITOR=true npm run build
npx cap sync
```

---

## 📊 Stack Technique

- **Frontend** : React 18 + TypeScript + Vite 5
- **UI Framework** : Tailwind CSS 3 + shadcn/ui + Radix UI
- **Animations** : Framer Motion + React Spring
- **State Management** : TanStack Query + React Context
- **Forms** : React Hook Form + Zod validation
- **Database** : Supabase (PostgreSQL) avec RLS
- **Maps** : Mapbox GL JS + Supercluster clustering
- **Mobile** : Vite PWA + Capacitor 7
- **Monitoring** : Sentry (temporairement désactivé)
- **Hosting** : Vercel avec sécurité renforcée

---

## 📁 Architecture du Projet

```
mon-toit/
├── android/                  # Application Android native
├── ios/                      # Application iOS native
├── scripts/                  # Scripts de base de données
├── src/
│   ├── components/           # Composants React réutilisables
│   │   ├── admin/           # Composants administration
│   │   ├── agency/          # Composants agences
│   │   ├── auth/            # Authentification
│   │   ├── dashboard/       # Widgets et tableaux de bord
│   │   └── navigation/      # Navigation mobile
│   ├── hooks/               # Hooks personnalisés (50+ hooks)
│   ├── lib/                 # Utilitaires et configuration
│   │   ├── supabase.ts      # Client base de données
│   │   └── queryClient.ts   # Configuration TanStack Query
│   ├── pages/               # Pages des routes (30+ pages)
│   │   ├── AdminDashboard.tsx
│   │   ├── TenantDashboard.tsx
│   │   ├── AgencyDashboard.tsx
│   │   └── OwnerDashboard.tsx
│   └── data/                # Données statiques et constantes
├── public/                  # Assets statiques et PWA
├── vercel.json              # Configuration Vercel avec sécurité
├── capacitor.config.ts      # Configuration application native
├── vite.config.ts           # Configuration build avec optimisations
└── CLAUDE.md               # Documentation pour développeurs
```

### Architecture Multi-tenant

Le projet utilise une architecture multi-tenant avec 4 types d'utilisateurs :

- **propriétaire** : Gestion des biens et candidatures
- **locataire** : Recherche et suivi des locations
- **agence** : Gestion de portefeuille et mandats
- **tiers_de_confiance** : Certification et médiation

### Performance & Optimisations

- **Code splitting** automatique par route et fonctionnalité
- **Cache intelligent** avec TanStack Query et Workbox
- **Images optimisées** avec compression WebP
- **Préchargement** des routes stratégiques
- **PWA** avec support hors-ligne

### Sécurité

- **RLS (Row Level Security)** sur toutes les tables Supabase
- **Authentification multi-facteurs** pour les admins
- **CORS et headers** de sécurité configurés
- **Rôles et permissions** gérés au niveau composant

---

## 🛠️ Commandes Utiles

- Synchroniser la base Supabase (migrations locales -> prod):
  - Installer Supabase CLI: https://supabase.com/docs/guides/cli
  - Lier le projet: `supabase link --project-ref <project-ref>`
  - Pousser les migrations: `supabase db push`

- Variables d’environnement (client):
  - `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` uniquement côté client
  - Ne jamais exposer de `service_role`

Consultez `docs/DEPLOYMENT_NETLIFY_SUPABASE.md` pour les détails Netlify/Supabase.

### Développement
```bash
npm run dev              # Serveur de développement
npm run build            # Build production optimisé
npm run build:dev        # Build développement rapide
npm run lint             # Vérification du code
npm run preview          # Prévisualisation du build
```

### Mobile (Capacitor)
```bash
npx cap sync             # Synchroniser les assets
npx cap open android     # Ouvrir Android Studio
npx cap open ios         # Ouvrir Xcode
npx cap run android      # Tester sur Android
npx cap run ios          # Tester sur iOS
```

### Debug
```bash
# Vider le cache local
npm run build -- --force

# Variables d'environnement
echo $VITE_SUPABASE_URL
```

---

## 📞 Contact

- **Site Web** : https://mon-toit.vercel.app
- **GitHub** : https://github.com/SOMET1010/mon-toit
- **Email** : contact@montoit.ci

---

**Fait avec ❤️ en Côte d'Ivoire 🇨🇮**
