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
    const body = await req.json();

    // Eventos principais que nos importam:
    // 'charge.paid', 'order.paid', 'subscription.created', 'subscription.canceled'
    const eventType = body.type;
    const data = body.data;

    console.log(`[Pagar.me Webhook] Recebido evento: ${eventType}`);

    if (eventType === 'charge.paid' || eventType === 'order.paid') {
      const metadata = data.metadata || (data.order && data.order.metadata) || (data.subscription && data.subscription.metadata);
      
      if (!metadata || !metadata.user_id || !metadata.plano_id) {
        console.warn("Webhook recebido sem metadata de usuário/plano.", data.id);
        return NextResponse.json({ success: true, message: "Ignorado - Sem metadados" });
      }

      const userId = metadata.user_id;
      const planoId = metadata.plano_id;
      const checkoutTipo = metadata.checkout_tipo;
      
      const valorNumerico = (data.amount || 0) / 100; // converter de centavos

      // Verificar se a Order/Charge já foi processada
      const { data: pagamentoExistente } = await supabaseAdmin
        .from('pagamentos')
        .select('id')
        .or(`pagarme_charge_id.eq.${data.id},pagarme_order_id.eq.${data.order?.id}`)
        .maybeSingle();

      if (pagamentoExistente) {
        return NextResponse.json({ success: true, message: "Pagamento já processado" });
      }

      if (checkoutTipo === "tattoo") {
        await supabaseAdmin
          .from('profiles')
          .update({ is_clube_tattoo: true, giros_disponiveis: 1 })
          .eq('id', userId);
        
        if (valorNumerico > 0) {
          await supabaseAdmin.from('pagamentos').insert([{
            user_id: userId,
            valor: valorNumerico,
            status: 'Pago',
            data_pagamento: new Date().toISOString(),
            pagarme_charge_id: data.id,
            pagarme_order_id: data.order?.id
          }]);
        }
      } else {
        // Assinatura (Plano de Crédito)
        const { data: assData, error: assError } = await supabaseAdmin
          .from('assinaturas')
          .insert([{ 
            user_id: userId, 
            plano_opcao_id: planoId, 
            status: 'Ativa',
            pagarme_subscription_id: data.subscription?.id || null 
          }])
          .select()
          .single();

        if (assError) throw assError;

        if (valorNumerico > 0 && assData) {
          await supabaseAdmin.from('pagamentos').insert([{
            user_id: userId,
            assinatura_id: assData.id,
            valor: valorNumerico,
            status: 'Pago',
            data_pagamento: new Date().toISOString(),
            pagarme_charge_id: data.id,
            pagarme_order_id: data.order?.id
          }]);
        }
        
        // Se quisermos gerar cupons automáticos, podemos buscar a porcentagem_cupom do plano_opcoes
        // omitido aqui para focar no pagamento core, mas é facilmente adicionável
      }
    } else if (eventType === 'subscription.canceled' || eventType === 'charge.chargedback') {
      const metadata = data.metadata || (data.subscription && data.subscription.metadata);
      if (metadata && metadata.user_id) {
        // Cancelar a assinatura local
        await supabaseAdmin
          .from('assinaturas')
          .update({ status: 'Cancelada' })
          .eq('user_id', metadata.user_id)
          .eq('status', 'Ativa'); // ou eq('pagarme_subscription_id', data.id) se for subscription
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro no Webhook Pagar.me:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
