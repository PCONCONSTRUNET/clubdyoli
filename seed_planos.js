const { Client } = require('pg');

async function seed() {
  const client = new Client({
    user: 'postgres',
    password: 'Lucassky28@123',
    host: 'db.iasvxupbueyiuvvyusde.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to seed data.");
    
    await client.query("DELETE FROM plano_opcoes; DELETE FROM planos;");
    
    await client.query(`
      INSERT INTO planos (id, nome, descricao, status) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Club de Crédito', 'Assinatura mensal convertida em créditos e vantagens VIP.', 'Ativo');

      INSERT INTO plano_opcoes (plano_id, valor, desconto, prioridade) VALUES
      ('11111111-1111-1111-1111-111111111111', 79.99, '5%', false),
      ('11111111-1111-1111-1111-111111111111', 149.90, '7%', true),
      ('11111111-1111-1111-1111-111111111111', 249.90, '10%', true),
      ('11111111-1111-1111-1111-111111111111', 299.90, '15%', true);
    `);
    console.log("Seed executed forcefully!");
  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    await client.end();
  }
}

seed();
