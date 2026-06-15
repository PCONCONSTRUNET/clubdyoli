const { Client } = require('pg');

async function fixCupons() {
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
    
    await client.query(`
      ALTER TABLE cupons ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES planos(id) ON DELETE SET NULL;
    `);
    
    console.log("Adicionado plano_id em cupons.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixCupons();
