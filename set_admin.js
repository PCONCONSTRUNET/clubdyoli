const { Client } = require('pg');

async function setAdmin() {
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
    
    const uid = '10277ec4-756a-43eb-b6b7-e7e73b27bc5a';
    const email = 'lucaspereirabn10@gmail.com';
    
    // Check if the profile exists
    const check = await client.query('SELECT * FROM profiles WHERE id = $1', [uid]);
    
    if (check.rows.length === 0) {
      console.log("Profile not found! Attempting to insert manually since auth triggered might have failed.");
      await client.query(`
        INSERT INTO profiles (id, role, nome, telefone)
        VALUES ($1, 'admin', 'Lucas Pereira', 'Admin')
      `, [uid]);
    } else {
      await client.query('UPDATE profiles SET role = $1 WHERE id = $2', ['admin', uid]);
    }
    
    console.log("Admin activated successfully for", email);
  } catch (err) {
    console.error("Error setting admin:", err);
  } finally {
    await client.end();
  }
}

setAdmin();
