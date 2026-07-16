import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cliente admin usando cookies (sem localStorage).
// Usa o mesmo cliente do usuário — o isolamento de sessão admin/client
// é garantido pela verificação de role na tabela profiles.
export const supabaseAdmin = createBrowserClient(supabaseUrl, supabaseAnonKey);
