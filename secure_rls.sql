-- 1. DROPAR AS POLÍTICAS PROVISÓRIAS (TOTALMENTE ABERTAS)
DROP POLICY IF EXISTS "Acesso total provisório" ON profiles;
DROP POLICY IF EXISTS "Acesso total provisório" ON planos;
DROP POLICY IF EXISTS "Acesso total provisório" ON plano_opcoes;
DROP POLICY IF EXISTS "Acesso total provisório" ON assinaturas;
DROP POLICY IF EXISTS "Acesso total provisório" ON pagamentos;
DROP POLICY IF EXISTS "Acesso total provisório" ON cupons;
DROP POLICY IF EXISTS "Acesso total provisório" ON user_cupons;
DROP POLICY IF EXISTS "Acesso total provisório" ON configuracoes;

-- 2. FUNÇÃO DE CHECAGEM DE ADMIN SEGURA (Bypassa o RLS para evitar recursão infinita)
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR AS POLÍTICAS REAIS E ESTRITAS

-- PROFILES (Perfis)
-- Admin pode fazer tudo. Cliente pode apenas LER e ATUALIZAR seu próprio perfil.
CREATE POLICY "Admins podem fazer tudo em profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Usuários podem ver o próprio perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PLANOS e PLANO_OPCOES (Planos do sistema)
-- Admin pode criar, editar e excluir planos. Clientes só podem LER os planos disponíveis.
CREATE POLICY "Admins podem fazer tudo em planos" ON planos FOR ALL USING (is_admin());
CREATE POLICY "Qualquer pessoa pode ver planos" ON planos FOR SELECT USING (true);

CREATE POLICY "Admins podem fazer tudo em plano_opcoes" ON plano_opcoes FOR ALL USING (is_admin());
CREATE POLICY "Qualquer pessoa pode ver opções de planos" ON plano_opcoes FOR SELECT USING (true);

-- ASSINATURAS
-- Admin faz tudo. Clientes só podem ver suas próprias assinaturas.
CREATE POLICY "Admins podem fazer tudo em assinaturas" ON assinaturas FOR ALL USING (is_admin());
CREATE POLICY "Usuários podem ver suas assinaturas" ON assinaturas FOR SELECT USING (auth.uid() = user_id);

-- PAGAMENTOS
-- Admin faz tudo. Clientes só podem ver seus próprios pagamentos.
CREATE POLICY "Admins podem fazer tudo em pagamentos" ON pagamentos FOR ALL USING (is_admin());
CREATE POLICY "Usuários podem ver seus pagamentos" ON pagamentos FOR SELECT USING (auth.uid() = user_id);

-- CUPONS
-- Admin faz tudo. Clientes podem apenas ler cupons existentes (para validar o código, etc).
CREATE POLICY "Admins podem fazer tudo em cupons" ON cupons FOR ALL USING (is_admin());
CREATE POLICY "Qualquer pessoa pode ver cupons" ON cupons FOR SELECT USING (true);

-- USER_CUPONS (Carteira de cupons)
-- Admin faz tudo. Usuários podem ver apenas os seus próprios cupons na carteira.
CREATE POLICY "Admins podem fazer tudo em user_cupons" ON user_cupons FOR ALL USING (is_admin());
CREATE POLICY "Usuários podem ver seus próprios cupons na carteira" ON user_cupons FOR SELECT USING (auth.uid() = user_id);

-- CONFIGURACOES
-- Admin edita a taxa de parceria e configurações. Demais usuários/visitantes podem apenas ler.
CREATE POLICY "Admins podem editar configuracoes" ON configuracoes FOR ALL USING (is_admin());
CREATE POLICY "Qualquer pessoa pode ler configuracoes" ON configuracoes FOR SELECT USING (true);
