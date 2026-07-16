import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, planoId, checkoutTipo, cupomPorcentagem, cupomValidadeDias, preco } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    let valorNumerico = preco ? parseFloat(preco.toString().replace(',', '.')) : 0;

    if (checkoutTipo === "tattoo") {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_clube_tattoo: true, giros_disponiveis: 1 })
        .eq('id', userId);
      
      if (error) throw error;

      // Registrar o pagamento do Clube Tattoo
      if (valorNumerico > 0) {
        await supabaseAdmin.from('pagamentos').insert([{
          user_id: userId,
          valor: valorNumerico,
          status: 'Pago',
          data_pagamento: new Date().toISOString()
        }]);
      }

      return NextResponse.json({ success: true, tipo: "tattoo" });
    } else {
      // Assinatura de crédito
      const { data: assData, error: assError } = await supabaseAdmin
        .from('assinaturas')
        .insert([{ user_id: userId, plano_opcao_id: planoId, status: 'Ativa' }])
        .select()
        .single();
      
      if (assError) throw assError;

      // Registrar o pagamento da assinatura
      if (valorNumerico > 0 && assData) {
        await supabaseAdmin.from('pagamentos').insert([{
          user_id: userId,
          assinatura_id: assData.id,
          valor: valorNumerico,
          status: 'Pago',
          data_pagamento: new Date().toISOString()
        }]);
      }

      // Gera cupom se o plano tiver porcentagem
      if (cupomPorcentagem > 0) {
        const codigoCupom = `VIP${cupomPorcentagem}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + cupomValidadeDias);
        
        const { data: cupomData, error: cupomError } = await supabaseAdmin
          .from('cupons')
          .insert([{
            codigo: codigoCupom,
            porcentagem_desconto: cupomPorcentagem,
            validade: dataValidade.toLocaleDateString('pt-BR'),
            total_usos: 1,
            status: 'Ativo'
          }])
          .select()
          .single();

        if (cupomData && !cupomError) {
          await supabaseAdmin.from('user_cupons').insert([{ user_id: userId, cupom_id: cupomData.id }]);
        }
      }

      return NextResponse.json({ success: true, tipo: "credito" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
