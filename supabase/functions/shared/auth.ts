// Authentication utilities for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export interface AuthUser {
  id: string
  email?: string
  user_type?: string
  is_verified?: boolean
}

export async function authenticateUser(req: Request): Promise<{ user: AuthUser | null, error?: string }> {
  try {
    // Extract authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }

    // Get user profile with additional info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, is_verified')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Return user without profile info if profile fetch fails
      return { 
        user: { 
          id: user.id, 
          email: user.email 
        } 
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        user_type: profile?.user_type,
        is_verified: profile?.is_verified
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export async function requireAuth(req: Request, allowedUserTypes?: string[]): Promise<{ user: AuthUser, response?: Response }> {
  const { user, error } = await authenticateUser(req)
  
  if (error || !user) {
    return {
      user: null as any,
      response: new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // Check user type if specified
  if (allowedUserTypes && user.user_type && !allowedUserTypes.includes(user.user_type)) {
    return {
      user: null as any,
      response: new Response(JSON.stringify({ 
        success: false, 
        error: 'Insufficient permissions' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  return { user }
}

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}