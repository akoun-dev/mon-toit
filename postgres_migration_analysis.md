# Analyse et Résolution de l'Erreur de Migration PostgreSQL

## 1. Explication du Problème

### Cause Racine
L'erreur `function name "public.check_login_rate_limit" is not unique (SQLSTATE 42725)` se produit parce que PostgreSQL permet la création de **fonctions surchargées** (function overloading). Cela signifie que plusieurs fonctions peuvent porter le même nom mais avec des signatures de paramètres différentes.

Dans votre base de données, il existe actuellement plusieurs versions de fonctions avec des noms identiques :

1. **Fonctions check_login_rate_limit** :
   - Version 1 (dans `202501024000008_create_missing_tables.sql`): `check_login_rate_limit(TEXT, INET)` retourne une TABLE
   - Version 2 (dans `20251026060000_create_otp_functions.sql`): `check_login_rate_limit(TEXT)` retourne BOOLEAN

2. **Fonctions verify_otp_code** :
   - Version 1 (dans `20251026060000_create_otp_functions.sql`): `verify_otp_code(TEXT, TEXT)`
   - Version 2 (dans `20251026070000_complete_otp_system.sql`): `verify_otp_code(TEXT, TEXT, TEXT)`

3. **Problème de syntaxe dans les blocs DO** :
   - Dans `20251026080000_fix_otp_final.sql`, les délimiteurs $$ entrent en conflit lorsqu'ils sont imbriqués

Lorsque la migration tente d'exécuter :
```sql
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO anon, authenticated;
```

PostgreSQL ne sait pas quelle version de la fonction vous voulez référencer car le nom seul n'est plus unique - il faut spécifier la signature complète.

## 2. Requête d'Inspection des Fonctions

Pour inspecter toutes les fonctions portant ce nom dans votre base de données :

```sql
-- Afficher toutes les fonctions check_login_rate_limit avec leurs signatures
SELECT 
    proname AS function_name,
    pg_catalog.pg_get_function_arguments(oid) AS arguments,
    pg_catalog.pg_get_function_result(oid) AS return_type,
    pg_catalog.pg_get_userbyid(proowner) AS owner,
    prosecdef AS security_definer
FROM pg_catalog.pg_proc 
WHERE proname = 'check_login_rate_limit'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY oid;
```

Cette requête affichera toutes les surcharges de la fonction avec leurs paramètres et types de retour.

## 3. Instructions GRANT Corrigées

Pour résoudre le problème immédiat dans votre fichier de migration `20251026060000_create_otp_functions.sql`, remplacez la ligne 103 :

```sql
-- Ligne problématique (ligne 103)
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO anon, authenticated;
```

Par les instructions spécifiques avec signatures complètes :

```sql
-- Instructions corrigées avec signatures explicites
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT, INET) TO anon, authenticated;
```

Si vous voulez uniquement accorder les permissions pour la version à un paramètre :

```sql
-- Alternative : uniquement pour la version à un paramètre
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) TO anon, authenticated;
```

## 4. Stratégie de Prévention pour les Futures Migrations

### 4.1. Utilisation de Noms de Fonction Uniques

Évitez la surcharge de fonctions dans les migrations en utilisant des noms descriptifs et uniques :

```sql
-- Au lieu de créer plusieurs fonctions check_login_rate_limit
-- Utilisez des noms spécifiques :
CREATE OR REPLACE FUNCTION public.check_login_rate_limit_basic(p_email TEXT)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit_enhanced(p_email TEXT, p_ip_address INET)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit_with_details(p_email TEXT, p_ip_address INET)
```

### 4.2. Pattern de Migration Idempotent

Structurez vos migrations pour être idempotentes :

```sql
-- Exemple de pattern idempotent pour les fonctions
DO $$
BEGIN
    -- Vérifier si la fonction existe avec la signature exacte
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_login_rate_limit_basic'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND proargtypes = '{25}' -- 25 = oid pour TEXT
    ) THEN
        -- Créer la fonction uniquement si elle n'existe pas
        CREATE FUNCTION public.check_login_rate_limit_basic(p_email TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
            -- Implémentation
            RETURN true;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Accorder les permissions immédiatement après création
        GRANT EXECUTE ON FUNCTION public.check_login_rate_limit_basic(TEXT) TO anon, authenticated;
    END IF;
END $$;
```

### 4.3. Gestion Centralisée des Permissions

Créez une migration dédiée pour la gestion des permissions :

```sql
-- Dans un fichier séparé : 99999999_final_permissions.sql
-- Centraliser toutes les permissions pour éviter les conflits

GRANT EXECUTE ON FUNCTION public.check_login_rate_limit_basic(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit_enhanced(TEXT, INET) TO authenticated;
-- etc.
```

### 4.4. Validation Pré-Migration

Ajoutez des vérifications en début de migration pour détecter les conflits potentiels :

```sql
-- Validation en début de migration
DO $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- Vérifier les conflits de noms de fonctions
    SELECT COUNT(*) INTO v_conflict_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.proname = 'check_login_rate_limit';
    
    IF v_conflict_count > 1 THEN
        RAISE EXCEPTION 'Conflit détecté : % fonctions portent le nom check_login_rate_limit. Utilisez des signatures complètes dans les GRANT.', v_conflict_count;
    END IF;
END $$;
```

## 5. Solution Immédiate

Pour corriger votre migration actuelle, modifiez le fichier `20251026060000_create_otp_functions.sql` :

```sql
-- Remplacer la ligne 102
-- GRANT EXECUTE ON FUNCTION public.verify_otp_code TO anon, authenticated;

-- Par :
GRANT EXECUTE ON FUNCTION public.verify_otp_code(TEXT, TEXT) TO anon, authenticated;

-- Remplacer la ligne 103
-- GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO anon, authenticated;

-- Par :
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) TO anon, authenticated;

-- Remplacer également la ligne 141
-- COMMENT ON FUNCTION public.verify_otp_code IS 'Vérifie la validité d''un code OTP';

-- Par :
COMMENT ON FUNCTION public.verify_otp_code(TEXT, TEXT) IS 'Vérifie la validité d''un code OTP';

-- Remplacer également la ligne 142
-- COMMENT ON FUNCTION public.check_login_rate_limit IS 'Vérifie les limites de tentative de connexion';

-- Par :
COMMENT ON FUNCTION public.check_login_rate_limit(TEXT) IS 'Vérifie les limites de tentative de connexion';
```

De même, dans le fichier `20251026070000_complete_otp_system.sql` :

```sql
-- Remplacer la ligne 184
-- GRANT EXECUTE ON FUNCTION public.verify_otp_code TO anon, authenticated;

-- Par :
GRANT EXECUTE ON FUNCTION public.verify_otp_code(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Remplacer la ligne 185
-- GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO anon, authenticated;

-- Par :
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) TO anon, authenticated;

-- Remplacer également la ligne 191
-- COMMENT ON FUNCTION public.verify_otp_code IS 'Vérifie et consomme un code OTP';

-- Par :
COMMENT ON FUNCTION public.verify_otp_code(TEXT, TEXT, TEXT) IS 'Vérifie et consomme un code OTP';

-- Remplacer également la ligne 192
-- COMMENT ON FUNCTION public.check_login_rate_limit IS 'Vérifie les limites de tentative de connexion pour prévenir les attaques par force brute';

-- Par :
COMMENT ON FUNCTION public.check_login_rate_limit(TEXT) IS 'Vérifie les limites de tentative de connexion pour prévenir les attaques par force brute';
```

Pour le fichier `20251026080000_fix_otp_final.sql`, les problèmes suivants ont été corrigés :
1. **Conflit de délimiteurs** : Utilisation de délimiteurs différents ($func$ et $outer$) pour les fonctions imbriquées dans les blocs DO
2. **Instructions GRANT conditionnelles** : Vérification de l'existence des fonctions avant d'accorder les permissions
3. **Instructions COMMENT conditionnelles** : Vérification de l'existence des fonctions avant d'ajouter des commentaires

Ces modifications spécifient explicitement les signatures complètes des fonctions et rendent les migrations idempotentes, résolvant ainsi l'ambiguïté pour les instructions GRANT et COMMENT.