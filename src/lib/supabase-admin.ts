import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cria uma instância separada para o admin, garantindo que o login 
// não sobrescreva a sessão do cliente no mesmo navegador.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase-admin-auth', // Chave isolada
  }
});
