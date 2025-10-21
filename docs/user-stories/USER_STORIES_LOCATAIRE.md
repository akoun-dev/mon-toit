# User Stories — Locataire (Tenant)

Contexte: Un locataire recherche, visite et loue un logement en Côte d'Ivoire via Mon Toit (certifié ANSUT). Il veut une expérience claire, sécurisée, mobile-first.

## Authentification & Onboarding
- En tant que locataire, je veux créer un compte avec email/mot de passe ou via Google/Apple/Facebook/Microsoft afin de m’inscrire rapidement.
  - AC-1: Les liens OAuth redirigent et me connectent automatiquement.
  - AC-2: Un message d’erreur clair s’affiche en cas d’échec.
- En tant que locataire, je veux me connecter avec 2FA lorsque requis afin de sécuriser mon compte.
  - AC-1: Si le compte est éligible, un écran TOTP est affiché.
  - AC-2: Le flux reprend sur la page d’accueil après validation.

## Recherche & Découverte
- En tant que locataire, je veux rechercher des biens par ville, type et budget afin de trouver rapidement un logement pertinent.
  - AC-1: Les filtres (ville, type, prix) se combinent et se réinitialisent.
  - AC-2: Le nombre de résultats affiché est exact.
- En tant que locataire, je veux alterner vue grille/liste/carte afin de parcourir efficacement les résultats.
  - AC-1: Le basculement garde mes filtres.
  - AC-2: La carte n’affiche que les biens géolocalisés.

## Détail du bien & Confiance
- En tant que locataire, je veux consulter le descriptif, médias (photos/vidéo/360), titre de propriété et statut de travaux afin d’évaluer la qualité du bien.
  - AC-1: Les sections Média, Localisation, Titres/Travaux sont visibles si disponibles.
  - AC-2: Le statut « disponible/loué/retiré » s’affiche clairement.
- En tant que locataire, je veux voir les badges de certification (ANSUT, ONECI/CNAM) afin d’évaluer la confiance.
  - AC-1: Le badge s’affiche si le profil/annonce est vérifié.

## Favoris & Recommandations
- En tant que locataire, je veux ajouter ou retirer un bien des favoris afin de le retrouver plus tard.
  - AC-1: Le bouton cœur reflète l’état temps réel.
- En tant que locataire, je veux recevoir des recommandations basées sur mon historique afin de découvrir des biens pertinents.
  - AC-1: Un bloc « Recommandations » apparaît si connecté.

## Candidatures, Visites & Messagerie
- En tant que locataire, je veux postuler à une annonce afin d’être recontacté par le propriétaire/agence.
  - AC-1: Si non connecté, je suis redirigé vers /auth avec toast explicite.
- En tant que locataire, je veux planifier une visite afin de convenir d’un créneau.
  - AC-1: La page « Schedule Visit » enregistre la demande avec confirmation.
- En tant que locataire, je veux contacter le propriétaire en messagerie afin de poser des questions.
  - AC-1: La conversation s’ouvre préremplie avec le destinataire.

## Baux & Paiements
- En tant que locataire, je veux consulter mes candidatures et baux afin de suivre mon dossier.
  - AC-1: Les listes affichent le statut (en cours, accepté, refusé, signé).
- En tant que locataire, je veux payer mon loyer via Mobile Money afin de sécuriser la transaction.
  - AC-1: Le reçu de paiement est accessible.

## Profil & Vérification
- En tant que locataire, je veux gérer mes informations (nom, téléphone) afin de tenir mon profil à jour.
  - AC-1: Validation côté client (formats) + confirmation de sauvegarde.
- En tant que locataire, je veux initier une vérification ONECI/CNAM afin d’augmenter mon score locataire.
  - AC-1: Le statut de vérification est visible dans « Vérification ».

