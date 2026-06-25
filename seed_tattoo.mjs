import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iasvxupbueyiuvvyusde.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3Z4dXBidWV5aXV2dnl1c2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODY4MjYsImV4cCI6MjA5NjQ2MjgyNn0.Y5Kymy3XgFmKyDqhxw4V6wvJT9VUUpbdet4EicUKSN4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Verificando se Clube Tattoo existe...");
  const { data: planos } = await supabase.from('planos').select('*').eq('nome', 'Clube Tattoo');
  
  let planoId;
  if (!planos || planos.length === 0) {
    console.log("Criando plano Clube Tattoo...");
    const { data: novoPlano, error } = await supabase.from('planos').insert([{
      nome: 'Clube Tattoo',
      descricao: 'Assinatura com créditos, giros da sorte e fidelidade.',
      status: 'Ativo'
    }]).select().single();
    
    if (error) {
        console.error(error);
        return;
    }
    planoId = novoPlano.id;
  } else {
    planoId = planos[0].id;
    console.log("Plano já existe. ID:", planoId);
  }

  const { data: opcoes } = await supabase.from('plano_opcoes').select('*').eq('plano_id', planoId);
  if (!opcoes || opcoes.length === 0) {
    console.log("Criando opção de R$ 54,90...");
    await supabase.from('plano_opcoes').insert([{
      plano_id: planoId,
      valor: 54.90,
      desconto: '10%', // Exemplo
      prioridade: true
    }]);
    console.log("Opção criada!");
  } else {
      console.log("Opção já existe!");
  }
}

seed();
