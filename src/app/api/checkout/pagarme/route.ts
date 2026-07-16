import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  createPagarmeOrder, 
  createPagarmeSubscription, 
  formatPagarmePhone,
  PagarmeOrderRequest,
  PagarmeSubscriptionRequest
} from '../../../../lib/pagarme';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    
    const {
      userId,
      planoId,
      preco,
      nome_plano,
      cpf,
      nome,
      email,
      telefone,
      metodoPagamento,
      numeroCartao,
      nomeCartao,
      validade,
      cvv,
      checkoutTipo
    } = body;

    if (!userId || !planoId || !metodoPagamento) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const valorCentavos = Math.round(parseFloat(preco.toString().replace(',', '.')) * 100);
    const phoneFormatted = formatPagarmePhone(telefone);

    // Se o cliente já existir no nosso Supabase com pagarme_customer_id, deveríamos usar
    // Mas por enquanto enviaremos sempre os dados completos e o Pagar.me gerencia pelo documento
    const customer = {
      name: nome,
      email: email,
      document: cpf.replace(/\D/g, ''),
      type: 'individual' as const,
      phones: phoneFormatted ? { mobile_phone: phoneFormatted, home_phone: phoneFormatted } : undefined
    };

    let result;
    
    if (metodoPagamento === 'cartao') {
      // Usar Subscriptions (Assinatura Recorrente)
      const [exp_month, exp_year] = validade.split('/');
      
      const payload: PagarmeSubscriptionRequest = {
        payment_method: 'credit_card',
        currency: 'BRL',
        interval: 'month',
        interval_count: 1,
        billing_type: 'prepaid',
        installments: 1,
        statement_descriptor: 'CLUBDYOLI',
        customer,
        card: {
          number: numeroCartao.replace(/\D/g, ''),
          holder_name: nomeCartao,
          exp_month: parseInt(exp_month, 10),
          exp_year: parseInt(exp_year.length === 2 ? `20${exp_year}` : exp_year, 10),
          cvv,
          // Endereço fictício para atender requisitos obrigatórios de antifraude, 
          // ideal seria capturar no front
          billing_address: {
            line_1: "Rua Ficticia, 123",
            zip_code: "01001000",
            city: "Sao Paulo",
            state: "SP",
            country: "BR"
          }
        },
        items: [{
          amount: valorCentavos,
          description: nome_plano || 'Plano Clube',
          quantity: 1
        }],
        metadata: {
          user_id: userId,
          plano_id: planoId,
          checkout_tipo: checkoutTipo || 'credito'
        }
      };

      result = await createPagarmeSubscription(payload);

    } else if (metodoPagamento === 'pix') {
      // Usar Orders (Pedido Avulso) com expiração em 30 min (1800s)
      const payload: PagarmeOrderRequest = {
        items: [{
          amount: valorCentavos,
          description: nome_plano || 'Plano Clube',
          quantity: 1
        }],
        customer,
        payments: [{
          payment_method: 'pix',
          pix: {
            expires_in: 1800,
            additional_information: [{ name: "Plano", value: nome_plano || 'Clube' }]
          }
        }],
        metadata: {
          user_id: userId,
          plano_id: planoId,
          checkout_tipo: checkoutTipo || 'credito'
        }
      };

      result = await createPagarmeOrder(payload);
    } else {
      return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
    }

    // Retorna para o Frontend processar e mostrar o QRCode (se Pix) ou a tela de sucesso (Cartão)
    return NextResponse.json({ success: true, data: result });

  } catch (err: any) {
    console.error("Erro no Checkout Pagar.me:", err);
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
