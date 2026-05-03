import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://teoxsuopmiffeuulnmhw.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlb3hzdW9wbWlmZmV1dWxubWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTY5MDAsImV4cCI6MjA5Mjk5MjkwMH0.t1Q5sy7qv5m7H5nn0udiISvnNN_8ZNodxAA6iXOx1I0';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Test connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .single();
    if (error) {
      console.log('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (e) {
    console.error('Supabase connection error:', e);
    return false;
  }
};
