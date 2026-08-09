-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Tenants (Empresas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  dominio VARCHAR(255) UNIQUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Profiles (Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Propriedades Rurais
CREATE TABLE IF NOT EXISTS public.propriedades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  localizacao VARCHAR(500),
  area_hectares DECIMAL(10, 2),
  tipo_solo VARCHAR(100),
  coordenadas_latitude DECIMAL(10, 8),
  coordenadas_longitude DECIMAL(11, 8),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Frota (Máquinas e Equipamentos)
CREATE TABLE IF NOT EXISTS public.frota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  ano_fabricacao INTEGER,
  placa VARCHAR(20),
  status VARCHAR(50) DEFAULT 'ativo',
  valor_aquisicao DECIMAL(12, 2),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Parceiros (Fornecedores, Prestadores)
CREATE TABLE IF NOT EXISTS public.parceiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100),
  documento VARCHAR(20),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Colheitas e Fretes
CREATE TABLE IF NOT EXISTS public.colheitas_fretes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  propriedade_id UUID REFERENCES public.propriedades(id),
  data_colheita DATE,
  cultura VARCHAR(100),
  quantidade_sacas DECIMAL(10, 2),
  quantidade_toneladas DECIMAL(10, 2),
  frete_valor DECIMAL(12, 2),
  parceiro_frete_id UUID REFERENCES public.parceiros(id),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo VARCHAR(50),
  data_transacao DATE NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  descricao VARCHAR(500),
  categoria VARCHAR(100),
  parceiro_id UUID REFERENCES public.parceiros(id),
  comprovante_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Colaboradores e Diárias
CREATE TABLE IF NOT EXISTS public.colaboradores_diarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome_colaborador VARCHAR(255) NOT NULL,
  funcao VARCHAR(100),
  data_diaria DATE NOT NULL,
  valor_diaria DECIMAL(10, 2),
  tipo_trabalho VARCHAR(100),
  observacoes TEXT,
  comprovante_url VARCHAR(500),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Fila de Sincronização (Sincronização Offline)
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  operation VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  retries INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_propriedades_tenant_id ON public.propriedades(tenant_id);
CREATE INDEX idx_frota_tenant_id ON public.frota(tenant_id);
CREATE INDEX idx_parceiros_tenant_id ON public.parceiros(tenant_id);
CREATE INDEX idx_colheitas_fretes_tenant_id ON public.colheitas_fretes(tenant_id);
CREATE INDEX idx_colheitas_fretes_propriedade_id ON public.colheitas_fretes(propriedade_id);
CREATE INDEX idx_transacoes_financeiras_tenant_id ON public.transacoes_financeiras(tenant_id);
CREATE INDEX idx_colaboradores_diarias_tenant_id ON public.colaboradores_diarias(tenant_id);
CREATE INDEX idx_sync_queue_tenant_id ON public.sync_queue(tenant_id);
CREATE INDEX idx_sync_queue_synced ON public.sync_queue(synced);

-- ENABLE Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colheitas_fretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores_diarias ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS - Tenants (acesso apenas para donos/membros)
CREATE POLICY "Usuários podem ver seu próprio tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Profiles (acesso por tenant)
CREATE POLICY "Acesso por Tenant - profiles"
  ON public.profiles FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Propriedades (acesso por tenant)
CREATE POLICY "Acesso por Tenant - propriedades"
  ON public.propriedades FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Frota (acesso por tenant)
CREATE POLICY "Acesso por Tenant - frota"
  ON public.frota FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Parceiros (acesso por tenant)
CREATE POLICY "Acesso por Tenant - parceiros"
  ON public.parceiros FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Colheitas Fretes (acesso por tenant)
CREATE POLICY "Acesso por Tenant - colheitas_fretes"
  ON public.colheitas_fretes FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Transações Financeiras (acesso por tenant)
CREATE POLICY "Acesso por Tenant - transacoes_financeiras"
  ON public.transacoes_financeiras FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- POLÍTICAS RLS - Colaboradores Diárias (acesso por tenant)
CREATE POLICY "Acesso por Tenant - colaboradores_diarias"
  ON public.colaboradores_diarias FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );
