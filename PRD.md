# FarmDuty — PRD (Product Requirements Document)

**Data de Atualização:** 2026-08-09  
**Status:** In Development (Fase Híbrida Cloud-Offline + IA/Multimodal)

---

## 📋 Visão Geral do Produto

**FarmDuty** é um sistema de gestão agrícola inteligente, projetado para propriedades rurais de qualquer tamanho, com foco em baixa alfabetização digital e zero digitação no campo.

### Identidade Oficial
- **Nome:** FarmDuty
- **Domínio:** farmduty.com.br
- **Slogan:** "Feito junto com você."
- **Posicionamento:** A gestão agrícola que se adapta ao seu campo, não o contrário.
- **Tagline Técnico:** Sincronização Híbrida Cloud-Offline + Inteligência Artificial Multimodal

---

## 🎨 Identidade Visual

### White-Label (Customização por Organização)
Cada fazenda/organização pode customizar:
- **Logo personalizada** (`customLogoUrl`)
- **Nome de exibição** (`appName`)
- **Cor primária** (`primaryColor`) — influencia badges, botões, gráficos

### Copyright Obrigatório
Exibição discreta e permanente:
- **Rodapé:** "Desenvolvido por FarmDuty® · Todos os direitos reservados"
- **Telas de Login:** "Powered by FarmDuty®"
- **Relatórios PDF:** "Desenvolvido por FarmDuty®"

### Paleta de Cores Padrão
- **Verde:** Sucesso, operações ativas, caixa positivo
- **Amarelo:** Atenção, contas a vencer, alertas
- **Vermelho:** Crítico, contas vencidas, perdas
- **Cinza:** Dados offline, sincronização pendente

---

## 🏗️ Arquitetura Técnica

### Stack
- **Frontend:** React/Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js/Express (ou Fastify) + Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Offline Storage:** Dexie.js (IndexedDB)
- **Autenticação:** Supabase Auth (JWT) + RLS por Tenant
- **IA/ML:** Anthropic Claude API + Whisper API
- **WhatsApp:** Evolution API / Z-API / Twilio
- **Hospedagem:** Vercel (Frontend) + Railway/Heroku (Backend)

---

## 📱 Módulos do Sistema

### 1. **AUTENTICAÇÃO & MULTI-TENANT**
- Registro de produtor/organização
- Convite de colaboradores
- Controle de permissões (Admin, Operacional, Gerente)
- Sincronização de dois sistemas de sessão (AuthStore + ConfigService)

### 2. **DASHBOARD & OVERVIEW**
- Cartão de resumo financeiro (Receitas / Despesas / Lucro Líquido)
- Alertas de contas a pagar/receber com 7 dias de antecedência
- Gráficos de tendências (últimos 90 dias)
- Indicador de status de sincronização (Verde/Azul/Amarelo/Cinza)

### 3. **MÓDULO FINANCEIRO "AS DUAS CARTEIRAS"**

#### 3.1 Carteira Fazenda
Custos operacionais exclusivos da produção:
- Insumos (sementes, fertilizantes, pesticidas)
- Diesel e combustíveis
- Manutenção de máquinas
- Aluguel de maquinário
- Mão de obra (diárias de colaboradores)
- Fretes de colheita

#### 3.2 Carteira Pessoal
Despesas e receitas do produtor:
- Pró-labore (retiradas mensais)
- Despesas familiares (alimentação, saúde, educação)
- Impostos pessoais (IRPF, contribuições)

#### 3.3 Funcionalidades
- Criação de lançamentos via:
  - Formulário manual
  - Voz (WhatsApp Copilot via áudio)
  - OCR de notas fiscais/boletos
- Classificação automática via IA (com confirmação por clique)
- Alertas de vencimento (amarelo em 7 dias, vermelho após)
- Relatórios mensais/trimestrais por carteira
- Exportação em PDF

---

## 🤖 Agente de IA — FarmDuty Copilot

### Integração WhatsApp
O produtor envia para o número do FarmDuty Copilot:
- **Áudios curtos** (estilo WhatsApp)
- **Fotos de notas fiscais, boletos, rótulos**
- **Prints de conversas comerciais**
- **Textos diretos**

### Pipeline de Processamento
1. **Recepção via Webhook** (Evolution API / Z-API / Twilio)
2. **Transcrição de Áudio** (Whisper API)
3. **OCR de Imagens** (Tesseract.js ou Claude Vision)
4. **Extração de Dados** (Claude LLM):
   - Item / Produto
   - Quantidade
   - Valor Unitário
   - Fornecedor / Comprador
   - Data / Vencimento
   - Classificação automática (Carteira Fazenda/Pessoal)
5. **Confirmação Interativa** (Botões sim/não/editar)
6. **Salvamento** no banco de dados com metadata:
   - `audioUrl` (arquivo de áudio)
   - `rawTranscription` (texto bruto)
   - `extractedData` (JSON estruturado)

### Histórico de Cotações
- Mantém cadastro de Parceiros Comerciais
- Histórico de preços por produto/fornecedor
- Alertas de variação de preços

---

## 📊 Módulos Operacionais

### 4. **PROPRIEDADES & TALHÕES**
- Cadastro de propriedades com localização (GPS)
- Divisão em talhões (áreas de cultivo)
- Fotos aéreas / mapas de satélite integrados
- Histórico de cultivos por talhão

### 5. **FROTA & MANUTENÇÃO**
- Cadastro de máquinas e equipamentos
- Agenda de manutenção preventiva
- Histórico de gastos com manutenção
- Alertas de manutenção vencida
- Consumo de diesel por máquina

### 6. **COLHEITAS & FRETES**
- Registro de colheita por talhão
- Cálculo automático de produtividade
- Cotação e contratação de fretes
- Rastreamento de cargas
- Notas fiscais de venda

### 7. **COLABORADORES & DIÁRIAS**
- Cadastro de colaboradores
- Registro de diárias por tipo de trabalho
- Cálculo automático de horas extras
- Folha de pagamento integrada
- Histórico de desempenho

### 8. **PARCEIROS COMERCIAIS**
- Fornecedores de insumos
- Prestadores de serviço
- Compradores/varejistas
- Histórico de transações
- Avaliação de desempenho

### 9. **RELATÓRIOS & ANÁLISES**
- Lucratividade por safra/talhão
- Comparativo de custos (IA sugere otimizações)
- Previsão de receita vs. despesa
- Exportação em PDF com branding customizável
- Dashboard analítico com gráficos interativos

---

## 🎯 Diretrizes de UX/UI

### Visual-First & Multimodal
1. **Ícones Grandes** — Buttons com ícones de 24px+, texto secundário
2. **Fotos Reais** — Máquinas, talhões, produtos em galeria
3. **Código de Cores Universais:**
   - 🟢 Verde: Operações ativas, positivo
   - 🟡 Amarelo: Atenção, pendências
   - 🔴 Vermelho: Crítico, vencido
   - ⚪ Cinza: Offline, histórico

### Fluxos Operacionais Permissivos
- Não travam o usuário se houver divergência de dados
- Geram alertas gerenciais para revisão posterior
- Sincronização automática resolve inconsistências

### Acessibilidade para Baixa Alfabetização
- Mínimo de texto necessário
- Confirmações visuais em vez de confirmações textuais
- Voz como input primário no campo
- Botões contextuais (botão "Pagar" vs. "Receber")

---

## 🔐 Segurança & Compliance

### Row-Level Security (RLS)
- Supabase Auth + JWT policies
- Isolamento de dados por tenant (`organization_id`)
- Usuários veem apenas dados da sua organização

### Criptografia
- HTTPS/TLS em trânsito
- Dados sensíveis criptografados em repouso
- Tokens de sessão com TTL de 24h

### Conformidade
- LGPD (Lei Geral de Proteção de Dados)
- Direito ao esquecimento implementado
- Auditoria de acessos de dados financeiros

---

## 📡 Sincronização Hybrid Cloud-Offline

### Fila de Sincronização (sync_queue)
- Registro automático de todas as mudanças no IndexedDB
- Detecção de conflitos: **Last Write Wins**
- Retry automático (até 3 tentativas)

### Fluxo de Sincronização
1. **Offline:** Dados salvos localmente + fila
2. **Online:** Envia alterações para Supabase
3. **A cada 30s:** Verifica por atualizações da nuvem
4. **Indicador Visual:** Header mostra status (Sincronizado / Sincronizando / Offline / Conflito)

### Tabelas Operacionais (Multi-Tenant)
- `organizations` (com White-Label fields)
- `properties` (Propriedades)
- `plots` (Talhões)
- `fleet` (Frota)
- `partners` (Parceiros)
- `financial_transactions` (Transações, divididas por Carteira)
- `operational_records` (Registros de operações com IA metadata)
- `collaborators` (Colaboradores)
- `harvests_shipments` (Colheitas e Fretes)
- `sync_queue` (Fila de sincronização)

---

## 🚀 Roadmap de Desenvolvimento

### Phase 1 (Sprint 1-2): Foundation
- ✅ Schema Prisma com White-Label + Carteiras
- ✅ Componentes de UI com branding customizável
- ✅ Autenticação multi-tenant

### Phase 2 (Sprint 3-4): Financeiro + Copilot Básico
- 🔄 Módulo Financeiro (as duas carteiras)
- 🔄 Webhook WhatsApp básico (texto/áudio)
- 🔄 Transcrição Whisper
- 🔄 Agente Claude para extração de dados

### Phase 3 (Sprint 5-6): Operacional Completo
- 🔄 Módulos de Propriedades, Frota, Colheitas
- 🔄 OCR de notas fiscais (Claude Vision)
- 🔄 Histórico de cotações

### Phase 4 (Sprint 7-8): Relatórios & Analytics
- 🔄 Dashboard analítico
- 🔄 Exportação PDF com branding
- 🔄 Recomendações de IA (otimização de custos)

---

## 📊 Métricas de Sucesso

- **Adoção:** 10+ propriedades usando o sistema
- **Retenção:** 80%+ dos usuários ativos após 30 dias
- **Sincronização:** 99.9% de uptime de sincronização
- **IA Copilot:** 85%+ de taxa de acerto na extração de dados
- **Tempo de entrada de dados:** < 30 segundos via Copilot vs. 5 minutos manual

---

## 📞 Contato & Suporte

- **Email:** suporte@farmduty.com.br
- **WhatsApp Copilot:** (link para adicionar o número do bot)
- **Docs:** farmduty.com.br/docs

---

**FarmDuty® · Desenvolvido com ❤️ para quem trabalha no campo.**
