# User Stories — Mobile & PWA

Contexte: L'expérience mobile est essentielle pour Mon Toit, avec une navigation optimisée pour les appareils tactiles et une application PWA installable.

## Navigation Mobile & BottomNav
- En tant qu'utilisateur mobile, je veux une navigation cohérente avec bottom navigation bar afin d'accéder rapidement aux fonctionnalités principales.
  - AC-1: BottomNav fixe avec 4-5 icônes principales (Accueil, Recherche, Favoris, Messages, Profil).
  - AC-2: Offset dynamique pour éviter la superposition avec le contenu scrollable.
  - AC-3: Icône acte highlightée avec badge notifications si applicable.
  - AC-4: Swipe gestures pour naviguer entre les sections principales.
  - AC-5: Back button Android et iOS gesture support cohérents.

- En tant qu'utilisateur mobile non connecté, je veux un CTA Connexion explicite dans la navigation afin de m'inviter à m'inscrire.
  - AC-1: Bouton "Se connecter" prominent dans la BottomNav.
  - AC-2: Toast contextuel lors des actions nécessitant l'authentification.
  - AC-3: Redirection automatique vers /auth avec retour à la page précédente post-connexion.

## Responsive Design & Touch Optimisation
- En tant qu'utilisateur mobile, je veux une interface tactile optimisée afin d'interagir facilement avec l'application.
  - AC-1: Boutons CTA avec min-height 44px et espacement suffisant.
  - AC-2: Swipe gestures pour la galerie photos et les cards.
  - AC-3: Pull-to-refresh sur les listes (recherche, favoris, messages).
  - AC-4: Double-tap pour zoom sur les images et cartes.
  - AC-5: Haptic feedback sur les actions importantes (candidature, favoris).

- En tant qu'utilisateur mobile, je veux des layouts adaptatifs afin d'avoir une expérience cohérente sur tous les écrans.
  - AC-1: Grid responsive : 1 colonne (< 768px), 2 colonnes (768-1024px), 3+ colonnes (>1024px).
  - AC-2: Typography responsive avec tailles optimisées pour mobile.
  - AC-3: Cards stackables avec état expandable par tap.
  - AC-4: Formulaires avec input types mobiles optimisés (tel, date, email).

## Accessibilité Mobile (AA)
- En tant qu'utilisateur avec des besoins d'accessibilité, je veux une navigation au clavier complète afin d'utiliser l'application sans souris.
  - AC-1: Tab order logique à travers tous les éléments interactifs.
  - AC-2: Focus indicators visibles avec contrast minimum 3:1.
  - AC-3: Skip links pour contourner la navigation répétitive.
  - AC-4: ARIA labels sur tous les contrôles interactifs.
  - AC-5: Screen reader support avec VoiceOver et TalkBack.

- En tant qu'utilisateur malvoyant, je veux un contrast élevé et des tailles de texte ajustables afin de lire confortablement.
  - AC-1: Contrast ratio minimum 4.5:1 pour le texte normal (WCAG AA).
  - AC-2: Support du zoom jusqu'à 200% sans perte de fonctionnalité.
  - AC-3: Texte resizable jusqu'à 200% sans layout break.
  - AC-4: Dark mode avec contrast approprié.

## PWA Installation & Offline
- En tant qu'utilisateur, je veux installer l'application sur mon écran d'accueil afin d'y accéder rapidement.
  - AC-1: Install prompt apparaît après 2 visites ou 30 secondes d'utilisation.
  - AC-2: Icone d'application adaptative pour tous les écrans.
  - AC-3: Splash screen avec branding pendant le chargement.
  - AC-4: Ouverture en fullscreen sans browser UI.
  - AC-5: Mises à jour silencieuses avec notification d'available update.

- En tant qu'utilisateur, je veux un mode offline fonctionnel afin de consulter mes favoris sans connexion.
  - AC-1: Page Offline personnalisée avec branding Mon Toit.
  - AC-2: Cache des favoris et consultations récentes (offline-first).
  - AC-3: Indicateur de statut connexion visible dans l'UI.
  - AC-4: Sync automatique des actions deferred au retour en ligne.
  - AC-5: Lecture seule des contenus consultés récemment.

## Performance Mobile
- En tant qu'utilisateur mobile, je veux des temps de chargement rapides afin d'avoir une expérience fluide.
  - AC-1: First Contentful Paint < 1.5s sur 3G.
  - AC-2: Largest Contentful Paint < 2.5s sur 3G.
  - AC-3: Images optimisées avec WebP et lazy loading.
  - AC-4: Code splitting par route pour réduire le bundle initial.
  - AC-5: Service Worker pour cache stratégique.

## Notifications Push
- En tant qu'utilisateur, je veux recevoir des notifications push pour les événements importants afin de rester informé.
  - AC-1: Permission request contextualisée avec bénéfices clairs.
  - AC-2: Notifications pour nouvelles candidatures, messages, visites confirmées.
  - AC-3: Actions rapides disponibles directement depuis la notification.
  - AC-4: Badge d'icône mis à jour avec nombre de notifications non lues.
  - AC-5: Respect des préférences de notification dans les paramètres.

## Partage Mobile Natif
- En tant qu'utilisateur mobile, je veux partager des biens via les apps natives afin de recommander facilement.
  - AC-1: Web Share API integration pour partager sur WhatsApp, SMS, Email.
  - AC-2: Deep linking pour ouvrir directement un bien depuis le share.
  - AC-3: Preview cards avec image et informations essentielles.
  - AC-4: Tracking des partages pour analytics.
  - AC-5: QR code generation pour partage rapide.

## Géolocalisation Mobile
- En tant qu'utilisateur mobile, je veux utiliser ma position pour trouver des biens proches afin d'optimiser mes recherches.
  - AC-1: Géolocalisation one-time avec permission explicite.
  - AC-2: Recherche par rayon autour de ma position.
  - AC-3: Filtre "distance" triable du plus proche au plus loin.
  - AC-4: Mode navigation vers le bien avec Google Maps/Waze.
  - AC-5: Historique des positions pour suggestions intelligentes.