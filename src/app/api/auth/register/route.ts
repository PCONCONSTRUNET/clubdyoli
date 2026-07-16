import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, nome, telefone, cpf } = await req.json();

    // 1. Criar o usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Força a confirmação de e-mail para evitar problemas de login
      user_metadata: {
        nome,
        telefone,
        cpf
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      // 2. Criar o perfil do usuário
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: authData.user.id,
        nome,
        telefone,
        cpf,
        role: 'client',
      });

      if (profileError) {
        // Se falhar o profile, deleta o auth user para não deixar lixo
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: "Erro ao criar perfil. Tente novamente." }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
