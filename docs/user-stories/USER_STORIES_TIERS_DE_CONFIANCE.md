# User Stories — Tiers de Confiance

Contexte: Un « tiers de confiance » (par ex. partenaire de vérification) intervient pour valider certains éléments (identités, documents) et assurer la conformité.

## Accès & Rôle
- En tant que tiers de confiance, je veux accéder à un tableau de bord dédié afin de traiter les tâches de vérification.
  - AC-1: L’accès est restreint au rôle `tiers_de_confiance`.

## Vérifications déléguées
- En tant que tiers de confiance, je veux valider des documents (ex: titres de propriété) fournis par les propriétaires afin de confirmer leur authenticité.
  - AC-1: Statuts « en attente / validé / rejeté » + commentaire requis en cas de rejet.
- En tant que tiers de confiance, je veux suivre les demandes en file afin d’optimiser mon temps de traitement.
  - AC-1: Tri par priorité/date.

## Suivi & Reporting
- En tant que tiers de confiance, je veux générer un compte-rendu d’activité (période, volume traité, % validés) afin de rendre compte à l’ANSUT.
  - AC-1: Export ou affichage synthétique.

