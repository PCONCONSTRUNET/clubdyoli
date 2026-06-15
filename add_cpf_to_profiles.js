const { Client } = require('pg');

async function fixCpf() {
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

    // 1. Add cpf column to profiles if it doesn't exist
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS cpf TEXT;
    `);
    console.log("Ensured cpf column exists in profiles.");

    // 2. Update existing profiles using data from auth.users (raw_user_meta_data)
    const updateResult = await client.query(`
      UPDATE profiles p
      SET cpf = u.raw_user_meta_data->>'cpf'
      FROM auth.users u
      WHERE p.id = u.id AND (p.cpf IS NULL OR p.cpf = '');
    `);
    console.log(`Updated ${updateResult.rowCount} profiles with CPF from auth.users.`);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

fixCpf();
