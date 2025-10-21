# Product Backlog — Mon Toit (Certifié ANSUT)

Priorisation indicative: P0 (critique), P1 (important), P2 (amélioration). Les items sont groupés par épics.

## Epic A — Authentification & Sécurité
- PB-A1 (P0): Connexion/Inscription Email + OAuth (Google, Apple, Facebook, Microsoft)
  - AC: Redirection OAuth fonctionnelle, erreurs gérées, rate limiting actif.
- PB-A2 (P0): 2FA (TOTP) pour rôles sensibles (admin)
  - AC: Flux 2FA complet, fallback déconnexion.
- PB-A3 (P1): Journalisation sécurité (login_attempts), alertes activités suspectes
  - AC: Insertion logs, alertes via edge function.

## Epic B — Découverte & Recherche
- PB-B1 (P0): Filtres (ville, type, prix) + vues (grille/liste/carte)
  - AC: Filtres cumulables, persistés; carte restreinte aux biens géolocalisés.
- PB-B2 (P1): Recommandations personnalisées
  - AC: Bloc visible si connecté; traçage clics.
- PB-B3 (P2): Pages éditoriales (Guide, A propos, Tarifs)
  - AC: SEO basique (title/description/canonical).

## Epic C — Détail du Bien & Confiance
- PB-C1 (P0): Galerie média (images/vidéo/360), infos clés, disponibilité
  - AC: Badges de statut; favoris; CTA candidature/visite.
- PB-C2 (P1): Sections Transparence (Titre de propriété, Travaux)
  - AC: Upload + affichage conditionnel.

## Epic D — Candidatures, Visites & Messagerie
- PB-D1 (P0): Candidater à un bien + suivi statut
  - AC: Redirection auth si nécessaire; statut visible.
- PB-D2 (P1): Planifier une visite
  - AC: Confirmation + trace.
- PB-D3 (P1): Messagerie propriétaire-locataire
  - AC: Notifications badge; fil par bien.

## Epic E — Biens & Mandats (Propriétaires/Agences)
- PB-E1 (P0): CRUD Biens
  - AC: Validation; apparition dans recherche.
- PB-E2 (P1): Mandats Agence
  - AC: Liaison agence-propriété; statut actif.
- PB-E3 (P1): Tableau de bord analytique propriétaire/agence
  - AC: Vues/favoris/candidatures agrégés.

## Epic F — Baux, Signatures & Paiements
- PB-F1 (P1): Génération de bail (PDF)
  - AC: Métadonnées complètes; partage/consultation.
- PB-F2 (P0): Paiement loyer (Mobile Money)
  - AC: Reçus, statuts paiement synchronisés.

## Epic G — Vérifications & Certifications
- PB-G1 (P0): Vérification ONECI/CNAM
  - AC: Statuts visibles; erreurs gérées.
- PB-G2 (P1): Certifications ANSUT (workflow admin)
  - AC: Requested/approved/rejected; motif.

## Epic H — PWA, Mobile & Accessibilité
- PB-H1 (P1): PWA Install + Offline
  - AC: Prompt install; page Offline.
- PB-H2 (P0): Navbar/BottomNav mobile cohérente
  - AC: Offsets unifiés; CTA Connexion explicite si non connecté.
- PB-H3 (P1): Accessibilité (contrast, focus, skip link)
  - AC: Audit basique AA.

## Epic I — Administration & Conformité
- PB-I1 (P0): RLS Policies testées
  - AC: Tests passent; matrices d’accès à jour.
- PB-I2 (P1): Modération avis/annonces
  - AC: Actions auditées; notifications.
- PB-I3 (P1): Rapports mensuels
  - AC: Génération + envoi.

---

## Definition of Ready (DoR)
- User story claire (personna, objectif, valeur).
- AC testables; dépendances identifiées.
- Impact sécurité/privacité évalué.

## Definition of Done (DoD)
- AC satisfaits; tests (unitaires/intégration) verts.
- RLS et erreurs gérées; logs nécessaires en place.
- UI responsive + accessible (a11y basique) + i18n fr.
- Documentation mise à jour.
