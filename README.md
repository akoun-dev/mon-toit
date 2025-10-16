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
- ✅ 7 plugins natifs

---

## 🚀 Déploiement Rapide

### 1. Cloner le repo

```bash
git clone https://github.com/SOMET1010/mon-toit.git
cd mon-toit
npm install
```

### 2. Configurer Supabase

1. Créez un projet sur https://supabase.com
2. Exécutez le SQL dans `scripts/seed-supabase.sql`
3. Copiez les clés API

### 3. Variables d'environnement

Créez `.env.local` :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1...
```

### 4. Tester localement

```bash
npm run dev
```

### 5. Déployer sur Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Ou via https://vercel.com/new

---

## 📊 Stack Technique

- **Frontend** : React 18 + TypeScript + Vite 5
- **Styling** : Tailwind CSS 3 + shadcn/ui
- **Animations** : Framer Motion
- **Database** : Supabase (PostgreSQL)
- **Maps** : Mapbox GL JS + Supercluster
- **Mobile** : Vite PWA + Capacitor 6
- **Hosting** : Vercel

---

## 📁 Structure

```
mon-toit/
├── android/              # Android (Capacitor)
├── ios/                  # iOS (Capacitor)
├── scripts/              # Scripts seed
├── src/
│   ├── components/       # Composants React
│   ├── data/             # Données statiques
│   ├── hooks/            # Hooks personnalisés
│   ├── pages/            # Pages
│   └── styles/           # Styles
├── vercel.json           # Config Vercel
└── capacitor.config.ts   # Config Capacitor
```

---

## 📞 Contact

- **Site Web** : https://mon-toit.vercel.app
- **GitHub** : https://github.com/SOMET1010/mon-toit
- **Email** : contact@montoit.ci

---

**Fait avec ❤️ en Côte d'Ivoire 🇨🇮**

