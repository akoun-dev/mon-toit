# 🎨 MON TOIT - Design System V2
## Guide Complet de Migration et d'Utilisation

### 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Changements majeurs](#changements-majeurs)
3. [Migration pas à pas](#migration-pas-à-pas)
4. [Palette de couleurs](#palette-de-couleurs)
5. [Typographie](#typographie)
6. [Espacements](#espacements)
7. [Composants](#composants)
8. [Accessibilité](#accessibilité)
9. [Mode sombre](#mode-sombre)
10. [Intégration culturelle](#intégration-culturelle)
11. [Bonnes pratiques](#bonnes-pratiques)
12. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Le Design System V2 de MON TOIT représente une évolution majeure vers une architecture unifiée, cohérente et accessible. Cette version met l'accent sur :

- **Unification complète** des tokens de design
- **Accessibilité WCAG 2.2** native
- **Intégration culturelle ivoirienne**
- **Performance optimisée**
- **Mode sombre complet**
- **Mobile-first avancé**

### 📁 Fichiers principaux

```
src/styles/
├── design-system-v2.css      # Tokens CSS unifiés
├── components-v2.css         # Composants de base améliorés
└── mobile.css               # Optimisations mobiles

tailwind.config.v2.ts        # Configuration Tailwind V2
```

---

## 🔄 Changements Majeurs

### 1. **Système de couleurs unifié**

#### Avant (V1)
```css
/* Multiple systèmes non alignés */
--color-primary: #2256A3;           /* design-system.css */
--primary: #2C5F7F;                 /* design-system-colors.css */
--color-primary: #1A4278;           /* constants */
```

#### Après (V2)
```css
/* Système unifié avec 50-900 échelle */
--color-primary-500: hsl(203, 48%, 34%);  /* Couleur principale */
--color-primary-600: hsl(203, 48%, 28%);  /* Hover */
--color-primary-700: hsl(203, 48%, 22%);  /* Active */
```

### 2. **Espacements mathématiques**

#### Avant (V1)
```css
/* Définitions multiples et incohérentes */
--spacing-md: 1rem;     /* design-system.css */
--spacing-md: 16px;     /* design-system-colors.css */
```

#### Après (V2)
```css
/* Système basé sur 4px (base unit) */
--space-1: 0.25rem;     /* 4px */
--space-4: 1rem;        /* 16px */
--space-6: 1.5rem;      /* 24px */
```

### 3. **Typographie responsive**

#### Avant (V1)
```css
/* Tailles fixes, peu responsive */
--text-base: 1rem;
--text-lg: 1.125rem;
```

#### Après (V2)
```css
/* Système mobile-first avec breakpoints */
--font-size-base: 1rem;   /* 16px mobile */
@media (min-width: 640px) {
  --font-size-base: 1.125rem;  /* 18px tablette+ */
}
```

---

## 📋 Migration Pas à Pas

### Étape 1: Préparation

```bash
# 1. Sauvegarder les fichiers actuels
cp src/styles/design-system.css src/styles/design-system.v1.css.backup
cp tailwind.config.ts tailwind.config.v1.ts.backup

# 2. Importer le nouveau design system
# Dans src/index.css, ajouter en haut:
@import './styles/design-system-v2.css';
@import './styles/components-v2.css';
```

### Étape 2: Mise à jour des couleurs

#### Remplacer les anciennes variables

```css
/* Ancien → Nouveau */
--color-primary → --color-primary-500
--color-secondary → --color-secondary-500
--color-success → --color-success-500
--color-warning → --color-warning-500
--color-error → --color-error-500
--color-info → --color-info-500
```

#### Dans les composants React

```tsx
// Ancien
<div className="bg-primary text-white">

// Nouveau
<div className="bg-primary-500 text-white">
```

### Étape 3: Mise à jour des espacements

```css
/* Ancien → Nouveau */
--spacing-xs → --space-1 (ou --spacing-xs, alias supporté)
--spacing-sm → --space-2
--spacing-md → --space-4
--spacing-lg → --space-6
--spacing-xl → --space-8
--spacing-2xl → --space-12
```

### Étape 4: Mise à jour de la typographie

```css
/* Ancien → Nouveau */
--text-xs → --font-size-xs
--text-sm → --font-size-sm
--text-base → --font-size-base
--text-lg → --font-size-lg
--text-xl → --font-size-xl
```

### Étape 5: Migration des composants

#### Boutons

```tsx
// Ancien
<button className="btn btn-primary">Cliquez</button>

// Nouveau (recommandé)
<button className="btn btn--primary">Cliquez</button>

// Alternative Tailwind V2
<button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200">
  Cliquez
</button>
```

#### Cartes

```tsx
// Ancien
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Titre</h3>
  </div>
  <div className="card-body">
    Contenu
  </div>
</div>

// Nouveau (recommandé)
<div className="card">
  <div className="card__header">
    <h3 className="card__title">Titre</h3>
  </div>
  <div className="card__body">
    Contenu
  </div>
</div>
```

### Étape 6: Configuration Tailwind

```typescript
// Remplacer tailwind.config.ts par tailwind.config.v2.ts
// Ou mettre à jour la configuration existante avec les nouvelles valeurs
```

---

## 🎨 Palette de Couleurs

### Couleurs primaires

| Couleur | Hex | Usage | Exemple |
|---------|-----|-------|---------|
| Primary 500 | `#2C5F7F` | Brand principal | Boutons principaux, navigation |
| Secondary 500 | `#E67E22` | Actions principales | CTAs, éléments interactifs |

### Couleurs fonctionnelles

| Couleur | Hex | Usage | Exemple |
|---------|-----|-------|---------|
| Success 500 | `#10B981` | Succès, validation | Badges "Disponible", confirmations |
| Warning 500 | `#F59E0B` | Attention | Badges "En attente", alertes |
| Error 500 | `#EF4444` | Erreurs | Messages d'erreur, suppressions |
| Info 500 | `#3B82F6` | Information | Notifications, infos |

### Palette culturelle ivoirienne

| Couleur | Usage | Signification |
|---------|-------|---------------|
| Ivory Orange | Accents culturels | Énergie, vitalité ivoirienne |
| Ivory Gold | Éléments premium | Prospérité, excellence |
| Lagoon Blue | Arrière-plans | Connexion à Abidjan |
| Tropical Green | Éléments nature | Environnement ivoirien |

### Utilisation en pratique

```tsx
// Brand colors
<button className="bg-primary-500 hover:bg-primary-600">
  Action principale
</button>

// Secondary actions
<button className="bg-secondary-500 hover:bg-secondary-600">
  CTA important
</button>

// Status colors
<Badge className="bg-success-500 text-white">
  Disponible
</Badge>

// Cultural accents
<div className="bg-gradient-sunset text-white">
  Section culturelle
</div>
```

---

## ✍️ Typographie

### Hiérarchie typographique

```css
/* Display - pour les titres héro */
.font-7xl → 4.5rem (72px)
.font-6xl → 3.75rem (60px)
.font-5xl → 3rem (48px)

/* Headings */
.font-4xl → 2.25rem (36px) - h1
.font-3xl → 1.875rem (30px) - h2
.font-2xl → 1.5rem (24px) - h3
.font-xl → 1.25rem (20px) - h4

/* Body */
.font-lg → 1.125rem (18px)
.font-base → 1rem (16px)
.font-sm → 0.875rem (14px)
.font-xs → 0.75rem (12px)
```

### Font families

```tsx
// Textes de contenu
<p className="font-primary text-base">
  Contenu principal en Inter
</p>

// Titres et affichages
<h1 className="font-secondary font-bold text-4xl">
  Titre principal en Poppins
</h1>

// Code et données
<code className="font-mono text-sm">
  const x = 42;
</code>
```

### Poids et styles

```tsx
// Poids de police
<p className="font-light">Texte léger (300)</p>
<p className="font-normal">Texte normal (400)</p>
<p className="font-medium">Texte moyen (500)</p>
<p className="font-semibold">Texte semi-bold (600)</p>
<p className="font-bold">Texte bold (700)</p>

// Espacement des lignes
<p className="leading-tight">Lignes serrées (1.25)</p>
<p className="leading-normal">Lignes normales (1.5)</p>
<p className="leading-relaxed">Lignes espacées (1.75)</p>
```

---

## 📏 Espacements

### Système basé sur 4px

| Token | Taille | Usage |
|-------|--------|-------|
| `space-1` | 4px | Micro-espacements |
| `space-2` | 8px | Petits éléments |
| `space-3` | 12px | Espacement entre éléments |
| `space-4` | 16px | Espacement standard |
| `space-6` | 24px | Sections |
| `space-8` | 32px | Grandes sections |
| `space-12` | 48px | Conteneurs |
| `space-16` | 64px | Layout principal |

### Utilisation pratique

```tsx
// Padding
<div className="p-4">Padding standard</div>
<div className="p-6">Padding section</div>
<div className="px-4 py-2">Padding horizontal + vertical</div>

// Margin
<div className="m-4">Margin standard</div>
<div className="mt-6">Margin top section</div>
<div className="space-y-4">Vertical spacing between children</div>

// Gap pour grilles et flexbox
<div className="grid grid-cols-2 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 🧩 Composants

### Boutons

```tsx
// Variants disponibles
<button className="btn btn--primary">Primaire</button>
<button className="btn btn--secondary">Secondaire</button>
<button className="btn btn--success">Succès</button>
<button className="btn btn--warning">Attention</button>
<button className="btn btn--error">Erreur</button>
<button className="btn btn--outline">Contour</button>
<button className="btn btn--ghost">Fantôme</button>
<button className="btn btn--link">Lien</button>

// Tailles
<button className="btn btn--primary btn--sm">Petit</button>
<button className="btn btn--primary">Normal</button>
<button className="btn btn--primary btn--lg">Grand</button>
<button className="btn btn--primary btn--xl">Très grand</button>

// États
<button className="btn btn--primary">Normal</button>
<button className="btn btn--primary btn--loading">Chargement</button>
<button className="btn btn--primary disabled">Désactivé</button>
<button className="btn btn--primary btn--full">Pleine largeur</button>

// Avec icônes
<button className="btn btn--primary btn--icon-left">
  <Icon className="w-4 h-4" />
  Texte
</button>
```

### Badges

```tsx
// Variants
<Badge className="badge--primary">Primaire</Badge>
<Badge className="badge--secondary">Secondaire</Badge>
<Badge className="badge--success">Succès</Badge>
<Badge className="badge--warning">Attention</Badge>
<Badge className="badge--error">Erreur</Badge>
<Badge className="badge--outline">Contour</Badge>
<Badge className="badge--solid">Solide</Badge>

// Tailles
<Badge className="badge--sm">Petit</Badge>
<Badge className="badge">Normal</Badge>
<Badge className="badge--lg">Grand</Badge>
```

### Cartes

```tsx
// Variants
<Card className="card--elevated">Élevée</Card>
<Card className="card--outlined">Contour</Card>
<Card className="card--filled">Remplie</Card>
<Card className="card--primary">Primaire</Card>

// Structure
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardBody>Contenu</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Formulaires

```tsx
// Champs de saisie
<FormGroup>
  <FormLabel required>Email</FormLabel>
  <Input type="email" placeholder="votre@email.com" />
  <FormHelp>Votre email professionnel</FormHelp>
  <FormError>Ce champ est requis</FormError>
</FormGroup>

// États
<Input className="input--error" />
<Input className="input--success" />
<Input className="input--disabled" disabled />
```

### Avatars

```tsx
// Tailles
<Avatar className="avatar--xs">XS</Avatar>
<Avatar className="avatar--sm">SM</Avatar>
<Avatar className="avatar--md">MD</Avatar>
<Avatar className="avatar--lg">LG</Avatar>
<Avatar className="avatar--xl">XL</Avatar>

// Variants
<Avatar className="avatar--primary">JD</Avatar>
<Avatar className="avatar--success">✓</Avatar>

// Avec image
<Avatar>
  <img src="/photo.jpg" alt="Photo" />
</Avatar>
```

---

## ♿ Accessibilité

### Focus visible

Tous les éléments interactifs ont des états focus visibles :

```tsx
// Automatique avec les classes du design system
<button className="btn btn--primary">
  // Focus visible avec contour 2px et shadow
</button>

// Manuel si nécessaire
<div className="focus-visible:focus:outline-2 focus-visible:focus:outline-primary-500">
  Élément focusable
</div>
```

### Touch targets mobiles

```tsx
// Minimum 44x44px (WCAG)
<button className="btn">48px minimum</button>
<button className="btn btn--sm">36px minimum (petits éléments)</button>
```

### Screen readers

```tsx
// Textes cachés visuellement mais lus par les lecteurs d'écran
<span className="sr-only">Information pour lecteurs d'écran</span>

// Skip links
<a href="#main" className="skip-link">Aller au contenu</a>
```

### Contrastes WCAG

Toutes les couleurs respectent les ratios de contraste WCAG AA :

- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Non-text elements**: 3:1 minimum

### Gestion du mouvement réduit

```css
/* Les animations respectent prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🌙 Mode Sombre

### Activation

```tsx
// Le mode sombre utilise la classe .dark
<html className="dark">  // Mode sombre activé
<html className="">      // Mode clair (par défaut)
```

### Couleurs adaptatives

Les couleurs s'adaptent automatiquement :

```tsx
// Ces couleurs changent automatiquement en mode sombre
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-gray-100">
    Texte adaptatif
  </p>
</div>
```

### Composants mode sombre

```tsx
// Les composants s'adaptent automatiquement
<Card className="card--dark"> // S'adapte au mode
<Input className="input--dark"> // S'adapte au mode
```

### Ombres mode sombre

```css
.dark {
  --shadow-sm: 0 1px 2px 0 hsl(0 0% 0% / 0.25);
  --shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.3);
  /* Ombres plus prononcées pour le mode sombre */
}
```

---

## 🌍 Intégration Culturelle

### Couleurs ivoiriennes

```tsx
// Utilisation des couleurs culturelles
<div className="bg-ivory-orange text-white">
  Accent orange ivoirien
</div>

<div className="bg-gradient-kente text-white">
  Motif Kente (Ghana/Côte d'Ivoire)
</div>
```

### Patterns culturels

```tsx
// Patterns africains
<div className="pattern-african">
  Contenu avec motif africain subtil
</div>

<div className="pattern-bogolan">
  Motif Bogolan (Mali)
</div>
```

### Gradients culturels

```tsx
// Gradients inspirés de la Côte d'Ivoire
<div className="bg-gradient-lagoon text-white">
  Bleu lagune Ébrié
</div>

<div className="bg-gradient-sunset text-white">
  Couché de soleil ivoirien
</div>

<div className="bg-gradient-forest text-white">
  Forêt tropicale ivoirienne
</div>
```

### Typographie locale

```tsx
// Support des caractères français et ivoiriens
<p className="font-primary">
  Texte en français avec support des caractères spéciaux: é, è, ê, ç, à, ù...
</p>
```

---

## ✨ Bonnes Pratiques

### 1. Utilisation cohérente des couleurs

```tsx
// ✅ Bon - Utilisation sémantique
<button className="bg-primary-500">Action principale</button>
<Badge className="bg-success-500">Statut positif</Badge>
<Alert className="bg-error-500">Message d'erreur</Alert>

// ❌ Éviter - Couleurs non sémantiques
<button className="bg-green-500">Action principale</button>
<Badge className="bg-blue-500">Statut positif</Badge>
```

### 2. Hiérarchie visuelle claire

```tsx
// ✅ Bon - Hiérarchie claire
<h1 className="font-4xl font-bold">Titre principal</h1>
<h2 className="font-2xl font-semibold">Sous-titre</h2>
<p className="text-base">Contenu</p>
<p className="text-sm text-gray-600">Légende</p>

// ❌ Éviter - Hiérarchie confuse
<h1 className="text-lg">Titre principal</h1>
<p className="text-2xl">Contenu</p>
```

### 3. Espacements cohérents

```tsx
// ✅ Bon - Espacements de la grille 4px
<div className="p-4 m-6 gap-4">
  // 16px padding, 24px margin, 16px gap
</div>

// ❌ Éviter - Espacements arbitraires
<div className="p-3.5 m-7 gap-5">
  // Valeurs non standard
</div>
```

### 4. Responsivité mobile-first

```tsx
// ✅ Bon - Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  // 1 colonne mobile, 2 tablette, 3 desktop
</div>

// ❌ Éviter - Desktop-first
<div className="grid grid-cols-3 gap-4 md:grid-cols-2 lg:grid-cols-1">
  // Ordre inversé, moins performant
</div>
```

### 5. Accessibilité native

```tsx
// ✅ Bon - Accessible
<button
  className="btn btn--primary"
  aria-label="Fermer la modal"
  disabled={isLoading}
>
  {isLoading ? 'Chargement...' : 'Fermer'}
</button>

// ❌ Éviter - Inaccessible
<div onClick={handleClick}>Bouton</div>
<button disabled={true}>Action</button>
```

### 6. Performance des animations

```tsx
// ✅ Bon - Animations performantes
<div className="transition-transform duration-200 hover:scale-105">
  // Transform uniquement (GPU accéléré)
</div>

// ❌ Éviter - Animations coûteuses
<div className="transition-all duration-500 hover:p-8">
  // Padding change (reflow coûteux)
</div>
```

---

## 🔧 Dépannage

### Problèmes courants

#### 1. Les couleurs ne s'appliquent pas

**Symptôme**: Les classes de couleur ne fonctionnent pas

**Solutions**:
```bash
# Vérifier que le nouveau CSS est importé
# Dans src/index.css:
@import './styles/design-system-v2.css';

# Vider le cache
npm run build -- --reset-cache
```

#### 2. Le mode sombre ne fonctionne pas

**Symptôme**: Les couleurs ne changent pas en mode sombre

**Solutions**:
```tsx
// Vérifier que la classe .dark est appliquée
document.documentElement.classList.add('dark');

// Utiliser les bonnes classes
<div className="bg-white dark:bg-gray-800">
```

#### 3. Les animations sont lentes

**Symptôme**: Transitions saccadées

**Solutions**:
```css
/* Utiliser transform uniquement */
.hover-effect {
  transition: transform 0.2s ease;
}
.hover-effect:hover {
  transform: translateY(-2px);
}
```

#### 4. Les focus ne sont pas visibles

**Symptôme**: Impossible de voir quel élément a le focus

**Solutions**:
```tsx
// Utiliser les classes focus-visible
<button className="btn btn--primary">
  // Inclus automatiquement
</button>
```

### Debug des tokens CSS

```css
/* Inspecter les variables CSS */
:root {
  /* Vérifier que les variables sont définies */
  --color-primary-500: hsl(203, 48%, 34%);
}

/* Debug dans le navigateur */
element.style {
  /* Vérifier les valeurs calculées */
  color: hsl(203, 48%, 34%);
}
```

### Migration progressive

Si vous ne pouvez pas migrer tout d'un coup :

```css
/* Support des anciennes variables pendant la transition */
:root {
  --color-primary: var(--color-primary-500);
  --color-secondary: var(--color-secondary-500);
  /* ... autres variables de compatibilité */
}
```

---

## 📚 Ressources Complémentaires

### Documentation

- [Guide WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design Systems Principles](https://designsystemsrepo.com/)

### Outils

- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Palette Generator](https://coolors.co/)
- [Tailwind Play](https://play.tailwindcss.com/)

### Support

Pour toute question sur le Design System V2 :

1. Consulter ce guide
2. Vérifier les composants existants
3. Tester dans différents navigateurs
4. Valider l'accessibilité

---

## 🎉 Conclusion

Le Design System V2 de MON TOIT offre une fondation solide pour créer des interfaces :

- **Cohérentes** avec des tokens unifiés
- **Accessibles** avec WCAG 2.2 natif
- **Culturelles** avec l'identité ivoirienne
- **Performantes** avec optimisations mobiles
- **Maintenables** avec une architecture claire

Cette évolution positionne MON TOIT comme une référence en matière de design digital en Côte d'Ivoire, alliant excellence technique et richesse culturelle.

---

*Version 2.0 - Dernière mise à jour: 21 Octobre 2025*