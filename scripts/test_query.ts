import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://iasvxupbueyiuvvyusde.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3Z4dXBidWV5aXV2dnl1c2RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg4NjgyNiwiZXhwIjoyMDk2NDYyODI2fQ.tZMspTbGbVdGVz4F98Rhtlpd747XTXOGYn1CUax7HIQ";
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data } = await supabase.from("profiles").select("id, nome, role").limit(10);
  console.log(data);
}
run();
