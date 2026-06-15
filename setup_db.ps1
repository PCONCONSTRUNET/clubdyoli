$env:SUPABASE_ACCESS_TOKEN = "your_supabase_token_here"
$env:SUPABASE_DB_PASSWORD = "your_supabase_password"

Write-Host "Inicializando Supabase..."
npx -y supabase init

Write-Host "Criando migration..."
npx -y supabase migration new initial_schema

Write-Host "Copiando schema.sql para migration..."
$migrationFile = Get-ChildItem -Path supabase/migrations/*_initial_schema.sql
if ($migrationFile) {
    Copy-Item -Path schema.sql -Destination $migrationFile.FullName -Force
}

Write-Host "Vinculando projeto..."
npx -y supabase link --project-ref iasvxupbueyiuvvyusde

Write-Host "Enviando pro banco..."
npx -y supabase db push
