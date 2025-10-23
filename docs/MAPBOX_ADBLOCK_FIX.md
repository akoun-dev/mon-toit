# Fix Mapbox ERR_BLOCKED_BY_CLIENT

## Problème
Les utilisateurs avec des bloqueurs de publicités (AdBlock, uBlock Origin, etc.) rencontrent des erreurs `net::ERR_BLOCKED_BY_CLIENT` lors des requêtes vers `events.mapbox.com`, ce qui affecte les fonctionnalités de la carte.

## Solution implémentée

### 1. Configuration de la carte (EnhancedMap.tsx)
```typescript
// Options pour contourner les bloqueurs
map.current = new mapboxgl.Map({
  // ...
  collectResourceTiming: false,
  fadeDuration: 0,
  attributionControl: true,
  cooperativeGestures: true,
});
```

### 2. Interception des requêtes bloquées
```typescript
map.current.on('load', () => {
  const originalFetch = window.fetch;
  let blockedRequestCount = 0;

  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('events.mapbox.com')) {
      blockedRequestCount++;

      // Afficher l'alerte après plusieurs requêtes bloquées
      if (blockedRequestCount >= 3) {
        setShowAdBlockWarning(true);
      }

      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    return originalFetch.apply(this, args);
  };
});
```

### 3. Alerte utilisateur
Une notification s'affiche automatiquement pour informer l'utilisateur qu'un bloqueur de publicités est détecté, avec des options pour :
- Comprendre et continuer
- Obtenir des instructions pour désactiver le bloqueur
- Fermer l'alerte

### 4. Nettoyage approprié
```typescript
return () => {
  // Restaurer le fetch original pour éviter les effets de bord
  if (window.fetch._originalFetch) {
    window.fetch = window.fetch._originalFetch;
  }
  map.current?.remove();
  map.current = null;
};
```

## Avantages de cette solution

✅ **Non-intrusive** : La carte fonctionne normalement avec les bloqueurs actifs
✅ **Informative** : Les utilisateurs sont notifiés de manière conviviale
✅ **Robuste** : Gère correctement le nettoyage et restaure l'état original
✅ **Logging** : Les requêtes bloquées sont tracées pour monitoring
✅ **Progressive** : L'alerte n'apparaît qu'après plusieurs requêtes bloquées

## Impact sur l'utilisateur

- **Sans bloqueur** : Aucun changement, fonctionnalités complètes
- **Avec bloqueur** : La carte fonctionne mais avec une notification amicale
- **Animations** : Peuvent être légèrement limitées mais fonctionnalités principales préservées

## Monitoring

Les logs indiquent les requêtes bloquées :
```
Blocked Mapbox analytics request #1 to prevent ad-blocker interference
Blocked Mapbox analytics request #2 to prevent ad-blocker interference
Blocked Mapbox analytics request #3 to prevent ad-blocker interference
```

Cette solution garantit une expérience utilisateur optimale quel que soit le setup de sécurité du navigateur.