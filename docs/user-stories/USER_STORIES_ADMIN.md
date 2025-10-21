# User Stories — Admin / Super Admin (ANSUT)

Contexte: L’admin supervise la conformité (certifications ANSUT), la sécurité (RLS, MFA, logs), et la qualité (modération, audits).

## Accès & Sécurité
- En tant qu’admin, je veux me connecter avec MFA obligatoire afin de sécuriser l’accès au backoffice.
  - AC-1: MFA activé pour les comptes admin; redirection vers 2FA si nécessaire.
- En tant qu’admin, je veux consulter les journaux (login_attempts, actions) afin d’auditer la plateforme.
  - AC-1: Filtre par période, utilisateur, succès/échec.

## Certifications & Vérifications
- En tant qu’admin, je veux traiter les demandes de certification ANSUT afin de valider les comptes et les baux.
  - AC-1: Statuts « requested/approved/rejected » avec motifs.
- En tant qu’admin, je veux surveiller les vérifications ONECI/CNAM afin d’assurer l’authenticité des profils.
  - AC-1: Tableaux de synthèse par période.

## Modération & Qualité
- En tant qu’admin, je veux modérer les avis utilisateurs et les annonces suspectes afin de préserver la qualité.
  - AC-1: Actions « approuver/retirer/masquer » journalisées.
- En tant qu’admin, je veux des alertes d’activité suspecte (fraude) afin d’agir rapidement.
  - AC-1: Notifications en cas d’anomalies (supabase/functions/alert-suspicious-activity).

## Politiques & Conformité
- En tant qu'admin, je veux appliquer les RLS et policies afin de garantir l'isolement des données.
  - AC-1: Tests RLS passent (tests/security/rls-policies.test.ts).
  - AC-2: Matrice d'accès maintenue dans /docs/security/rls-matrix.md.
  - AC-3: Validation des permissions par rôle (locataire, propriétaire, agence, admin).
  - AC-4: Tests négatifs pour accès non autorisés avec erreurs 403.
  - AC-5: CI/CD integration pour exécution automatique des tests RLS.
- En tant qu'admin, je veux publier des rapports mensuels afin de suivre la performance.
  - AC-1: Génération PDF/email si activée.
  - AC-2: Métriques clés : utilisateurs actifs, biens publiés, candidatures, conversions.
  - AC-3: Comparaison mois vs mois précédent et année précédente.
  - AC-4: Segmentation par type d'utilisateur et région géographique.
  - AC-5: Export CSV pour analyse externe si nécessaire.

