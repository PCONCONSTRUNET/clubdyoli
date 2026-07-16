import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler to avoid build-time errors if env vars are missing
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, planoId, dataInicio, dataFim } = await req.json();

    if (!userId || !planoId || !dataInicio) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('assinaturas').insert([{
      user_id: userId,
      plano_opcao_id: planoId,
      status: 'Ativa',
      data_inicio: dataInicio,
      data_fim: dataFim || null
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
