# User Stories — Admin Sécurité & Tests (Complément)

Contexte: Ce document complète les user stories admin existantes avec un focus sur la sécurité, les tests RLS et la conformité technique.

## Tests RLS Policies & Sécurité
- En tant qu'admin, je veux exécuter une suite de tests RLS complète afin de valider l'isolement des données entre utilisateurs.
  - AC-1: Tests automatisés pour chaque rôle (locataire, propriétaire, agence, admin).
  - AC-2: Validation des policies sur tables sensibles (profiles, properties, applications, messages).
  - AC-3: Tests négatifs : tentative d'accès non autorisé doit échouer avec erreur 403.
  - AC-4: Matrice d'accès documentée et maintenue dans /docs/security/rls-matrix.md.
  - AC-5: Intégration CI/CD pour exécuter les tests RLS à chaque PR.

- En tant qu'admin, je veux auditer les permissions SQL afin d'identifier les failles de sécurité potentielles.
  - AC-1: Script d'audit générant un rapport des permissions par utilisateur/rôle.
  - AC-2: Vérification des policies cascades et des exceptions potentielles.
  - AC-3: Alertes automatiques si une policy est modifiée en production.
  - AC-4: Historique des changements de policies avec auteur et justification.
  - AC-5: Tests d'injection SQL et validation des inputs côté serveur.

## Monitoring & Alertes Sécurité
- En tant qu'admin, je veux un dashboard de surveillance sécurité en temps réel afin de détecter les activités suspectes.
  - AC-1: Vue des tentatives de connexion (succès/échec) avec géolocalisation.
  - AC-2: Alertes sur patterns anormaux (multiple tentatives, IPs suspects).
  - AC-3: Monitoring des permissions anormales (admin actions hors heures ouvrées).
  - AC-4: Logs structurés avec correlation ID pour traçabilité.
  - AC-5: Export des logs pour analyse forensique.

- En tant qu'admin, je veux configurer des règles de rate limiting afin de prévenir les attaques par force brute.
  - AC-1: Rate limiting par IP sur endpoints sensibles (/auth/login, /auth/register).
  - AC-2: Progressive delays pour tentatives répétées.
  - AC-3: Whitelist pour IPs autorisées (admin, partenaires).
  - CAPTCHA après N tentatives échouées.
  - AC-5: Monitoring des IP bloquées avec possibilité de débloquer manuellement.

## Validation & Conformité Technique
- En tant qu'admin, je veux valider la conformité RGPD afin d'assurer la protection des données personnelles.
  - AC-1: Fonctionnalité de "right to be forgotten" avec suppression complète des données.
  - AC-2: Export des données personnelles au format JSON/CSV.
  - AC-3: Consent tracking pour toutes les collectes de données.
  - AC-4: Data retention policies avec purge automatique.
  - AC-5: Documentation du traitement des données pour autorités CNIL.

- En tant qu'admin, je veux effectuer des scans de vulnérabilité réguliers afin de maintenir un niveau de sécurité élevé.
  - AC-1: Intégration avec outils de scan (OWASP ZAP, Nessus).
  - AC-2: Rapports de vulnérabilités avec priorisation.
  - AC-3: Validation des dépendances avec sécurité updates automatiques.
  - AC-4: Tests d'injection XSS, CSRF, SQL injection automatisés.
  - AC-5: Validation HTTPS/TLS configuration et headers sécurité.

## Gestion des Accès & Audit
- En tant qu'admin, je veux gérer les accès des utilisateurs privilégiés afin de contrôler qui peut faire quoi.
  - AC-1: Gestion des rôles avec permissions granulaires.
  - AC-2: Workflow d'approbation pour accès sensibles.
  - AC-3: Audit trail complet de toutes les actions admin.
  - AC-4: Session management avec timeout et révocation.
  - AC-5: MFA obligatoire pour tous les accès admin.

- En tant qu'admin, je wants monitorer l'intégrité des données afin de détecter les corruptions ou modifications non autorisées.
  - AC-1: Checksums et validation de l'intégrité des données critiques.
  - AC-2: Backups automatiques avec validation de restauration.
  - AC-3: Alertes sur modifications de masse ou incohérences.
  - AC-4: Historical data versioning pour table critiques.
  - AC-5: Procedures de disaster recovery documentées et testées.

## Infrastructure & Sécurité Ops
- En tant qu'admin, je veux surveiller la performance et disponibilité de l'infrastructure afin d'assurer une qualité de service optimale.
  - AC-1: Monitoring des métriques serveur (CPU, mémoire, disque, réseau).
  - AC-2: Alertes sur seuils critiques avec escalation automatique.
  - AC-3: Health checks sur tous les services critiques.
  - AC-4: Load testing régulier pour validation de capacité.
  - AC-5: Documentation des procédures d'incident response.

- En tant qu'admin, je veux gérer les secrets et clés API de manière sécurisée afin d'éviter les fuites d'informations sensibles.
  - AC-1: Vault solution pour stockage des secrets (Hashicorp Vault, AWS Secrets Manager).
  - AC-2: Rotation automatique des clés et secrets.
  - AC-3: Audit d'accès aux secrets avec justificatifs.
  - AC-4: Environnements isolés (dev/staging/prod) avec secrets distincts.
  - AC-5: Validation absence de secrets dans le code source.

## Tests d'Intrusion & Pentesting
- En tant qu'admin, je veux réaliser des tests d'intrusion contrôlés afin d'évaluer la robustesse des défenses.
  - AC-1: Pentesting trimestriel avec firmes spécialisées.
  - AC-2: Tests de social engineering sur les équipes admin.
  - AC-3: Validation des physical security measures si applicable.
  - AC-4: Rapports détaillés avec plans de remédiation.
  - AC-5: Tracking des remédiations jusqu'à résolution complète.

## Documentation & Formation
- En tant qu'admin, je veux maintenir une documentation sécurité complète afin d'assurer la continuité des connaissances.
  - AC-1: Playbooks pour incidents de sécurité courants.
  - AC-2: Guidelines de codage sécurisé pour les développeurs.
  - AC-3: Formation régulière des équipes sur les bonnes pratiques sécurité.
  - AC-4: Documentation des architectures sécurité en place.
  - AC-5: Procédures d'escalade et contact d'urgence sécurité.