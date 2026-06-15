const { Client } = require('pg');

async function updateSchemaCuponsSorteios() {
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

    // Update Cupons table
    await client.query(`
      ALTER TABLE cupons
      ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Desconto',
      ADD COLUMN IF NOT EXISTS valor_premio TEXT,
      ALTER COLUMN porcentagem_desconto DROP NOT NULL;
    `);

    // Update Sorteios table
    await client.query(`
      ALTER TABLE sorteios
      ADD COLUMN IF NOT EXISTS ganhador_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS cupom_gerado_id UUID REFERENCES cupons(id) ON DELETE SET NULL;
    `);

    console.log("Database updated: Added tipo and valor_premio to cupons. Added ganhador_id and cupom_gerado_id to sorteios.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateSchemaCuponsSorteios();
