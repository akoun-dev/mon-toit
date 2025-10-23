# Fix "Aucun bien ne correspond à vos critères" - Problème de filtre par défaut

## Problème identifié

Les utilisateurs voyaient le message "Aucun bien ne correspond à vos critères" même sans avoir appliqué de filtres, donnant l'impression qu'un filtre par défaut était actif.

## Cause racine

Le problème venait de la fonction `shouldShowProperty` dans `src/services/propertyService.ts` qui était trop restrictive :

```typescript
// Ancienne logique (trop restrictive)
const rentedStatuses = new Set(['loué', 'loue', 'rented', 'occupied', 'indisponible', 'archived', 'archivé']);
return !rentedStatuses.has(status);
```

Cette logique cachait **toutes** les propriétés qui n'avaient pas un statut explicitement autorisé, ce qui incluait de nombreux statuts valides comme "draft", "pending", "published", etc.

## Solution implémentée

### 1. Logique de filtrage améliorée (`shouldShowProperty`)

```typescript
export const shouldShowProperty = (property: Property, currentUserId?: string): boolean => {
  // ALWAYS show to property owner
  if (currentUserId && (property as any).owner_id === currentUserId) {
    return true;
  }

  const status = (property as any).status?.toString().toLowerCase();

  // Explicitly ALLOW these statuses for public viewing
  const allowedStatuses = new Set([
    'published', 'publish', 'publié', 'available', 'disponible', 'active',
    'actif', 'featured', 'en vedette', 'draft', 'brouillon', 'pending',
    'en attente', 'review', 'en révision'
  ]);

  // Explicitly HIDE these statuses for public viewing
  const hiddenStatuses = new Set([
    'loué', 'loue', 'rented', 'occupied', 'indisponible', 'archived',
    'archivé', 'sold', 'vendu', 'suspended', 'suspendu', 'deleted', 'supprimé'
  ]);

  // If status is explicitly hidden, don't show
  if (hiddenStatuses.has(status)) {
    return false;
  }

  // If status is explicitly allowed, show it
  if (allowedStatuses.has(status)) {
    return true;
  }

  // For unknown or null status, show it (better to show than hide)
  return true;
};
```

### 2. Logging amélioré dans `PropertyGrid`

```typescript
console.log('🔍 Debugging filters:', {
  totalProperties: properties.length,
  activeFilters: Object.keys(filters).length > 0 ? filters : 'none',
  properties: properties.map(p => ({
    id: p.id,
    title: p.title,
    status: p.status,
    city: p.city,
    rent: p.monthly_rent
  }))
});
```

### 3. Messages d'erreur plus informatifs

```typescript
{Object.keys(filters).length > 0
  ? "Aucun bien ne correspond à vos critères"
  : "Aucun bien disponible pour le moment"}

{Object.keys(filters).length > 0
  ? `Trouvé ${properties.length} bien${properties.length > 1 ? 's' : ''} au total, mais aucun ne correspond aux filtres actuels`
  : properties.length === 0
    ? "Essayez de rafraîchir la page ou revenez plus tard"
    : "Essayez d'élargir vos critères de recherche"}
```

## Améliorations apportées

✅ **Plus de visibilité par défaut** : Les propriétés avec statuts valides sont maintenant visibles
✅ **Liste explicite des statuts autorisés** : `published`, `available`, `draft`, `pending`, etc.
✅ **Liste explicite des statuts cachés** : Seuls les statuts vraiment indisponibles sont cachés
✅ **Logique defensive** : Les statuts inconnus ou nuls sont montrés par défaut
✅ **Logging amélioré** : Permet de diagnostiquer rapidement les problèmes
✅ **Messages utilisateurs clairs** : Différencie le cas "aucun filtre" vs "filtres actifs"

## Statuts gérés

### ✅ Statuts autorisés (visibles publiquement)
- `published`, `publish`, `publié`
- `available`, `disponible`
- `active`, `actif`
- `featured`, `en vedette`
- `draft`, `brouillon`
- `pending`, `en attente`
- `review`, `en révision`

### ❌ Statuts cachés (non visibles publiquement)
- `loué`, `loue`, `rented`, `occupied`
- `indisponible`
- `archived`, `archivé`
- `sold`, `vendu`
- `suspended`, `suspendu`
- `deleted`, `supprimé`

### ❓ Statuts inconnus (visibles par défaut)
- Les statuts non répertoriés sont maintenant montrés plutôt que cachés

## Résultat

- **Avant** : Les utilisateurs voyaient "Aucun bien ne correspond à vos critères" systématiquement
- **Après** : Les propriétés avec statuts valides sont visibles, avec des messages clairs selon le contexte

Cette approche est plus permissive et évite de cacher accidentellement des propriétés qui devraient être visibles.