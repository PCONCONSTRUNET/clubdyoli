const { Client } = require('pg');

async function check() {
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
    
    const check = await client.query('SELECT id, email FROM auth.users');
    console.log(check.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
