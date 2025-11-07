import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Configuration du nettoyage
    const CUTOFF_DATE = '2025-11-07T00:00:00Z'; // Date limite : 07/11/2025
    const PROTECTED_USERS = ['afbc7c0c-6776-4d38-8ea9-544aea08aa32']; // SOMET PATRICK
    
    console.log('🧹 Starting demo data cleanup...');
    console.log('📅 Cutoff date:', CUTOFF_DATE);
    console.log('⚠️ Protected users:', PROTECTED_USERS);

    // Étape 0: Récupérer les IDs des utilisateurs à supprimer
    const { data: usersToDelete, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .lt('created_at', CUTOFF_DATE)
      .not('id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (usersError) {
      console.error('Error fetching users to delete:', usersError);
      throw new Error('Failed to fetch users to delete');
    }

    // Sécurité : vérifier que SOMET PATRICK n'est pas dans la liste
    if (usersToDelete?.some(u => PROTECTED_USERS.includes(u.id))) {
      throw new Error('🚨 PROTECTED USER WOULD BE DELETED! Aborting operation.');
    }

    const userIdsToDelete = usersToDelete?.map(u => u.id) || [];
    console.log(`📊 Found ${userIdsToDelete.length} users to delete`);
    console.log('Users to delete:', usersToDelete?.map(u => `${u.full_name} (${u.id})`));

    if (userIdsToDelete.length === 0) {
      console.log('✅ No users to delete');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No old users to clean',
          protected_users: PROTECTED_USERS,
          cutoff_date: CUTOFF_DATE,
          deleted: { users: 0 },
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const userFilter = `(${userIdsToDelete.join(',')})`;
    
    // Compteurs pour le rapport
    let deletedCounts = {
      rental_applications: 0,
      favorites: 0,
      messages: 0,
      reviews: 0,
      lease_documents: 0,
      leases: 0,
      properties: 0,
      agency_mandates: 0,
      user_roles: 0,
      profiles: 0,
      storage_files: 0
    };

    // Step 1: Delete rental applications
    const { count: appsCount, error: appsError } = await supabase
      .from('rental_applications')
      .delete({ count: 'exact' })
      .in('applicant_id', userIdsToDelete);
    
    if (appsError) console.error('Error deleting applications:', appsError);
    else {
      deletedCounts.rental_applications = appsCount || 0;
      console.log(`✅ Deleted ${appsCount} rental applications`);
    }

    // Step 2: Delete favorites
    const { count: favsCount, error: favsError } = await supabase
      .from('favorites')
      .delete({ count: 'exact' })
      .in('user_id', userIdsToDelete);
    
    if (favsError) console.error('Error deleting favorites:', favsError);
    else {
      deletedCounts.favorites = favsCount || 0;
      console.log(`✅ Deleted ${favsCount} favorites`);
    }

    // Step 3: Delete messages (sender or receiver)
    const { count: messagesCount, error: messagesError } = await supabase
      .from('messages')
      .delete({ count: 'exact' })
      .or(`sender_id.in.(${userIdsToDelete.join(',')}),receiver_id.in.(${userIdsToDelete.join(',')})`);
    
    if (messagesError) console.error('Error deleting messages:', messagesError);
    else {
      deletedCounts.messages = messagesCount || 0;
      console.log(`✅ Deleted ${messagesCount} messages`);
    }

    // Step 3b: Delete reviews
    const { count: reviewsCount, error: reviewsError } = await supabase
      .from('reviews')
      .delete({ count: 'exact' })
      .or(`reviewer_id.in.(${userIdsToDelete.join(',')}),reviewee_id.in.(${userIdsToDelete.join(',')})`);
    
    if (reviewsError) console.error('Error deleting reviews:', reviewsError);
    else {
      deletedCounts.reviews = reviewsCount || 0;
      console.log(`✅ Deleted ${reviewsCount} reviews`);
    }

    // Step 3c: Delete lease_documents
    const { count: docsCount, error: docsError } = await supabase
      .from('lease_documents')
      .delete({ count: 'exact' })
      .in('uploaded_by', userIdsToDelete);
    
    if (docsError) console.error('Error deleting lease documents:', docsError);
    else {
      deletedCounts.lease_documents = docsCount || 0;
      console.log(`✅ Deleted ${docsCount} lease documents`);
    }

    // Step 3d: Delete leases
    const { count: leasesCount, error: leasesError } = await supabase
      .from('leases')
      .delete({ count: 'exact' })
      .or(`tenant_id.in.(${userIdsToDelete.join(',')}),landlord_id.in.(${userIdsToDelete.join(',')})`);
    
    if (leasesError) console.error('Error deleting leases:', leasesError);
    else {
      deletedCounts.leases = leasesCount || 0;
      console.log(`✅ Deleted ${leasesCount} leases`);
    }

    // Step 4: Delete agency_mandates
    const { count: mandatesCount, error: mandatesError } = await supabase
      .from('agency_mandates')
      .delete({ count: 'exact' })
      .or(`agency_id.in.(${userIdsToDelete.join(',')}),property_owner_id.in.(${userIdsToDelete.join(',')})`);
    
    if (mandatesError) console.error('Error deleting agency mandates:', mandatesError);
    else {
      deletedCounts.agency_mandates = mandatesCount || 0;
      console.log(`✅ Deleted ${mandatesCount} agency mandates`);
    }

    // Step 5: Delete properties
    const { count: propsCount, error: propsError } = await supabase
      .from('properties')
      .delete({ count: 'exact' })
      .in('owner_id', userIdsToDelete);
    
    if (propsError) console.error('Error deleting properties:', propsError);
    else {
      deletedCounts.properties = propsCount || 0;
      console.log(`✅ Deleted ${propsCount} properties`);
    }

    // Step 6: Delete user_roles
    const { count: rolesCount, error: rolesError } = await supabase
      .from('user_roles')
      .delete({ count: 'exact' })
      .in('user_id', userIdsToDelete);
    
    if (rolesError) console.error('Error deleting user_roles:', rolesError);
    else {
      deletedCounts.user_roles = rolesCount || 0;
      console.log(`✅ Deleted ${rolesCount} user_roles`);
    }

    // Step 7: Delete profiles
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .in('id', userIdsToDelete);
    
    if (profilesError) console.error('Error deleting profiles:', profilesError);
    else {
      deletedCounts.profiles = profilesCount || 0;
      console.log(`✅ Deleted ${profilesCount} profiles`);
    }

    // Step 8: Clean storage bucket
    try {
      const { data: files, error: listError } = await supabase
        .storage
        .from('property-images')
        .list();

      if (listError) {
        console.error('Error listing files:', listError);
      } else if (files && files.length > 0) {
        const filePaths = files.map(file => file.name);
        const { error: deleteError } = await supabase
          .storage
          .from('property-images')
          .remove(filePaths);
        
        if (deleteError) console.error('Error deleting files:', deleteError);
        else {
          deletedCounts.storage_files = filePaths.length;
          console.log(`✅ Deleted ${filePaths.length} images from storage`);
        }
      }
    } catch (storageError) {
      console.error('Storage cleanup error:', storageError);
    }

    console.log('✨ Demo data cleanup completed successfully');
    console.log('📊 Deletion report:', deletedCounts);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleaned ${deletedCounts.profiles} old users (before ${CUTOFF_DATE})`,
        protected_users: PROTECTED_USERS,
        protected_users_names: ['SOMET PATRICK'],
        cutoff_date: CUTOFF_DATE,
        deleted: deletedCounts,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fatal error during cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
