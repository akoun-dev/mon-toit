-- Script pour créer les utilisateurs d'authentification
-- Ce script doit être exécuté dans l'interface Supabase ou via l'API
-- Note: Les mots de passe sont "Password123!" (hashés automatiquement par Supabase)

/*
-- Méthode via l'API Supabase (à utiliser dans votre application)
const { data, error } = await supabase.auth.admin.createUser({
  email: 'jean.dupont@example.com',
  password: 'Password123!',
  email_confirm: true,
  user_metadata: { full_name: 'Jean Dupont' }
});
*/

-- Pour les environnements de développement, vous pouvez utiliser l'interface Supabase
-- ou exécuter ce script via le SQL Editor

-- Comptes email associés aux profils (à créer via l'interface d'authentification):
-- jean.dupont@example.com -> 11111111-1111-1111-1111-111111111111
-- marie.kone@example.com -> 22222222-2222-2222-2222-222222222222  
-- paul.yao@example.com -> 33333333-3333-3333-3333-333333333333
-- sophie.traore@example.com -> 44444444-4444-4444-4444-444444444444
-- alain.diarra@example.com -> 55555555-5555-5555-5555-555555555555
-- contact@agence-ci.example.com -> 66666666-6666-6666-6666-666666666666
-- contact@premium-habitat.example.com -> 77777777-7777-7777-7777-777777777777
-- admin@ansut.example.com -> 88888888-8888-8888-8888-888888888888