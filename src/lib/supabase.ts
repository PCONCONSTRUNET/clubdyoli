import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// createBrowserClient salva a sessão em cookies (além de localStorage),
// tornando-a legível pelo middleware no servidor.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
