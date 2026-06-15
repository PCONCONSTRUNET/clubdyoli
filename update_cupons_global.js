const { Client } = require('pg');

async function updateCuponsGlobal() {
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
      ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
    `);

    console.log("Database updated: Added is_global to cupons.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateCuponsGlobal();
