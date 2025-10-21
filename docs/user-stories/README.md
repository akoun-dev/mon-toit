# User Stories — Mon Toit (Certifié ANSUT)

Ce dossier contient toutes les user stories pour la plateforme Mon Toit, organisées par profil utilisateur et par fonctionnalités.

## Structure des User Stories

### 📂 Fichiers Principaux

| Fichier | Contenu | User Stories | Priorités |
|---------|---------|--------------|-----------|
| `USER_STORIES_LOCATAIRE.md` | Fonctionnalités locataire (recherche, candidature, visite) | 14 | P0, P1, P2 |
| `USER_STORIES_PROPRIETAIRE.md` | Fonctionnalités propriétaire (publication, gestion) | 12 | P0, P1 |
| `USER_STORIES_AGENCE.md` | Fonctionnalités agence (portefeuille, mandats) | 9 | P0, P1 |
| `USER_STORIES_ADMIN.md` | Fonctionnalités admin (sécurité, modération) | 8 | P0, P1 |
| `USER_STORIES_TIERS_DE_CONFIANCE.md` | Tiers de confiance (vérifications) | 4 | P1 |

### 📂 Fichiers Complémentaires (Créés suite à l'audit)

| Fichier | Contenu | User Stories | Couverture Epic |
|---------|---------|--------------|-----------------|
| `USER_STORIES_MOBILE_PWA.md` | Mobile, PWA, accessibilité, notifications | 25+ | Epic H (100%) |
| `USER_STORIES_ADMIN_SECU.md` | Sécurité avancée, tests RLS, monitoring | 15+ | Epic I (100%) |
| `USER_STORIES_EDITORIAL.md` | Pages éditoriales, SEO, contenu | 12+ | Epic B (100%) |
| `USER_STORIES_TIERS_ET_COMPLEMENTS.md` | Workflow tiers de confiance, fonctionnalités avancées | 20+ | Epic G + améliorations |

## 📊 Couverture des Product Backlog Items

### ✅ Couverture Complète (100%)
- **Epic A** — Authentification & Sécurité (3/3 items)
- **Epic C** — Détail du Bien & Confiance (2/2 items)
- **Epic D** — Candidatures, Visites & Messagerie (3/3 items)
- **Epic E** — Biens & Mandats (3/3 items)
- **Epic F** — Baux, Signatures & Paiements (2/2 items)

### 🔄 Couverture Améliorée (après implémentation)
- **Epic B** — Découverte & Recherche (3/3 items) ✅
- **Epic G** — Vérifications & Certifications (2/2 items) ✅
- **Epic H** — PWA, Mobile & Accessibilité (3/3 items) ✅
- **Epic I** — Administration & Conformité (3/3 items) ✅

## 📈 Statistiques

| Métrique | Valeur |
|----------|--------|
| **Total Product Backlog Items** | 24 |
| **User Stories Créées** | 120+ |
| **Taux de Couverture** | 100% ✅ |
| **User Stories P0 (Critiques)** | 45+ |
| **User Stories P1 (Importantes)** | 50+ |
| **User Stories P2 (Améliorations)** | 25+ |

## 🎯 Priorités d'Implémentation

### Sprint 1-2 (Fondation)
1. **Authentification complète** (Epic A)
2. **Recherche avec vues multiples** (Epic B)
3. **Publication biens de base** (Epic E)

### Sprint 3-4 (Core Features)
1. **Candidatures et suivi** (Epic D)
2. **Mobile et responsive design** (Epic H)
3. **Sécurité et RLS** (Epic I)

### Sprint 5-6 (Advanced)
1. **PWA et offline** (Epic H)
2. **Pages éditoriales SEO** (Epic B)
3. **Workflow tiers de confiance** (Epic G)

### Sprint 7+ (Scale)
1. **Fonctionnalités avancées**
2. **Analytics et optimisations**
3. **Intégrations externes**

## 🔗 Références Croisées

### Product Backlog → User Stories
- PB-A1 → US-LOC-01, US-PROP-01 (Authentification OAuth)
- PB-B1 → US-LOC-02, US-MOB-01 (Filtres et vues)
- PB-H2 → US-MOB-02, US-MOB-03 (Navigation mobile)
- PB-I1 → US-ADMIN-07, US-SEC-01 (Tests RLS)

### User Stories → Epics
- **US-LOC-\*** : Epic B (Découverte) + Epic D (Candidatures)
- **US-PROP-\*** : Epic E (Biens) + Epic F (Baux)
- **US-MOB-\*** : Epic H (Mobile & PWA)
- **US-SEC-\*** : Epic I (Administration & Sécurité)

## 📋 Format des User Stories

Chaque user story suit le format standard :

```
En tant que [persona], je veux [action] afin de [objectif].
  - AC-1: [Acceptance Criterion 1]
  - AC-2: [Acceptance Criterion 2]
  - ...
```

### Personas Identifiés
- **Locataire** : Recherche, visite, location de biens
- **Propriétaire** : Publication, gestion de biens
- **Agence** : Gestion multi-biens, mandats
- **Admin** : Supervision, sécurité, modération
- **Tiers de confiance** : Vérifications documents
- **Utilisateur mobile** : Expérience mobile native
- **Visiteur SEO** : Découverte via moteurs de recherche

## 🔄 Mise à Jour

Les user stories sont maintenues activivement :
- **Ajout** : Nouvelles fonctionnalités requises
- **Mise à jour** : Feedback utilisateurs et évolution besoins
- **Priorisation** : Réalignement avec objectifs business

Pour toute modification, créer une PR sur ce dossier avec justification des changements.

---
*Document maintenu par l'équipe produit Mon Toit*
*Dernière mise à jour : 21 octobre 2025*