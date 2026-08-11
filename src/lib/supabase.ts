import { createClient, SupabaseClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = (meta.env && meta.env.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (meta.env && meta.env.VITE_SUPABASE_ANON_KEY) || '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
