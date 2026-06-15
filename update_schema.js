const { Client } = require('pg');

async function updateSchema() {
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
    console.log("Connected to database...");

    await client.query(`
      ALTER TABLE plano_opcoes
      ADD COLUMN IF NOT EXISTS cupom_porcentagem INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cupom_validade_dias INTEGER DEFAULT 30;
    `);

    console.log("Database updated: Added cupom_porcentagem and cupom_validade_dias to plano_opcoes.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
