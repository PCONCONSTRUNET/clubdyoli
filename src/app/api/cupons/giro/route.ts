import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // 1. Verificar giros disponíveis
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('giros_disponiveis')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }

    if (profile.giros_disponiveis <= 0) {
      return NextResponse.json({ error: "Você não possui giros disponíveis." }, { status: 400 });
    }

    // 2. Buscar prêmios ativos
    const { data: premios, error: premiosError } = await supabaseAdmin
      .from('premios_roleta')
      .select('*')
      .eq('ativo', true)
      .order('peso', { ascending: false });

    if (premiosError || !premios || premios.length === 0) {
      return NextResponse.json({ error: "Nenhum prêmio configurado no momento." }, { status: 500 });
    }

    // 3. Sorteio ponderado pelo peso
    const totalPeso = premios.reduce((sum, p) => sum + (p.peso || 1), 0);
    let random = Math.random() * totalPeso;
    let premioGanho = premios[0];

    for (const p of premios) {
      random -= (p.peso || 1);
      if (random <= 0) {
        premioGanho = p;
        break;
      }
    }

    // 4. Criar o cupom real no banco
    const descontoInt = parseInt(premioGanho.nome) || 0;
    const codigo = `GIRO-${descontoInt}OFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: cupomCriado, error: cupomError } = await supabaseAdmin
      .from('cupons')
      .insert([{
        codigo,
        desconto_percentual: descontoInt,
        desconto_fixo: 0,
        is_global: false,
        total_usos: 1,
        status: 'Ativo'
      }])
      .select()
      .single();

    if (cupomError) throw cupomError;

    // 5. Vincular ao usuário
    const { error: userCupomError } = await supabaseAdmin
      .from('user_cupons')
      .insert([{
        user_id: userId,
        cupom_id: cupomCriado.id
      }]);

    if (userCupomError) throw userCupomError;

    // 6. Descontar 1 giro do usuário
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ giros_disponiveis: profile.giros_disponiveis - 1 })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      premioId: premioGanho.id,
      cupom: {
        codigo: cupomCriado.codigo,
        desconto: descontoInt,
        nome: premioGanho.nome
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
