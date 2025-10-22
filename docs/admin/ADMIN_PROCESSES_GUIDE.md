# Guide des Processus Administrateur - Plateforme Mon Toit

## Table des Matières

1. [Vue d'ensemble de l'interface admin](#vue-densemble)
2. [Authentification et Sécurité](#authentification-et-sécurité)
3. [Dashboard de Sécurité et Monitoring](#dashboard-de-sécurité)
4. [Gestion des Certifications ANSUT](#gestion-des-certifications-ansut)
5. [Politiques RLS et Tests de Sécurité](#politiques-rls)
6. [Modération de Contenu](#modération-de-contenu)
7. [Rapports Mensuels et Analytics](#rapports-mensuels)
8. [Conformité RGPD et Droit à l'Oubli](#conformité-rgpd)
9. [Détection de Fraude et Rate Limiting](#détection-de-fraude)
10. [Documentation Technique et Dépannage](#documentation-technique)

---

## Vue d'ensemble de l'interface admin

### Accès à l'interface
- **URL**: `/admin`
- **Rôles requis**: `admin` ou `super_admin`
- **Authentification**: MFA obligatoire depuis octobre 2025

### Navigation principale
L'interface admin est organisée en plusieurs sections accessibles via la sidebar :

#### Section Sécurité
- **Certifications**: Gestion des certifications ANSUT
- **Vérifications**: Traitement des vérifications ONECI/CNAM
- **Sécurité 2FA**: Monitoring de la conformité MFA
- **Dashboard Sécurité**: Vue d'ensemble complète
- **Audit**: Journaux d'audit des actions admin
- **Accès sensibles**: Surveillance des accès aux données sensibles

#### Section Gestion
- **Biens**: Modération et gestion des propriétés
- **Utilisateurs**: Gestion des comptes utilisateurs
- **Baux**: Administration des contrats de location
- **Alertes**: Monitoring des alertes propriétés

#### Section Outils
- **Traitement**: Gestion des processus en attente
- **Analytics**: Tableaux de bord et statistiques
- **Signatures Électroniques**: Certificats CryptoNeo
- **Illustrations**: Génération d'illustrations AI

---

## Authentification et Sécurité

### MFA (Multi-Factor Authentication)

#### Configuration obligatoire
Depuis l'implémentation du user story AC-1, tous les administrateurs doivent activer le MFA :
- **MFA obligatoire** pour les rôles `admin` et `super_admin`
- **Redirection automatique** vers la page 2FA lors de la connexion
- **Blocage d'accès** si le MFA n'est pas configuré

#### Workflow MFA
1. **Installation** : L'utilisateur admin configure l'application TOTP
2. **Scan QR Code** : Scan du QR code avec Google Authenticator, Authy, etc.
3. **Vérification** : Saisie du code à 6 chiffres
4. **Codes de récupération** : Génération de 10 codes de récupération

#### Composants implémentés
- `TwoFactorSetup.tsx` : Configuration initiale
- `TwoFactorVerify.tsx` : Vérification lors de la connexion
- `MfaComplianceBanner.tsx` : Bannière de conformité
- `EnhancedMfaSecurityMonitor.tsx` : Dashboard de monitoring

### Sécurité des sessions
- **Timeout automatique** : Session de 2 heures pour les admins
- **Déconnexion multiple sessions** : Révocation des sessions multiples
- **Journalisation** : Toutes les connexions sont journalisées

---

## Dashboard de Sécurité et Monitoring

### Métriques principales
Le dashboard `AdminSecurityDashboard.tsx` fournit une vue en temps réel :

#### Score de sécurité global
- **Calcul** : Basé sur RLS, MFA, activité suspecte
- **Échelle** : 0-100%
- **Couleurs** : Vert (>80), Orange (60-80), Rouge (<60)

#### Surveillance des activités
- **Activités suspectes** : Liste en temps réel
- **Tentatives de connexion** : Succès/échec avec géolocalisation
- **Score de risque** : Évaluation automatique par IP et device

#### Indicateurs clés
- Total utilisateurs actifs
- Pourcentage de conformité MFA
- Connexions échouées (24h)
- Alertes de sécurité en attente

### Fonctionnalités de monitoring
1. **Alertes en temps réel** : Notifications automatiques
2. **Historique complet** : Consultation des logs
3. **Filtrage avancé** : Par période, utilisateur, type d'activité
4. **Export des logs** : Format CSV/JSON pour analyse externe

---

## Gestion des Certifications ANSUT

### Workflow de certification

#### Types de certifications
1. **Certification de bail** : Validation de conformité ANSUT
2. **Vérification de propriété** : Authenticité des biens immobiliers
3. **Vérification de locataire** : Validation des documents locataires

#### Processus complet
1. **Demande initiale** : Soumission par le propriétaire
2. **Collecte documents** : Pièces justificatives uploadées
3. **Vérification automatique** : Analyse IA des documents
4. **Revue manuelle** : Validation par l'équipe ANSUT
5. **Décision** : Approuvée/Rejetée avec motif
6. **Certification numérique** : Génération CryptoNeo si approuvée

#### Composants implémentés
- `AnsutCertificationManager.tsx` : Gestionnaire complet
- `LeaseCertificationQueue.tsx` : File d'attente
- `CertificateManager.tsx` : Gestion des certificats

### Statuts et priorités
- **Pending** : En attente de traitement
- **In Review** : En cours de révision
- **Certified** : Approuvée
- **Rejected** : Rejetée
- **Priorités** : Low, Medium, High, Urgent

---

## Politiques RLS et Tests de Sécurité

### Row Level Security (RLS)

#### Implémentation complète
Toutes les tables critiques ont des politiques RLS :
- **Isolation des données** : Chaque utilisateur voit uniquement ses données
- **Contrôle d'accès** : Permissions basées sur les rôles
- **Protection des données sensibles** : Accès strictement contrôlé

#### Fonctionnalités de validation
1. **Tests automatisés** : `RLSPolicyValidator.tsx`
2. **Score de sécurité** : Évaluation de la couverture RLS
3. **Validation des politiques** : Vérification syntaxique et sémantique
4. **Tests d'accès** : Tentatives d'accès non autorisées

#### Dashboard de validation
- **Matrice d'accès** : Visualisation des permissions par rôle
- **Score de conformité** : Pourcentage de politiques actives
- **Tests automatisés** : Suite complète de tests
- **Audit trail** : Journalisation des modifications

---

## Modération de Contenu

### Système de modération avancé

#### Types de contenu modéré
1. **Avis utilisateurs** : Notes et évaluations
2. **Annonces propriétés** : Descriptions et photos
3. **Messages** : Communications entre utilisateurs
4. **Profils utilisateurs** : Informations personnelles

#### Détection automatique
Le système `AdvancedModerationSystem.tsx` inclut :
- **Analyse sémantique** : Détection de contenu inapproprié
- **Analyse de sentiment** : Évaluation de la polarité
- **Détection de spam** : Identification de contenus promotionnels
- **Recognition de motifs** : Patterns récurrents suspects

#### Workflow de modération
1. **Auto-flag** : Détection automatique avec score de confiance
2. **Queue de modération** : Priorisation par score de risque
3. **Revue manuelle** : Interface d'analyse détaillée
4. **Décision** : Approbation, rejet, ou demande d'information
5. **Appeal system** : Processus de contestation

---

## Rapports Mensuels et Analytics

### Génération automatique

#### Configurations
- **Fréquence** : Génération automatique le 1er de chaque mois
- **Destinataires** : Admins et management
- **Formats** : PDF et CSV
- **Personnalisation** : Templates configurables

#### Métriques incluses
Le rapport `MonthlyReportGenerator.tsx` contient :
- **Statistiques utilisateurs** : Total, actifs, nouveaux
- **Métriques propriétés** : Total, nouvelles, loyer moyen
- **Taux de conversion** : Applications -> Baux
- **Analyse géographique** : Répartition par ville/région
- **Tendances** : Comparaison mois sur mois et année sur année

### Fonctionnalités
- **Export personnalisé** : Sélection des métriques
- **Envoi automatique** : Email aux destinataires configurés
- **Historique** : Archive des rapports générés
- **Visualisation** : Graphiques et tableaux interactifs

---

## Conformité RGPD et Droit à l'Oubli

### Compléte conformité RGPD

#### Droits implémentés
Le système `GDPRComplianceManager.tsx` gère tous les droits RGPD :
- **Article 15** : Droit d'accès aux données
- **Article 16** : Droit de rectification
- **Article 17** : Droit à l'oubli
- **Article 20** : Droit à la portabilité
- **Article 21** : Droit d'opposition

#### Processus de demandes RGPD
1. **Soumission** : Formulaire détaillé de demande
2. **Vérification d'identité** : Confirmation de l'identité du demandeur
3. **Collecte preuves** : Documents justificatifs si nécessaire
4. **Analyse de la demande** : Évaluation de la validité
5. **Traitement** : Exécution de la demande
6. **Confirmation** : Notification de complétion

### Fonctionnalités techniques
- **Anonymisation** : Suppression ou anonymisation sélective
- **Export des données** : Formats structurés (JSON/CSV)
- **Audit trail** : Traçabilité complète des actions
- **Gestion du consentement** : Suivi des consents utilisateurs

---

## Détection de Fraude et Rate Limiting

### Système de détection complète

#### Types de fraude détectés
Le système `FraudDetectionSystem.tsx` identifie :
- **Account takeover** : Prise de contrôle de compte
- **Fake accounts** : Comptes falsifiés
- **Payment fraud** : Fraude de paiement
- **Identity theft** : Vol d'identité
- **Multiple accounts** : Comptes multiples par utilisateur
- **Bot attacks** : Attaques automatisées

### Rate Limiting avancé
#### Règles configurables
- **Login attempts** : Limites par IP et par utilisateur
- **Account creation** : Anti-spam pour les inscriptions
- **API requests** : Protection contre les abus API
- **Password reset** : Limitation des demandes de réinitialisation

### Fonctionnalités de détection
1. **Pattern recognition** : Identification de comportements suspects
2. **IP reputation** : Vérification des adresses IP
3. **Device fingerprinting** : Suivi des appareils suspects
4. **Velocity checks** : Détection d'activités anormales
5. **Auto-blocking** : Blocage automatique basé sur le score de risque

---

## Documentation Technique et Dépannage

### Architecture technique
- **Frontend** : React 18 + TypeScript + Vite 5
- **Backend** : Supabase (PostgreSQL) avec RLS
- **Sécurité** : MFA, 2FA, Rate limiting, JWT
- **Monitoring** : Logging structuré et métriques

### Dépannage

#### Logs d'audit
- **Emplacement** : `admin_audit_logs`
- **Format** : JSON structuré avec métadonnées
- **Accessibilité** : Consultation via le dashboard admin

#### Performance monitoring
- **Métriques** : Temps de réponse, taux d'erreur
- **Alertes** : Notifications en cas de dégradation
- **Health checks** : Vérification de l'état du système

#### Sécurité
- **Tests RLS** : Suite de tests automatisés
- **Pen testing** : Tests de pénétration réguliers
- **Vulnerability scanning** : Analyse des dépendances
- **Security headers** : Configuration des en-têtes HTTP

### Maintenance

#### Sauvegardes régulières
- **Base de données** : Backups quotidiens automatiques
- **Fichiers** : Sauvegarde des assets et médias
- **Configuration** : Versioning des paramètres système

#### Mises à jour
- **Déploiement** : Processus de déploiement continu
- **Rollback** : Procédures de retour arrière
- **Validation** : Tests post-déploiement

---

## Bonnes Pratiques Administrateur

### Sécurité
- **MFA toujours activé** : Jamais désactiver l'authentification à deux facteurs
- **Mots de passe robustes** : Utiliser un gestionnaire de mots de passe
- **Principe du moindre privilège** : N'accorder que les accès nécessaires
- **Sessions sécurisées** : Toujours se déconnecter après utilisation

### Confidentialité
- **Protection des données** : Respecter la confidentialité des utilisateurs
- **Accès justifié** : Uniquement consulter les données nécessaires
- **Documentation** : Justifier tous les accès aux données sensibles
- **Formation continue** : Maintenir ses connaissances en sécurité

### Communication
- **Transparence** : Communiquer clairement les actions entreprises
- **Traçabilité** : Documenter toutes les décisions importantes
- **Escalade** : Escalader les problèmes au niveau approprié
- **Feedback** : Recueillir et utiliser le feedback utilisateur

---

## Procédures d'Urgence

### Incidents de sécurité
1. **Évaluation immédiate** : Degré de sévérité
2. **Isolation** : Limiter l'impact de l'incident
3. **Notification** : Alerter l'équipe de sécurité immédiatement
4. **Investigation** : Analyse complète des causes
5. **Résolution** : Remédiation et prévention

### Continuité de service
1. **Plan B** : Solutions de repli identifiées
2. **Communication** : Information des utilisateurs en cas d'indisponibilité
3. **Récupération** : Procédures de récupération des données
4. **Post-mortem** : Analyse des incidents après résolution

---

## Conclusion

Ce guide documente l'ensemble des fonctionnalités administratives implémentées selon les user stories spécifiées. L'interface admin de Mon Toit offre une solution complète pour :

- **Gérer la sécurité** : MFA obligatoire, monitoring continu, détection de fraudes
- **Assurer la conformité** : Respect complet du RGPD et droit à l'oubli
- **Automatiser les processus** : Modération, rapports, certifications
- **Maintenir la qualité** : Outils de validation et tests de sécurité

L'architecture est conçue pour évoluer et s'adapter aux nouvelles exigences réglementaires et de sécurité.

---

*Dernière mise à jour : 22 Octobre 2025*
*Version : 1.0*