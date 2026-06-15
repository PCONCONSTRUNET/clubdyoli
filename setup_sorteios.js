const { Client } = require('pg');

async function createSorteiosSchema() {
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

    // 1. Create sorteios table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sorteios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        titulo TEXT NOT NULL,
        descricao TEXT,
        premio TEXT NOT NULL,
        data_inicio TIMESTAMPTZ NOT NULL,
        data_fim TIMESTAMPTZ NOT NULL,
        imagem_url TEXT,
        status TEXT DEFAULT 'Pausado' CHECK (status IN ('Ativo', 'Pausado', 'Finalizado')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Enable RLS and add public access policy for sorteios table
    await client.query(`
      ALTER TABLE sorteios ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Acesso total provisorio sorteios" ON sorteios;
      CREATE POLICY "Acesso total provisorio sorteios" ON sorteios FOR ALL USING (true);
    `);

    console.log("Sorteios table created and RLS configured.");

    // 2. Create Storage Bucket for 'sorteios'
    // The storage.buckets table is where buckets are defined.
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('sorteios', 'sorteios', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Storage bucket 'sorteios' created.");

    // 3. Storage Policies (objects)
    // We need to allow insert, update, select, delete on storage.objects for the sorteios bucket
    await client.query(`
      DROP POLICY IF EXISTS "Acesso publico sorteios" ON storage.objects;
      CREATE POLICY "Acesso publico sorteios" ON storage.objects FOR ALL USING (bucket_id = 'sorteios');
    `);

    console.log("Storage policies for 'sorteios' created.");

  } catch (err) {
    console.error("Error creating schema:", err);
  } finally {
    await client.end();
  }
}

createSorteiosSchema();
