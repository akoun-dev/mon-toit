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

    console.log('🧹 Starting demo data cleanup...');

    // Step 1: Delete rental applications (has foreign keys)
    const { error: appsError } = await supabase
      .from('rental_applications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (appsError) console.error('Error deleting applications:', appsError);
    else console.log('✅ Deleted rental applications');

    // Step 2: Delete favorites
    const { error: favsError } = await supabase
      .from('favorites')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (favsError) console.error('Error deleting favorites:', favsError);
    else console.log('✅ Deleted favorites');

    // Step 3: Delete messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (messagesError) console.error('Error deleting messages:', messagesError);
    else console.log('✅ Deleted messages');

    // Step 4: Delete properties
    const { error: propsError } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (propsError) console.error('Error deleting properties:', propsError);
    else console.log('✅ Deleted properties');

    // Step 5: Delete profiles (except system users)
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .not('user_type', 'eq', 'admin_ansut');
    
    if (profilesError) console.error('Error deleting profiles:', profilesError);
    else console.log('✅ Deleted profiles');

    // Step 6: Clean storage bucket
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
