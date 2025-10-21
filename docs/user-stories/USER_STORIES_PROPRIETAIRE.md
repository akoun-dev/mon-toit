# User Stories — Propriétaire (Owner)

Contexte: Un propriétaire publie et gère ses biens, suit les candidatures, signe des baux et encaisse les loyers de façon sécurisée.

## Authentification & Vérification
- En tant que propriétaire, je veux créer un compte ou me connecter (OAuth/Email) afin d’accéder à mon espace.
  - AC-1: OAuth Google/Apple/Facebook/Microsoft fonctionnel.
- En tant que propriétaire, je veux vérifier mon identité (ONECI/CNAM) afin d’augmenter la confiance des locataires.
  - AC-1: Le badge s’affiche dans mon profil une fois validé.

## Publication & Gestion des biens
- En tant que propriétaire, je veux publier un bien (photos, description, loyer, localisation) afin de le proposer à la location.
  - AC-1: Les champs obligatoires sont validés et l’annonce apparaît dans les résultats.
- En tant que propriétaire, je veux modifier/supprimer un bien afin de tenir mes annonces à jour.
  - AC-1: Les changements se reflètent sur la page détail.
- En tant que propriétaire, je veux indiquer le statut de travaux et télécharger des justificatifs (titres) afin d’améliorer la transparence.
  - AC-1: Les sections « Travaux » et « Titre de propriété » s’affichent.

## Suivi des candidatures & Sélection
- En tant que propriétaire, je veux visualiser les candidatures reçues avec score locataire afin de prioriser les profils.
  - AC-1: Tri/filtre par score et date.
- En tant que propriétaire, je veux accepter/refuser une candidature afin d’avancer vers la signature du bail.
  - AC-1: Le statut de la candidature est mis à jour et notifié.

## Baux, Signatures & Paiements
- En tant que propriétaire, je veux générer/partager un contrat digital afin de formaliser la location.
  - AC-1: Le PDF est généré/consultable (si configuré).
- En tant que propriétaire, je veux encaisser le loyer via Mobile Money afin de sécuriser les paiements.
  - AC-1: Un reçu est archivé et le statut du paiement est mis à jour.

## Analytique & Performance
- En tant que propriétaire, je veux consulter les statistiques (vues, favoris, candidatures) par bien afin d’optimiser mes annonces.
  - AC-1: Tableau de bord avec métriques agrégées.

## Communication & Support
- En tant que propriétaire, je veux discuter avec les candidats via la messagerie afin de répondre à leurs questions.
  - AC-1: Historique des messages disponible par bien.
- En tant que propriétaire, je veux recevoir des notifications (email/in-app) sur les nouveaux événements afin de réagir vite.
  - AC-1: Badges de notifications visibles sur la Navbar/Sidebar.

