-- Schema Updates for Clube Tattoo

-- 1. Update Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS creditos_acumulados DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS giros_disponiveis INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_clube_tattoo BOOLEAN DEFAULT false;

-- 2. Tabela: Premios Roleta
CREATE TABLE IF NOT EXISTS premios_roleta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('produto', 'credito_10', 'credito_20', 'extra_sorteio', 'extra_giro', 'servico_desconto', 'cupom_7')),
  peso INTEGER DEFAULT 10,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela: Histórico de Giros
CREATE TABLE IF NOT EXISTS historico_giros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  premio_id UUID REFERENCES premios_roleta(id) ON DELETE SET NULL,
  data_giro TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela: Histórico de Créditos
CREATE TABLE IF NOT EXISTS historico_creditos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela: Benefícios de Fidelidade (Configuração)
CREATE TABLE IF NOT EXISTS fidelidade_beneficios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meses INTEGER NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela: Sorteios Mensais
CREATE TABLE IF NOT EXISTS sorteios_mensais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mes_ano TEXT NOT NULL, -- Ex: '06/2026'
  titulo TEXT NOT NULL,
  data_sorteio TIMESTAMPTZ,
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'finalizado')),
  vencedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela: Participações em Sorteios
CREATE TABLE IF NOT EXISTS participacoes_sorteio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sorteio_id UUID REFERENCES sorteios_mensais(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'padrao' CHECK (tipo IN ('padrao', 'extra')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE premios_roleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_giros ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelidade_beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorteios_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE participacoes_sorteio ENABLE ROW LEVEL SECURITY;

-- Politicas Provisorias de Acesso Total
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso total provisório' AND tablename = 'premios_roleta') THEN
    CREATE POLICY "Acesso total provisório" ON premios_roleta FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso total provisório' AND tablename = 'historico_giros') THEN
    CREATE POLICY "Acesso total provisório" ON historico_giros FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso total provisório' AND tablename = 'historico_creditos') THEN
    CREATE POLICY "Acesso total provisório" ON historico_creditos FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso total provisório' AND tablename = 'fidelidade_beneficios') THEN
    CREATE POLICY "Acesso total provisório" ON fidelidade_beneficios FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso total provisório' AND tablename = 'sorteios_mensais') THEN
    CREATE POLICY "Acesso total provisório" ON sorteios_mensais FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso total provisório' AND tablename = 'participacoes_sorteio') THEN
    CREATE POLICY "Acesso total provisório" ON participacoes_sorteio FOR ALL USING (true);
  END IF;
END $$;

-- Inserir prêmios padrão para a roleta
INSERT INTO premios_roleta (nome, tipo, peso) VALUES
('Vale Produto do Estúdio', 'produto', 10),
('Crédito Acumulativo R$10', 'credito_10', 20),
('Crédito Acumulativo R$20', 'credito_20', 10),
('Participação Extra no Sorteio', 'extra_sorteio', 30),
('Giro Extra', 'extra_giro', 15),
('Serviço com Desconto Especial', 'servico_desconto', 10),
('Cupom de 7%', 'cupom_7', 5)
ON CONFLICT DO NOTHING;

-- Inserir benefícios de fidelidade padrão
INSERT INTO fidelidade_beneficios (meses, titulo, descricao) VALUES
(3, 'Primeiro Benefício Desbloqueado', 'Acesso liberado ao resgate de créditos acumulados.'),
(6, 'Benefício Premium', 'Desconto adicional em produtos selecionados.'),
(12, 'Benefício Exclusivo', 'Um serviço VIP gratuito por ano.')
ON CONFLICT (meses) DO NOTHING;
