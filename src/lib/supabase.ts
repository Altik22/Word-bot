import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const checkSupabaseConfig = () => {
  return (
    !!supabaseUrl && 
    !!supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder'
  );
};

if (!checkSupabaseConfig()) {
  console.error('❌ Supabase NOT configured! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project Settings.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
