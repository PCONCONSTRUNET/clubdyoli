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
      ALTER TABLE cupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    `);
    
    console.log("Adicionado created_at em cupons.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixCupons();
