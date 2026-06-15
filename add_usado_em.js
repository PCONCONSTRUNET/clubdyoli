const { Client } = require('pg');

async function fixUserCupons() {
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
      ALTER TABLE user_cupons ADD COLUMN IF NOT EXISTS usado_em TIMESTAMP WITH TIME ZONE;
    `);
    
    console.log("Adicionado usado_em em user_cupons.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixUserCupons();
