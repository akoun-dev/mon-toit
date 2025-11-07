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

    // Liste blanche : utilisateurs à TOUJOURS préserver
    const PROTECTED_USERS = ['afbc7c0c-6776-4d38-8ea9-544aea08aa32']; // SOMET PATRICK
    
    console.log('🧹 Starting demo data cleanup...');
    console.log('⚠️ Protected users:', PROTECTED_USERS);

    // Step 1: Delete rental applications (not from protected users)
    const { error: appsError } = await supabase
      .from('rental_applications')
      .delete()
      .not('applicant_id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (appsError) console.error('Error deleting applications:', appsError);
    else console.log('✅ Deleted rental applications');

    // Step 2: Delete favorites (not from protected users)
    const { error: favsError } = await supabase
      .from('favorites')
      .delete()
      .not('user_id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (favsError) console.error('Error deleting favorites:', favsError);
    else console.log('✅ Deleted favorites');

    // Step 3: Delete messages (not from protected users)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .not('sender_id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (messagesError) console.error('Error deleting messages:', messagesError);
    else console.log('✅ Deleted messages');

    // Step 4: Delete properties (not from protected users)
    const { error: propsError } = await supabase
      .from('properties')
      .delete()
      .not('owner_id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (propsError) console.error('Error deleting properties:', propsError);
    else console.log('✅ Deleted properties');

    // Step 5: Delete user_roles (not from protected users)
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .not('user_id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (rolesError) console.error('Error deleting user_roles:', rolesError);
    else console.log('✅ Deleted user_roles');

    // Step 6: Delete profiles (not protected users)
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .not('id', 'in', `(${PROTECTED_USERS.join(',')})`);
    
    if (profilesError) console.error('Error deleting profiles:', profilesError);
    else console.log('✅ Deleted profiles');

    // Step 7: Clean storage bucket
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
        else console.log(`✅ Deleted ${filePaths.length} images from storage`);
      }
    } catch (storageError) {
      console.error('Storage cleanup error:', storageError);
    }

    console.log('✨ Demo data cleanup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All demo data cleaned successfully',
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
