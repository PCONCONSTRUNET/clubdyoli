const { Client } = require('pg');

async function fixMissingProfiles() {
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

    // Insert missing profiles from auth.users
    const insertResult = await client.query(`
      INSERT INTO profiles (id, nome, telefone, role, cpf)
      SELECT 
        u.id, 
        COALESCE(u.raw_user_meta_data->>'nome', 'Cliente sem nome'), 
        u.raw_user_meta_data->>'telefone', 
        'client', 
        u.raw_user_meta_data->>'cpf'
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE p.id IS NULL;
    `);
    console.log(`Inserted ${insertResult.rowCount} missing profiles.`);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

fixMissingProfiles();
