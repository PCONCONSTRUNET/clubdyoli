const { Client } = require('pg');
const fs = require('fs');

async function run() {
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
    console.log("Connected to Supabase Postgres.");
    const sql = fs.readFileSync('secure_rls.sql', 'utf8');
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Error executing migration:", err);
  } finally {
    await client.end();
  }
}

run();
