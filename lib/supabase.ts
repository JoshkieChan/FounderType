import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kqzjgjgqzqjxwqjgqzq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxempqZ2pxenFqeHdxanFnenEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4NzQ3MjU2MCwiZXhwIjoyMDAzMDQ4NTYwfQ.5JqTQ5Q6Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co') {
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
    const { data, error } = await supabase.from('profiles').select('count').single();
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
