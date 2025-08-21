import { createClient } from '@supabase/supabase-js';

// Ambil URL dan Kunci Anon dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Buat dan ekspor Supabase client
// Jika environment variables tidak ada, client akan dibuat dengan nilai null
// dan akan gagal, yang menandakan perlunya menghubungkan Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
