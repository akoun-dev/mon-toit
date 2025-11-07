import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedResult {
  users: number;
  properties: number;
  applications: number;
  leases: number;
  favorites: number;
  messages: number;
  searches: number;
  reviews: number;
  overdueApplications: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Seed demo data request started`);

  try {
    const { idempotencyKey } = await req.json().catch(() => ({}));
    if (idempotencyKey) {
      console.log(`[${requestId}] Idempotency key: ${idempotencyKey}`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log(`[${requestId}] Starting demo data seeding...`);
    console.log(`[${requestId}] Supabase URL:`, supabaseUrl);
    console.log('[SEED] Service key configured:', supabaseServiceKey ? `Yes (${supabaseServiceKey.substring(0, 8)}...)` : 'No');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[SEED] Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('[SEED] Authenticated user:', user.email);

    // Vérifier que l'utilisateur est super_admin
    const { data: isSuperAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'super_admin'
    });

    if (roleError) {
      console.error('[SEED] Error checking role:', roleError);
    }

    if (!isSuperAdmin) {
      throw new Error('Only super admins can seed demo data');
    }

    console.log('[SEED] User confirmed as super_admin');

    const result: SeedResult = {
      users: 0,
      properties: 0,
      applications: 0,
      leases: 0,
      favorites: 0,
      messages: 0,
      searches: 0,
      reviews: 0,
      overdueApplications: 0,
    };

    // Fonction pour générer des avatars réalistes
    const maleAvatars = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];
    const femaleAvatars = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];

    function getAvatarUrl(name: string, index: number): string {
      const femaleNames = ['Marie', 'Aminata', 'Fatoumata', 'Aïcha', 'Alima', 'Mariam', 'Salamata', 'Rahinatou', 'Clarisse', 'Rachelle'];
      const isFemale = femaleNames.some(fn => name.startsWith(fn));
      
      if (isFemale) {
        const avatarId = femaleAvatars[index % femaleAvatars.length];
        return `https://randomuser.me/api/portraits/women/${avatarId}.jpg`;
      } else {
        const avatarId = maleAvatars[index % maleAvatars.length];
        return `https://randomuser.me/api/portraits/men/${avatarId}.jpg`;
      }
    }

    // 1. CRÉER LES UTILISATEURS
    const users = [
      // Propriétaires individuels
      { email: 'jean-paul.ouedraogo@example.com', name: 'Jean-Paul Ouédraogo', type: 'proprietaire', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      { email: 'marie.kabore@example.com', name: 'Marie Kaboré', type: 'proprietaire', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      { email: 'ismael.sawadogo@example.com', name: 'Ismaël Sawadogo', type: 'proprietaire', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      
      // Nouveaux propriétaires - Nouvelles villes
      { email: 'amadou.dicko@fadangourma.bf', name: 'Amadou Dicko', type: 'proprietaire', roles: ['user'], verifications: { oneci: true }, city: 'Fada N\'Gourma' },
      { email: 's.ouattara@dori.bf', name: 'Salamata Ouattara', type: 'proprietaire', roles: ['user'], verifications: { oneci: true }, city: 'Dori' },
      { email: 'paul.kabore@tenkodogo.bf', name: 'Paul Kaboré', type: 'proprietaire', roles: ['user'], verifications: {}, city: 'Tenkodogo' },
      
      // Agences
      { email: 'contact@immobilier-bf.com', name: 'Immobilier BF', type: 'agence', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      { email: 'contact@ouaga-prestige.com', name: 'Ouaga Prestige Immobilier', type: 'agence', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      
      // Locataires
      { email: 'abdoul.zongo@example.com', name: 'Abdoul Zongo', type: 'locataire', roles: ['user'], verifications: { oneci: true }, city: 'Ouagadougou' },
      { email: 'aminata.compaore@example.com', name: 'Aminata Compaoré', type: 'locataire', roles: ['user'], verifications: { oneci: true }, city: 'Ouagadougou' },
      { email: 'moussa.sankara@example.com', name: 'Moussa Sankara', type: 'locataire', roles: ['user'], verifications: { oneci: true, cnam: true }, city: 'Ouagadougou' },
      { email: 'fatoumata.traore@example.com', name: 'Fatoumata Traoré', type: 'locataire', roles: ['user'], verifications: { oneci: true, cnam: true }, city: 'Ouagadougou' },
      { email: 'boureima.ouattara@example.com', name: 'Boureima Ouattara', type: 'locataire', roles: ['user'], verifications: { oneci: true, cnam: true, face: true }, city: 'Ouagadougou' },
      { email: 'aicha.yameogo@example.com', name: 'Aïcha Yaméogo', type: 'locataire', roles: ['user'], verifications: { oneci: true, cnam: true, face: true }, city: 'Ouagadougou' },
      { email: 'rasmane.diallo@example.com', name: 'Rasmané Diallo', type: 'locataire', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      { email: 'alima.tall@example.com', name: 'Alima Tall', type: 'locataire', roles: ['user'], verifications: {}, city: 'Ouagadougou' },
      { email: 'souleymane.nikiema@example.com', name: 'Souleymane Nikiéma', type: 'locataire', roles: ['user'], verifications: { oneci: 'pending' }, city: 'Ouagadougou' },
      { email: 'mariam.nacanabo@example.com', name: 'Mariam Nacanabo', type: 'locataire', roles: ['user'], verifications: { cnam: 'pending' }, city: 'Ouagadougou' },
      
      // Nouveaux locataires - Nouvelles villes
      { email: 'rahinatou.sawadogo@example.com', name: 'Rahinatou Sawadogo', type: 'locataire', roles: ['user'], verifications: { oneci: true }, city: 'Fada N\'Gourma' },
      { email: 'bila.diallo@example.com', name: 'Bila Diallo', type: 'locataire', roles: ['user'], verifications: { oneci: true, cnam: true }, city: 'Dori' },
      { email: 'clarisse.compaore@example.com', name: 'Clarisse Compaoré', type: 'locataire', roles: ['user'], verifications: { oneci: true }, city: 'Tenkodogo' },
      { email: 'hamidou.zongo@example.com', name: 'Hamidou Zongo', type: 'locataire', roles: ['user'], verifications: {}, city: 'Fada N\'Gourma' },
      { email: 'rachelle.ouedraogo@example.com', name: 'Rachelle Ouédraogo', type: 'locataire', roles: ['user'], verifications: { oneci: true, cnam: true }, city: 'Dori' },
      
      // Admins - utiliser 'proprietaire' comme type car admin role is managed separately
      { email: 'admin@mzaka.bf', name: 'Admin MZAKA', type: 'proprietaire', roles: ['user', 'admin', 'super_admin'], verifications: { oneci: true, cnam: true }, city: 'Ouagadougou' },
      { email: 'moderateur@mzaka.bf', name: 'Modérateur MZAKA', type: 'proprietaire', roles: ['user', 'admin'], verifications: { oneci: true }, city: 'Ouagadougou' },
    ];

    const userMap = new Map<string, string>();
    const defaultPassword = 'Demo2025!';

    console.log(`[SEED] Creating ${users.length} users...`);

    let userIndex = 0;
    for (const userData of users) {
      console.log(`[SEED] Processing user: ${userData.email}`);
      
      try {
        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error(`[SEED] Error listing users:`, listError);
          throw listError;
        }

        const userExists = existingUser?.users.find(u => u.email === userData.email);

        let userId: string;

        if (userExists) {
          console.log(`[SEED] User ${userData.email} already exists, using existing ID`);
          userId = userExists.id;
        } else {
          console.log(`[SEED] Creating new user: ${userData.email}`);
          
          // Créer l'utilisateur via Auth API
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
              full_name: userData.name,
              user_type: userData.type,
            },
          });

          if (createError) {
            console.error(`[SEED] Error creating user ${userData.email}:`, {
              message: createError.message,
              status: createError.status,
              code: (createError as any).code,
              details: createError
            });
            continue;
          }

          if (!newUser.user) {
            console.error(`[SEED] User creation returned no user for ${userData.email}`);
            continue;
          }

          userId = newUser.user.id;
          console.log(`[SEED] User created successfully: ${userData.email} (${userId})`);
          result.users++;
        }

        // Attribuer les rôles
        console.log(`[SEED] Assigning roles to ${userData.email}: ${userData.roles.join(', ')}`);
        for (const role of userData.roles) {
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: userId,
            role: role,
          });
          
          if (roleError && !roleError.message.includes('duplicate')) {
            console.error(`[SEED] Error assigning role ${role}:`, roleError);
          }
        }

        // Créer/mettre à jour le profil avec avatar
        console.log(`[SEED] Creating/updating profile for ${userData.email}`);
        const avatarUrl = getAvatarUrl(userData.name, userIndex);
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: userData.name,
          user_type: userData.type,
          city: userData.city,
          avatar_url: avatarUrl,
          oneci_verified: userData.verifications.oneci === true,
          cnam_verified: userData.verifications.cnam === true,
          face_verified: userData.verifications.face === true,
        });

        if (profileError) {
          console.error(`[SEED] Error creating profile:`, profileError);
        }

        // Créer l'entrée de vérification si nécessaire
        if (userData.verifications.oneci || userData.verifications.cnam || userData.verifications.face) {
          console.log(`[SEED] Creating verification entry for ${userData.email}`);
          const { error: verificationError } = await supabase.from('user_verifications').upsert({
            user_id: userId,
            oneci_status: userData.verifications.oneci === 'pending' ? 'pending' : (userData.verifications.oneci ? 'verified' : 'pending'),
            cnam_status: userData.verifications.cnam === 'pending' ? 'pending' : (userData.verifications.cnam ? 'verified' : 'pending'),
            face_verification_status: userData.verifications.face ? 'verified' : 'pending',
          });

          if (verificationError) {
            console.error(`[SEED] Error creating verification:`, verificationError);
          }
        }

        userMap.set(userData.email, userId);
        console.log(`[SEED] User ${userData.email} processed successfully`);
        userIndex++;
      } catch (error) {
        console.error(`[SEED] Unexpected error processing user ${userData.email}:`, error);
        userIndex++;
        continue;
      }
    }

    console.log(`[SEED] Users created: ${result.users}, Total in map: ${userMap.size}`);

    // 2. CRÉER LES PROPRIÉTÉS
    const properties = [
      // Jean-Paul Ouédraogo - OUAGADOUGOU
      { owner: 'jean-paul.ouedraogo@example.com', title: 'Villa Moderne 4 Chambres', city: 'Ouagadougou', neighborhood: 'Ouaga 2000', type: 'house', rent: 450000, bedrooms: 4, bathrooms: 3, surface: 250, status: 'disponible', moderation: 'approved' },
      { owner: 'jean-paul.ouedraogo@example.com', title: 'Appartement 3 Pièces', city: 'Ouagadougou', neighborhood: 'Cissin', type: 'apartment', rent: 180000, bedrooms: 2, bathrooms: 1, surface: 85, status: 'disponible', moderation: 'approved' },
      { owner: 'jean-paul.ouedraogo@example.com', title: 'Studio Meublé', city: 'Ouagadougou', neighborhood: 'Tampouy', type: 'studio', rent: 120000, bedrooms: 0, bathrooms: 1, surface: 35, status: 'loue', moderation: 'approved' },
      
      // BOBO-DIOULASSO (2ème ville)
      { owner: 'jean-paul.ouedraogo@example.com', title: 'Villa Coloniale Rénovée', city: 'Bobo-Dioulasso', neighborhood: 'Lafiabougou', type: 'house', rent: 280000, bedrooms: 3, bathrooms: 2, surface: 180, status: 'disponible', moderation: 'approved' },
      { owner: 'jean-paul.ouedraogo@example.com', title: 'Villa Traditionnelle Rénovée', city: 'Ouahigouya', neighborhood: 'Centre', type: 'house', rent: 110000, bedrooms: 3, bathrooms: 2, surface: 130, status: 'disponible', moderation: 'approved' },
      
      // Marie Kaboré - OUAGADOUGOU
      { owner: 'marie.kabore@example.com', title: 'Duplex Luxueux 5 Chambres', city: 'Ouagadougou', neighborhood: 'Ouaga 2000', type: 'apartment', rent: 550000, bedrooms: 5, bathrooms: 4, surface: 320, status: 'disponible', moderation: 'approved' },
      { owner: 'marie.kabore@example.com', title: 'Villa Familiale', city: 'Ouagadougou', neighborhood: 'Gounghin', type: 'house', rent: 280000, bedrooms: 3, bathrooms: 2, surface: 180, status: 'disponible', moderation: 'approved' },
      { owner: 'marie.kabore@example.com', title: 'Villa 4 Chambres avec Piscine', city: 'Ouagadougou', neighborhood: 'Dapoya', type: 'house', rent: 350000, bedrooms: 4, bathrooms: 3, surface: 220, status: 'loue', moderation: 'approved', hasPool: true },
      { owner: 'marie.kabore@example.com', title: 'Appartement 2 Pièces', city: 'Ouagadougou', neighborhood: 'Somgandé', type: 'apartment', rent: 95000, bedrooms: 1, bathrooms: 1, surface: 55, status: 'disponible', moderation: 'approved' },
      
      // BOBO-DIOULASSO
      { owner: 'marie.kabore@example.com', title: 'Appartement Centre-Ville Bobo', city: 'Bobo-Dioulasso', neighborhood: 'Centre-Ville', type: 'apartment', rent: 150000, bedrooms: 2, bathrooms: 1, surface: 75, status: 'disponible', moderation: 'approved' },
      { owner: 'marie.kabore@example.com', title: 'Résidence Touristique Banfora', city: 'Banfora', neighborhood: 'Quartier Commercial', type: 'house', rent: 160000, bedrooms: 3, bathrooms: 2, surface: 150, status: 'disponible', moderation: 'approved' },
      
      // Ismaël Sawadogo - OUAGADOUGOU
      { owner: 'ismael.sawadogo@example.com', title: 'Villa Contemporaine', city: 'Ouagadougou', neighborhood: 'Kossodo', type: 'house', rent: 380000, bedrooms: 4, bathrooms: 2, surface: 200, status: 'disponible', moderation: 'approved' },
      { owner: 'ismael.sawadogo@example.com', title: 'Appartement Économique', city: 'Ouagadougou', neighborhood: 'Zogona', type: 'apartment', rent: 75000, bedrooms: 2, bathrooms: 1, surface: 60, status: 'disponible', moderation: 'approved' },
      
      // KOUDOUGOU
      { owner: 'ismael.sawadogo@example.com', title: 'Maison Familiale Koudougou', city: 'Koudougou', neighborhood: 'Secteur 1', type: 'house', rent: 120000, bedrooms: 3, bathrooms: 2, surface: 140, status: 'disponible', moderation: 'approved' },
      
      // Immobilier BF - OUAGADOUGOU
      { owner: 'contact@immobilier-bf.com', title: 'Penthouse Premium Vue Lagune', city: 'Ouagadougou', neighborhood: 'Ouaga 2000', type: 'apartment', rent: 850000, bedrooms: 4, bathrooms: 4, surface: 280, status: 'disponible', moderation: 'approved' },
      { owner: 'contact@immobilier-bf.com', title: 'Villa de Prestige', city: 'Ouagadougou', neighborhood: 'Ouaga 2000', type: 'house', rent: 720000, bedrooms: 5, bathrooms: 4, surface: 350, status: 'disponible', moderation: 'approved' },
      { owner: 'contact@immobilier-bf.com', title: 'Appartement Standing', city: 'Ouagadougou', neighborhood: 'Cissin', type: 'apartment', rent: 320000, bedrooms: 3, bathrooms: 2, surface: 120, status: 'disponible', moderation: 'approved' },
      { owner: 'contact@immobilier-bf.com', title: 'Duplex Moderne', city: 'Ouagadougou', neighborhood: 'Patte d\'Oie', type: 'apartment', rent: 480000, bedrooms: 4, bathrooms: 3, surface: 230, status: 'loue', moderation: 'approved' },
      { owner: 'contact@immobilier-bf.com', title: 'Villa Rénovation Complète', city: 'Ouagadougou', neighborhood: 'Ouaga 2000', type: 'house', rent: 400000, bedrooms: 4, bathrooms: 3, surface: 210, status: 'disponible', moderation: 'approved' },
      
      // BOBO-DIOULASSO
      { owner: 'contact@immobilier-bf.com', title: 'Villa Moderne avec Jardin', city: 'Bobo-Dioulasso', neighborhood: 'Accart-Ville', type: 'house', rent: 350000, bedrooms: 4, bathrooms: 3, surface: 220, status: 'disponible', moderation: 'approved' },
      
      // Ouaga Prestige Immobilier - OUAGADOUGOU
      { owner: 'contact@ouaga-prestige.com', title: 'Maison Moderne', city: 'Ouagadougou', neighborhood: 'Bogodogo', type: 'house', rent: 250000, bedrooms: 3, bathrooms: 2, surface: 150, status: 'disponible', moderation: 'approved' },
      { owner: 'contact@ouaga-prestige.com', title: 'Appartement Familial', city: 'Ouagadougou', neighborhood: 'Gounghin', type: 'apartment', rent: 160000, bedrooms: 3, bathrooms: 2, surface: 90, status: 'disponible', moderation: 'approved' },
      { owner: 'contact@ouaga-prestige.com', title: 'Villa Neuve', city: 'Ouagadougou', neighborhood: 'Dapoya', type: 'house', rent: 420000, bedrooms: 4, bathrooms: 3, surface: 240, status: 'disponible', moderation: 'approved' },
      { owner: 'contact@ouaga-prestige.com', title: 'Appartement En Attente Modération', city: 'Ouagadougou', neighborhood: 'Tampouy', type: 'apartment', rent: 200000, bedrooms: 2, bathrooms: 1, surface: 75, status: 'disponible', moderation: 'pending' },
      
      // KOUDOUGOU
      { owner: 'contact@ouaga-prestige.com', title: 'Appartement Neuf Koudougou', city: 'Koudougou', neighborhood: 'Secteur 3', type: 'apartment', rent: 95000, bedrooms: 2, bathrooms: 1, surface: 60, status: 'disponible', moderation: 'approved' },
      
      // FADA N'GOURMA - Nouvelles propriétés
      { owner: 'amadou.dicko@fadangourma.bf', title: 'Villa 3 Chambres Fada Centre', city: 'Fada N\'Gourma', neighborhood: 'Centre-Ville', type: 'house', rent: 180000, bedrooms: 3, bathrooms: 2, surface: 160, status: 'disponible', moderation: 'approved' },
      { owner: 'amadou.dicko@fadangourma.bf', title: 'Appartement 2 Pièces Secteur 1', city: 'Fada N\'Gourma', neighborhood: 'Secteur 1', type: 'apartment', rent: 95000, bedrooms: 2, bathrooms: 1, surface: 70, status: 'disponible', moderation: 'approved' },
      { owner: 'amadou.dicko@fadangourma.bf', title: 'Maison Familiale Secteur 2', city: 'Fada N\'Gourma', neighborhood: 'Secteur 2', type: 'house', rent: 150000, bedrooms: 4, bathrooms: 2, surface: 180, status: 'disponible', moderation: 'approved' },
      { owner: 'amadou.dicko@fadangourma.bf', title: 'Studio Meublé Commercial', city: 'Fada N\'Gourma', neighborhood: 'Quartier Commercial', type: 'studio', rent: 65000, bedrooms: 0, bathrooms: 1, surface: 32, status: 'disponible', moderation: 'approved' },
      
      // DORI - Nouvelles propriétés
      { owner: 's.ouattara@dori.bf', title: 'Villa Moderne 3 Chambres Dori', city: 'Dori', neighborhood: 'Centre', type: 'house', rent: 140000, bedrooms: 3, bathrooms: 2, surface: 150, status: 'disponible', moderation: 'approved' },
      { owner: 's.ouattara@dori.bf', title: 'Appartement 2 Pièces Administratif', city: 'Dori', neighborhood: 'Secteur Administratif', type: 'apartment', rent: 85000, bedrooms: 2, bathrooms: 1, surface: 65, status: 'disponible', moderation: 'approved' },
      { owner: 's.ouattara@dori.bf', title: 'Maison Traditionnelle Rénovée', city: 'Dori', neighborhood: 'Quartier Résidentiel', type: 'house', rent: 110000, bedrooms: 3, bathrooms: 2, surface: 130, status: 'disponible', moderation: 'approved' },
      
      // TENKODOGO - Nouvelles propriétés
      { owner: 'paul.kabore@tenkodogo.bf', title: 'Villa 4 Chambres Centre Tenkodogo', city: 'Tenkodogo', neighborhood: 'Centre-Ville', type: 'house', rent: 160000, bedrooms: 4, bathrooms: 2, surface: 170, status: 'disponible', moderation: 'approved' },
      { owner: 'paul.kabore@tenkodogo.bf', title: 'Appartement Économique Secteur 1', city: 'Tenkodogo', neighborhood: 'Secteur 1', type: 'apartment', rent: 75000, bedrooms: 2, bathrooms: 1, surface: 55, status: 'disponible', moderation: 'approved' },
      { owner: 'paul.kabore@tenkodogo.bf', title: 'Maison 3 Chambres Quartier Neuf', city: 'Tenkodogo', neighborhood: 'Quartier Neuf', type: 'house', rent: 120000, bedrooms: 3, bathrooms: 2, surface: 140, status: 'disponible', moderation: 'approved' },
    ];

    const propertyMap = new Map<string, string>();

    for (const propData of properties) {
      const ownerId = userMap.get(propData.owner);
      if (!ownerId) continue;

      const { data: property, error } = await supabase.from('properties').insert({
        owner_id: ownerId,
        title: propData.title,
        city: propData.city,
        neighborhood: propData.neighborhood,
        address: `${propData.neighborhood}, ${propData.city}`,
        property_type: propData.type,
        monthly_rent: propData.rent,
        deposit_amount: propData.rent * 2,
        bedrooms: propData.bedrooms,
        bathrooms: propData.bathrooms,
        surface_area: propData.surface,
        status: propData.status,
        moderation_status: propData.moderation,
        is_furnished: Math.random() > 0.5,
        has_parking: Math.random() > 0.3,
        has_garden: propData.type === 'villa' && Math.random() > 0.5,
        has_ac: Math.random() > 0.6,
        description: `Belle propriété située à ${propData.neighborhood}. Idéale pour ${propData.bedrooms > 2 ? 'famille' : 'couple ou célibataire'}.`,
      }).select().single();

      if (error) {
        console.error('Error creating property:', error);
        continue;
      }

      result.properties++;
      propertyMap.set(propData.title, property.id);
    }

    // 3. CRÉER LES CANDIDATURES
    const applications = [
      // OVERDUE (> 48h)
      { property: 'Villa Moderne 4 Chambres', applicant: 'abdoul.zongo@example.com', status: 'pending', score: 92, daysAgo: 3 },
      { property: 'Penthouse Premium Vue Lagune', applicant: 'aminata.compaore@example.com', status: 'pending', score: 88, daysAgo: 4 },
      { property: 'Duplex Luxueux 5 Chambres', applicant: 'moussa.sankara@example.com', status: 'pending', score: 90, daysAgo: 5 },
      
      // URGENT (< 48h)
      { property: 'Appartement 3 Pièces', applicant: 'fatoumata.traore@example.com', status: 'pending', score: 65, daysAgo: 1 },
      { property: 'Appartement Standing', applicant: 'boureima.ouattara@example.com', status: 'pending', score: 58, daysAgo: 2 },
      
      // NORMALES
      { property: 'Villa Familiale', applicant: 'aicha.yameogo@example.com', status: 'pending', score: 75, daysAgo: 0.5 },
      { property: 'Villa Contemporaine', applicant: 'rasmane.diallo@example.com', status: 'pending', score: 45, daysAgo: 0.3 },
      { property: 'Appartement Économique', applicant: 'alima.tall@example.com', status: 'pending', score: 42, daysAgo: 0.2 },
      { property: 'Maison Moderne', applicant: 'souleymane.nikiema@example.com', status: 'pending', score: 68, daysAgo: 0.8 },
      { property: 'Villa Neuve', applicant: 'mariam.nacanabo@example.com', status: 'pending', score: 55, daysAgo: 1.2 },
      
      // APPROVED
      { property: 'Villa de Prestige', applicant: 'abdoul.zongo@example.com', status: 'approved', score: 95, daysAgo: 10 },
      { property: 'Appartement 2 Pièces', applicant: 'aminata.compaore@example.com', status: 'approved', score: 82, daysAgo: 8 },
      { property: 'Appartement Familial', applicant: 'moussa.sankara@example.com', status: 'approved', score: 88, daysAgo: 7 },
      { property: 'Villa Contemporaine', applicant: 'fatoumata.traore@example.com', status: 'approved', score: 70, daysAgo: 12 },
      { property: 'Penthouse Premium Vue Lagune', applicant: 'boureima.ouattara@example.com', status: 'approved', score: 85, daysAgo: 9 },
      { property: 'Maison Moderne', applicant: 'aicha.yameogo@example.com', status: 'approved', score: 78, daysAgo: 6 },
      { property: 'Duplex Luxueux 5 Chambres', applicant: 'abdoul.zongo@example.com', status: 'approved', score: 92, daysAgo: 11 },
      { property: 'Villa Familiale', applicant: 'aminata.compaore@example.com', status: 'approved', score: 80, daysAgo: 14 },
      
      // REJECTED
      { property: 'Appartement Standing', applicant: 'rasmane.diallo@example.com', status: 'rejected', score: 35, daysAgo: 15 },
      { property: 'Villa Neuve', applicant: 'alima.tall@example.com', status: 'rejected', score: 30, daysAgo: 13 },
      { property: 'Appartement Économique', applicant: 'souleymane.nikiema@example.com', status: 'rejected', score: 40, daysAgo: 16 },
      { property: 'Duplex Moderne', applicant: 'mariam.ouattara@example.com', status: 'rejected', score: 38, daysAgo: 17 },
      { property: 'Villa Rénovation Complète', applicant: 'awa.bamba@example.com', status: 'rejected', score: 32, daysAgo: 18 },
      { property: 'Appartement 3 Pièces', applicant: 'ibrahim.sanogo@example.com', status: 'rejected', score: 28, daysAgo: 20 },
      { property: 'Villa de Prestige', applicant: 'nguessan.kouame@example.com', status: 'rejected', score: 25, daysAgo: 19 },
      
      // NOUVELLES VILLES - Applications
      { property: 'Villa 3 Chambres Fada Centre', applicant: 'rahinatou.sawadogo@example.com', status: 'pending', score: 82, daysAgo: 1 },
      { property: 'Villa Moderne 3 Chambres Dori', applicant: 'bila.diallo@example.com', status: 'pending', score: 88, daysAgo: 1.5 },
      { property: 'Villa 4 Chambres Centre Tenkodogo', applicant: 'clarisse.compaore@example.com', status: 'approved', score: 90, daysAgo: 5 },
      { property: 'Studio Meublé Commercial', applicant: 'hamidou.zongo@example.com', status: 'pending', score: 65, daysAgo: 0.8 },
      { property: 'Appartement 2 Pièces Administratif', applicant: 'rachelle.ouedraogo@example.com', status: 'rejected', score: 45, daysAgo: 10 },
    ];

    for (const appData of applications) {
      const propertyId = propertyMap.get(appData.property);
      const applicantId = userMap.get(appData.applicant);
      if (!propertyId || !applicantId) continue;

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(appData.daysAgo));

      const { error } = await supabase.from('rental_applications').insert({
        property_id: propertyId,
        applicant_id: applicantId,
        status: appData.status,
        application_score: appData.score,
        cover_letter: `Candidature pour ${appData.property}`,
        created_at: createdAt.toISOString(),
        reviewed_at: appData.status !== 'pending' ? new Date().toISOString() : null,
      });

      if (error) {
        console.error('Error creating application:', error);
        continue;
      }

      result.applications++;
      if (appData.daysAgo >= 3 && appData.status === 'pending') {
        result.overdueApplications++;
      }
    }

    // Marquer les candidatures en retard
    await supabase.rpc('mark_overdue_applications');

    // 4. CRÉER LES BAUX
    const leases = [
      // Actifs
      { property: 'Studio Meublé', landlord: 'jean-paul.ouedraogo@example.com', tenant: 'abdoul.zongo@example.com', daysAgo: 90, certified: false },
      { property: 'Villa 4 Chambres avec Piscine', landlord: 'marie.kabore@example.com', tenant: 'aminata.compaore@example.com', daysAgo: 60, certified: false },
      { property: 'Villa Moderne 4 Chambres', landlord: 'jean-paul.ouedraogo@example.com', tenant: 'moussa.sankara@example.com', daysAgo: 45, certified: false },
      { property: 'Appartement Familial', landlord: 'contact@ouaga-prestige.com', tenant: 'fatoumata.traore@example.com', daysAgo: 30, certified: false },
      
      // Certifiés ANSUT
      { property: 'Villa 4 Chambres avec Piscine', landlord: 'marie.kabore@example.com', tenant: 'moussa.sankara@example.com', daysAgo: 120, certified: true, certifiedDaysAgo: 30 },
      { property: 'Duplex Moderne', landlord: 'contact@immobilier-bf.com', tenant: 'abdoul.zongo@example.com', daysAgo: 90, certified: true, certifiedDaysAgo: 20 },
    ];

    for (const leaseData of leases) {
      const propertyId = propertyMap.get(leaseData.property);
      const landlordId = userMap.get(leaseData.landlord);
      const tenantId = userMap.get(leaseData.tenant);
      if (!propertyId || !landlordId || !tenantId) continue;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - leaseData.daysAgo);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const signedDate = new Date(startDate);
      signedDate.setDate(signedDate.getDate() - 5);

      const certifiedAt = leaseData.certified ? new Date(startDate) : null;
      if (certifiedAt && leaseData.certifiedDaysAgo) {
        certifiedAt.setDate(certifiedAt.getDate() + leaseData.certifiedDaysAgo);
      }

      const { error } = await supabase.from('leases').insert({
        property_id: propertyId,
        landlord_id: landlordId,
        tenant_id: tenantId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        monthly_rent: 250000,
        deposit_amount: 500000,
        lease_type: 'residential',
        status: 'active',
        landlord_signed_at: signedDate.toISOString(),
        tenant_signed_at: signedDate.toISOString(),
        certification_status: leaseData.certified ? 'certified' : 'not_requested',
        verified_at: certifiedAt?.toISOString(),
        certified_by: leaseData.certified ? userMap.get('admin@mzaka.bf') : null,
      });

      if (error) {
        console.error('Error creating lease:', error);
        continue;
      }

      result.leases++;
    }

    // 5. CRÉER DES FAVORIS
    const favorites = [
      { user: 'koffi.mensah@example.com', property: 'Penthouse Premium Vue Lagune' },
      { user: 'koffi.mensah@example.com', property: 'Villa de Prestige' },
      { user: 'aminata.toure@example.com', property: 'Duplex Luxueux 5 Chambres' },
      { user: 'yao.kouadio@example.com', property: 'Villa Contemporaine' },
      { user: 'fanta.diarra@example.com', property: 'Appartement Standing' },
      
      // Favoris nouvelles villes
      { user: 'rahinatou.sawadogo@example.com', property: 'Villa 3 Chambres Fada Centre' },
      { user: 'rahinatou.sawadogo@example.com', property: 'Maison Familiale Secteur 2' },
      { user: 'bila.diallo@example.com', property: 'Villa Moderne 3 Chambres Dori' },
      { user: 'clarisse.compaore@example.com', property: 'Villa 4 Chambres Centre Tenkodogo' },
    ];

    for (const fav of favorites) {
      const userId = userMap.get(fav.user);
      const propertyId = propertyMap.get(fav.property);
      if (!userId || !propertyId) continue;

      await supabase.from('user_favorites').insert({
        user_id: userId,
        property_id: propertyId,
      });

      result.favorites++;
    }

    // 6. CRÉER DES MESSAGES
    console.log(`[${requestId}] Creating messages...`);
    const messages = [
      // Conversations entre propriétaires et locataires
      { sender: 'koffi.mensah@example.com', receiver: 'jean-paul.kouassi@example.com', content: "Bonjour, je suis très intéressé par votre villa. Est-elle toujours disponible ?" },
      { sender: 'jean-paul.kouassi@example.com', receiver: 'koffi.mensah@example.com', content: "Oui, elle est disponible ! Souhaitez-vous organiser une visite ?", read: true },
      { sender: 'koffi.mensah@example.com', receiver: 'jean-paul.kouassi@example.com', content: "Avec plaisir ! Je suis disponible ce weekend.", read: true },
      
      { sender: 'aminata.toure@example.com', receiver: 'contact@immobilier-ci.com', content: "Bonjour, quelles sont les conditions de location pour le Penthouse ?", read: true },
      { sender: 'contact@immobilier-ci.com', receiver: 'aminata.toure@example.com', content: "Bonjour ! Il faut justifier de revenus stables et fournir une caution. Voulez-vous plus de détails ?", read: true },
      
      { sender: 'yao.kouadio@example.com', receiver: 'marie.diabate@example.com', content: "Le loyer inclut-il les charges ?" },
      { sender: 'marie.diabate@example.com', receiver: 'yao.kouadio@example.com', content: "Non, les charges sont en supplément (environ 50 000 FCFA/mois).", read: true },
      
      { sender: 'fanta.diarra@example.com', receiver: 'jean-paul.kouassi@example.com', content: "Bonjour, les animaux domestiques sont-ils acceptés ?" },
      { sender: 'jean-paul.kouassi@example.com', receiver: 'fanta.diarra@example.com', content: "Oui, les petits animaux sont acceptés avec un supplément de garantie." },
      
      { sender: 'moussa.kone@example.com', receiver: 'contact@immobilier-ci.com', content: "Votre appartement standing m'intéresse beaucoup. Puis-je avoir plus de photos ?" },
      { sender: 'contact@immobilier-ci.com', receiver: 'moussa.kone@example.com', content: "Bien sûr ! Je vous envoie le lien vers l'album photo complet.", read: true },
      
      { sender: 'adjoua.assi@example.com', receiver: 'marie.diabate@example.com', content: "Bonjour, quand puis-je emménager si ma candidature est acceptée ?", read: true },
      { sender: 'marie.diabate@example.com', receiver: 'adjoua.assi@example.com', content: "Vous pourrez emménager dès la signature du bail, généralement sous 7 jours.", read: true },
      
      { sender: 'awa.bamba@example.com', receiver: 'ismael.traore@example.com', content: "Y a-t-il un parking disponible ?" },
      { sender: 'ismael.traore@example.com', receiver: 'awa.bamba@example.com', content: "Oui, un parking sécurisé est inclus dans le loyer." },
      
      // Messages nouvelles villes
      { sender: 'rahinatou.sawadogo@example.com', receiver: 'amadou.dicko@fadangourma.bf', content: "Bonjour, je suis intéressée par la villa 3 chambres à Fada. Est-elle toujours disponible ?" },
      { sender: 'amadou.dicko@fadangourma.bf', receiver: 'rahinatou.sawadogo@example.com', content: "Oui, la villa est disponible ! Voulez-vous organiser une visite ?", read: true },
      { sender: 'bila.diallo@example.com', receiver: 's.ouattara@dori.bf', content: "La villa moderne à Dori est-elle équipée de la climatisation ?" },
      { sender: 's.ouattara@dori.bf', receiver: 'bila.diallo@example.com', content: "Oui, toutes les chambres sont climatisées et le salon également.", read: true },
      { sender: 'clarisse.compaore@example.com', receiver: 'paul.kabore@tenkodogo.bf', content: "Bonjour, votre villa à 160 000 FCFA m'intéresse. Peut-on négocier le prix ?" },
      { sender: 'paul.kabore@tenkodogo.bf', receiver: 'clarisse.compaore@example.com', content: "Le prix est déjà très correct pour une villa 4 chambres, mais nous pouvons discuter.", read: true },
      { sender: 'hamidou.zongo@example.com', receiver: 'amadou.dicko@fadangourma.bf', content: "Le studio meublé inclut-il l'eau et l'électricité ?" },
      { sender: 'amadou.dicko@fadangourma.bf', receiver: 'hamidou.zongo@example.com', content: "Non, les charges sont en supplément, environ 15 000 FCFA/mois." },
    ];

    for (const msgData of messages) {
      const senderId = userMap.get(msgData.sender);
      const receiverId = userMap.get(msgData.receiver);
      if (!senderId || !receiverId) continue;

      await supabase.from('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: msgData.content,
        is_read: msgData.read || false,
      });

      result.messages++;
    }

    // 7. CRÉER DES AVIS
    console.log(`[${requestId}] Creating reviews...`);
    const reviews = [
      // Avis propriétaires -> locataires (après baux terminés)
      { reviewer: 'jean-paul.ouedraogo@example.com', reviewee: 'abdoul.zongo@example.com', type: 'landlord_to_tenant', rating: 5, comment: "Locataire exemplaire, très soigneux et respectueux. Je recommande vivement !" },
      { reviewer: 'marie.kabore@example.com', reviewee: 'aminata.compaore@example.com', type: 'landlord_to_tenant', rating: 4, comment: "Bon locataire, quelques petits retards de paiement mais rien de grave." },
      { reviewer: 'contact@immobilier-bf.com', reviewee: 'moussa.sankara@example.com', type: 'landlord_to_tenant', rating: 5, comment: "Parfait ! Locataire sérieux et fiable." },
      { reviewer: 'contact@ouaga-prestige.com', reviewee: 'fatoumata.traore@example.com', type: 'landlord_to_tenant', rating: 4, comment: "Très bien, logement rendu en bon état." },
      
      // Avis locataires -> propriétaires
      { reviewer: 'abdoul.zongo@example.com', reviewee: 'jean-paul.ouedraogo@example.com', type: 'tenant_to_landlord', rating: 5, comment: "Propriétaire réactif et à l'écoute. Logement conforme à l'annonce." },
      { reviewer: 'aminata.compaore@example.com', reviewee: 'marie.kabore@example.com', type: 'tenant_to_landlord', rating: 3, comment: "Quelques problèmes de maintenance non résolus rapidement." },
      { reviewer: 'moussa.sankara@example.com', reviewee: 'contact@immobilier-bf.com', type: 'tenant_to_landlord', rating: 5, comment: "Excellent service, très professionnel. Je recommande cette agence." },
      { reviewer: 'fatoumata.traore@example.com', reviewee: 'contact@ouaga-prestige.com', type: 'tenant_to_landlord', rating: 4, comment: "Bon propriétaire, appartement agréable et bien situé." },
      
      // Avis supplémentaires
      { reviewer: 'marie.kabore@example.com', reviewee: 'moussa.sankara@example.com', type: 'landlord_to_tenant', rating: 5, comment: "Client sérieux et fiable. Aucun problème durant toute la durée du bail." },
      { reviewer: 'moussa.sankara@example.com', reviewee: 'marie.kabore@example.com', type: 'tenant_to_landlord', rating: 4, comment: "Propriétaire sympathique, quelques petits travaux à prévoir mais globalement satisfait." },
    ];

    for (const reviewData of reviews) {
      const reviewerId = userMap.get(reviewData.reviewer);
      const revieweeId = userMap.get(reviewData.reviewee);
      if (!reviewerId || !revieweeId) continue;

      await supabase.from('reviews').insert({
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        review_type: reviewData.type,
        rating: reviewData.rating,
        comment: reviewData.comment,
        moderation_status: 'approved',
      });

      result.reviews++;
    }

    // 8. CRÉER L'HISTORIQUE DE RECHERCHES
    console.log(`[${requestId}] Creating search history...`);
    const searches = [
      { 
        user: 'abdoul.zongo@example.com', 
        filters: { city: 'Ouagadougou', minPrice: 200000, maxPrice: 400000, bedrooms: 2, propertyType: 'apartment' },
        resultCount: 8,
        clicked: ['Penthouse Premium Vue Lagune', 'Villa de Prestige']
      },
      { 
        user: 'aminata.compaore@example.com', 
        filters: { city: 'Ouagadougou', maxPrice: 300000, bedrooms: 3, isFurnished: true },
        resultCount: 5,
        clicked: ['Duplex Luxueux 5 Chambres']
      },
      { 
        user: 'moussa.sankara@example.com', 
        filters: { city: 'Ouagadougou', minPrice: 250000, propertyType: 'house', hasGarden: true },
        resultCount: 4,
        clicked: ['Villa Familiale', 'Villa Neuve']
      },
      { 
        user: 'fatoumata.traore@example.com', 
        filters: { city: 'Ouagadougou', neighborhood: 'Ouaga 2000', maxPrice: 500000, bedrooms: 4 },
        resultCount: 12,
        clicked: ['Villa Moderne 4 Chambres', 'Appartement Standing']
      },
      { 
        user: 'moussa.kone@example.com', 
        filters: { city: 'Abidjan', minPrice: 150000, maxPrice: 250000, hasParking: true },
        resultCount: 7,
        clicked: ['Appartement 3 Pièces', 'Maison Moderne']
      },
      { 
        user: 'adjoua.assi@example.com', 
        filters: { city: 'Abidjan', propertyType: 'studio', maxPrice: 150000 },
        resultCount: 3,
        clicked: ['Studio Meublé']
      },
      { 
        user: 'awa.bamba@example.com', 
        filters: { city: 'Abidjan', neighborhood: 'Marcory', bedrooms: 2, maxPrice: 200000 },
        resultCount: 6,
        clicked: ['Appartement 2 Pièces', 'Appartement Économique']
      },
    ];

    for (const searchData of searches) {
      const userId = userMap.get(searchData.user);
      if (!userId) continue;

      const clickedPropertyIds: string[] = [];
      for (const propertyTitle of searchData.clicked) {
        const propertyId = propertyMap.get(propertyTitle);
        if (propertyId) clickedPropertyIds.push(propertyId);
      }

      await supabase.from('search_history').insert({
        user_id: userId,
        search_filters: searchData.filters,
        result_count: searchData.resultCount,
        clicked_properties: clickedPropertyIds,
      });

      result.searches++;
    }

    // Logger l'action dans les audit logs
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action_type: 'seed_demo_data',
      target_type: 'database',
      target_id: user.id,
      notes: 'Base de données peuplée avec des données de démonstration',
      action_metadata: { ...result, requestId },
    });

    console.log(`[${requestId}] Demo data seeding completed:`, result);

    return new Response(JSON.stringify({ 
      requestId,
      result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[${requestId}] Error in seed-demo-data function:`, error);
    return new Response(
      JSON.stringify({ 
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
