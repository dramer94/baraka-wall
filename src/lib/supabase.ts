import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a function that returns the client, handling missing env vars gracefully
function createSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a placeholder during build time - will be properly configured at runtime
    console.warn('Supabase environment variables not configured');
  }
  return createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
}

export const supabase = createSupabaseClient();

export type Submission = Database['public']['Tables']['submissions']['Row'];
export type NewSubmission = Database['public']['Tables']['submissions']['Insert'];
