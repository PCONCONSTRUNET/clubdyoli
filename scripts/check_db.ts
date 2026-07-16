import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iasvxupbueyiuvvyusde.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3Z4dXBidWV5aXV2dnl1c2RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg4NjgyNiwiZXhwIjoyMDk2NDYyODI2fQ.tZMspTbGbVdGVz4F98Rhtlpd747XTXOGYn1CUax7HIQ";
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
  if (error) {
     console.error(error);
  } else {
     console.log('OK');
  }
}
run();
