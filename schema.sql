-- Script de Criação do Banco de Dados - Club Dyoli

-- Habilitar a extensão para geração de UUIDs (padrão no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis (Profiles) - Sincronizada com auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Planos
CREATE TABLE planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Opções/Valores do Plano
CREATE TABLE plano_opcoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plano_id UUID REFERENCES planos(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  desconto TEXT,
  prioridade BOOLEAN DEFAULT FALSE
);

-- 4. Tabela de Assinaturas (Vincula cliente à uma opção de plano)
CREATE TABLE assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plano_opcao_id UUID REFERENCES plano_opcoes(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Ativa', 'Pendente', 'Cancelada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Pagamentos (Transações Financeiras)
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assinatura_id UUID REFERENCES assinaturas(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Aprovado', 'Pendente', 'Recusado')),
  data_pagamento TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Cupons
CREATE TABLE cupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  porcentagem_desconto INTEGER NOT NULL,
  validade TEXT, -- Ex: "31/12/2026" ou "Sem validade"
  total_usos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'))
);

-- Tabela de vínculo Usuário <> Cupons ativos na conta
CREATE TABLE user_cupons (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cupom_id UUID REFERENCES cupons(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, cupom_id)
);

-- 7. Configurações Globais (Parceria e Sistema)
CREATE TABLE configuracoes (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Garante que só terá 1 linha
  taxa_parceria INTEGER DEFAULT 15,
  nome_desenvolvedor TEXT DEFAULT 'Lucas Pereira',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir as configurações padrão iniciais
INSERT INTO configuracoes (id, taxa_parceria, nome_desenvolvedor) 
VALUES (1, 15, 'Lucas Pereira')
ON CONFLICT (id) DO NOTHING;

-- Inserir o plano principal mockado padrão para evitar o sistema vazio
INSERT INTO planos (id, nome, descricao, status)
VALUES ('b0e5d1e4-3c6a-4d2b-9e1e-45037d8a6a12', 'Club de Crédito', 'Assinatura mensal convertida em créditos e vantagens VIP.', 'Ativo')
ON CONFLICT DO NOTHING;

INSERT INTO plano_opcoes (plano_id, valor, desconto, prioridade)
VALUES 
  ('b0e5d1e4-3c6a-4d2b-9e1e-45037d8a6a12', 79.99, '5%', false),
  ('b0e5d1e4-3c6a-4d2b-9e1e-45037d8a6a12', 149.90, '7%', true),
  ('b0e5d1e4-3c6a-4d2b-9e1e-45037d8a6a12', 249.90, '10%', true),
  ('b0e5d1e4-3c6a-4d2b-9e1e-45037d8a6a12', 299.90, '15%', true);

-- Políticas de Segurança (RLS) - Liberando tudo para facilitar a integração inicial
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_opcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total provisório" ON profiles FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON planos FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON plano_opcoes FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON assinaturas FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON pagamentos FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON cupons FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON user_cupons FOR ALL USING (true);
CREATE POLICY "Acesso total provisório" ON configuracoes FOR ALL USING (true);
