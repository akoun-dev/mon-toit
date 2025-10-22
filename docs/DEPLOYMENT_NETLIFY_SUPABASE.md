Netlify + Supabase: Déploiement sécurisé et synchronisation

1) Variables d’environnement (Netlify)
- Définir côté Netlify (Site settings > Build & deploy > Environment):
  - `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = ANON JWT (Auth > API)
- Ne JAMAIS définir ni commiter de clé `service_role` dans le client.

2) Sécurité des clés
- Si une clé `service_role` a déjà été committée, ROTATION OBLIGATOIRE:
  - Supabase > Project Settings > API > Rotate service_role
  - Re-déployer l’appli après rotation.

3) Synchroniser le schéma (RPC, tables, politiques)
Avec Supabase CLI:
- `supabase link --project-ref <project-ref>`
- `supabase db push` (applique `supabase/migrations` sur la prod)
- Vérifier les RPC:
  - `select * from public.get_public_properties(null,null,null,null,null,null) limit 1;`
- Les droits doivent inclure:
  - `GRANT EXECUTE ON FUNCTION public.get_public_properties TO anon, authenticated;`

4) Build Netlify
- `netlify.toml` utilise `npm run build` avec Vite.
- CSP incluse; si vous modifiez des domaines tiers, mettez à jour `connect-src`, `img-src`, etc.

5) Auth Supabase
- Auth > Settings > Site URL = `https://mon-toit.netlify.app`
- Additional Redirect URLs: ajouter les URLs utilisées (ex: `/auth/callback`, `/reset-password`).

6) Débogage
- Erreurs 400 sur `/rpc/get_public_properties`: schéma prod non aligné (migrations manquantes) ou colonnes absentes.
- Erreurs 400 sur `/rest/v1/login_attempts`: payload invalide (colonnes), RLS/politiques, ou droits insuffisants.
- Erreurs 400 sur `/auth/v1/token?grant_type=password`: identifiants invalides, email non confirmé, origines/redirects non autorisés.

