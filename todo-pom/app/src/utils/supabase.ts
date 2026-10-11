import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Get Supabase credentials from environment variables
// Use VITE_ prefix for env vars in Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are not set. Using mock client.')
}

// Create Supabase client with anonymous access (no auth required for tasks)
export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseKey ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
)
