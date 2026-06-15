const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iasvxupbueyiuvvyusde.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// I need the key from .env.local
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const key = keyMatch ? keyMatch[1] : '';

const supabase = createClient(supabaseUrl, key);

async function testInsert() {
  const { data, error } = await supabase.from('cupons').insert([{
    codigo: 'TESTE',
    tipo: 'Desconto',
    porcentagem_desconto: 10,
    validade: new Date().toISOString(),
    status: 'Ativo'
  }]).select();

  console.log("Data:", data);
  console.log("Error:", error);
}

testInsert();
