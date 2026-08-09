# FarmDuty — Arquitetura Técnica Completa

**Última Atualização:** 2026-08-09  
**Status:** Implementação em Progresso

---

## 🏗️ Visão Geral da Arquitetura

FarmDuty é uma plataforma de gestão agrícola híbrida (cloud-offline) com inteligência artificial multimodal integrada. A arquitetura é modular, escalável e projetada para funcionar em ambientes com conexão intermitente.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UI Components (White-Label + Multimodal Input)      │   │
│  │  - BrandedHeader (Logo customizada)                  │   │
│  │  - MultimodalInputModal (Voz/Foto/Texto)             │   │
│  │  - BrandedFooter (Copyright obrigatório)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (React Context)                    │   │
│  │  - AuthContext (Autenticação multi-tenant)           │   │
│  │  - AppContext (Estado da aplicação)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services de IA Locais                               │   │
│  │  - dataExtractionAgent (Claude LLM)                  │   │
│  │  - audioTranscription (Whisper API)                  │   │
│  │  - imageOCR (Claude Vision)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Offline Storage (Dexie/IndexedDB)                   │   │
│  │  - sync_queue (Fila de sincronização)                │   │
│  │  - local tables (Dados de operações)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑↓ (HTTP/REST)
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API REST                                            │   │
│  │  - /api/transactions (CRUD)                          │   │
│  │  - /api/organizations (White-Label)                  │   │
│  │  - /api/sync (Sincronização)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Webhook WhatsApp (FarmDuty Copilot)                 │   │
│  │  - POST /whatsapp/webhook (Recebimento)              │   │
│  │  - GET /whatsapp/webhook (Validação)                 │   │
│  │  - Integração com Evolution API / Z-API / Twilio     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Serviços de IA (Backend)                            │   │
│  │  - Claude API (Extração + Classificação)             │   │
│  │  - Armazenamento de OperationalRecords               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ORM (Prisma)                                        │   │
│  │  - Modelos: Organization, Wallet, Partner, etc.      │   │
│  │  - Migrations automáticas                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑↓ (PostgreSQL)
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL/Supabase)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tabelas Operacionais (Multi-Tenant)                 │   │
│  │  - organizations (White-Label)                       │   │
│  │  - users (com roles)                                 │   │
│  │  - wallets (Fazenda/Pessoal)                         │   │
│  │  - financial_transactions                            │   │
│  │  - partners (Fornecedores/Compradores)               │   │
│  │  - operational_records (IA metadata)                 │   │
│  │  - properties, fleet, harvests, etc.                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Row Level Security (RLS)                            │   │
│  │  - Isolamento por tenant automático                  │   │
│  │  - Verificação de JWT via Supabase Auth              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
projeto-sinho/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BrandedHeader.tsx          # Header customizável
│   │   │   ├── BrandedFooter.tsx          # Footer com copyright
│   │   │   └── Header.tsx                 # Header principal
│   │   ├── modals/
│   │   │   ├── AuthModal.tsx              # Login/Signup
│   │   │   └── MultimodalInputModal.tsx   # Voz/Foto/Texto
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.tsx                # Autenticação
│   │   └── AppContext.tsx
│   ├── hooks/
│   │   ├── useBranding.ts                 # Carregar branding da org
│   │   └── useOnlineStatus.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── audioTranscription.ts      # Whisper API
│   │   │   ├── imageOCR.ts                # Claude Vision
│   │   │   ├── dataExtractionAgent.ts     # Agente de extração
│   │   │   └── index.ts
│   │   ├── db.ts                          # Dexie/IndexedDB
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts                    # Cliente Supabase
│   │   ├── syncEngine.ts                  # Engine de sync
│   │   └── ...
│   ├── routes/
│   │   └── whatsapp.ts                    # Webhook WhatsApp
│   └── ...
├── prisma/
│   └── schema.prisma                      # Schema ORM
├── PRD.md                                 # Especificação do produto
├── ARCHITECTURE.md                        # Este arquivo
├── supabase_schema.sql                    # Schema do banco
└── ...
```

---

## 🔄 Fluxo de Dados: Entrada Multimodal

### 1. Via App Mobile (Texto)
```
Usuário digita → MultimodalInputModal
    ↓
dataExtractionAgent.extractTransaction()
    ↓
Claude API processa texto
    ↓
Retorna ExtractedTransactionData
    ↓
Usuário confirma
    ↓
Salva em IndexedDB + sync_queue
    ↓
(Quando online) Envia para Supabase
```

### 2. Via WhatsApp (Áudio)
```
Usuário envia áudio no WhatsApp
    ↓
Webhook recebe (Evolution API/Z-API/Twilio)
    ↓
Baixa arquivo de áudio
    ↓
transcribeAudioWithWhisper() → Claude Whisper API
    ↓
handleAudioMessage() chama dataExtractionAgent
    ↓
Claude LLM extrai dados
    ↓
Envia confirmação com botões pro WhatsApp
    ↓
Usuário clica "Confirmar"
    ↓
Cria FinancialTransaction + Wallet update no Supabase
```

### 3. Via WhatsApp (Foto de Documento)
```
Usuário envia foto no WhatsApp (nota fiscal, boleto, rótulo)
    ↓
Webhook recebe
    ↓
extractFromImage() → Claude Vision API
    ↓
OCR extrai texto + dados estruturados
    ↓
handleImageMessage() chama dataExtractionAgent
    ↓
Claude LLM classifica e extrai (Carteira, Categoria, etc)
    ↓
Envia confirmação
    ↓
Usuário confirma
    ↓
Cria transação no Supabase com metadata:
   - audioUrl: null
   - rawTranscription: null
   - extractedData: JSON com dados extraídos
```

---

## 💾 Sincronização Hybrid Cloud-Offline

### Engine de Sincronização (syncEngine.ts)
- **Responsabilidade:** Gerenciar fila de mudanças e sincronizar com nuvem
- **Gatilhos:**
  - Detecção automática de mudança de status (online/offline)
  - Timer automático a cada 30 segundos
  - Chamada manual via `syncEngine.syncPendingChanges()`

### Fluxo de Sincronização
1. **Offline:** Usuário edita dados → Salva em IndexedDB + adiciona à `sync_queue`
2. **Online:** syncEngine detecta conexão → Começa a sincronizar
3. **Processo:** Para cada item na fila:
   - Busca se já existe no Supabase
   - Verifica conflitos (Last Write Wins)
   - Envia PUT (update) ou POST (insert)
   - Marca como synced = true
4. **Download:** Busca mudanças da nuvem dos últimos N segundos
5. **Indicador:** Header mostra status (Verde/Azul/Cinza/Vermelho)

### Tabela sync_queue
```prisma
model SyncQueue {
  id: UUID                    // ID único
  organizationId: UUID        // Isolamento por tenant
  entityType: String          // "financial_transactions", "partners", etc
  operation: SyncOperation    // INSERT | UPDATE | DELETE
  entityId: UUID              // ID da entidade afetada
  payload: JSON               // Dados completos
  isSynced: Boolean           // Status de sincronização
  syncedAt: DateTime          // Quando foi sincronizado
  retryCount: Int             // Tentativas de sincronização
  lastError: String           // Mensagem de erro, se houver
  createdAt: DateTime
}
```

---

## 🔐 Segurança & Isolamento por Tenant

### Row Level Security (RLS) em Supabase
Todas as tabelas operacionais têm a política:
```sql
CREATE POLICY "Acesso por Tenant"
ON public.[tabela]
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid()
  )
);
```

**Garantias:**
- Usuário só vê dados da sua `organization_id`
- JWT do Supabase Auth valida `auth.uid()`
- Sem necessidade de verificação manual no backend

### Campos de Auditoria
- `createdBy: String?` — Email do usuário que criou
- `createdAt: DateTime` — Timestamp de criação
- `updatedAt: DateTime` — Timestamp de atualização

---

## 🎨 White-Label & Branding Customizável

### Model Organization
```prisma
model Organization {
  id: String                  // CUID único
  name: String                // Nome da fazenda/empresa
  slug: String @unique        // URL-safe identifier
  
  // White-Label
  customLogoUrl: String?      // Logo da organização
  appName: String?            // Nome do app customizado
  primaryColor: String?       // Cor primária (hex)
  
  // Relations
  members: User[]
  wallets: Wallet[]
  transactions: FinancialTransaction[]
  ...
}
```

### Componentes de UI
- **BrandedHeader:** Renderiza logo customizada + nome da org
- **BrandedFooter:** Copyright obrigatório "Desenvolvido por FarmDuty®"
- **useBranding Hook:** Carrega config de branding da org

### Comportamento
1. Usuário faz login → Sistema carrega dados da Organization
2. Header renderiza logo + nome customizado
3. Cor primária é aplicada a botões, badges, gráficos
4. Footer sempre exibe "Powered by FarmDuty®" (obrigatório)

---

## 💰 Módulo Financeiro: As Duas Carteiras

### Wallet (Enum)
- **FARM** — Carteira Fazenda (custos operacionais)
- **PERSONAL** — Carteira Pessoal (produtor e família)

### FinancialTransaction
```prisma
model FinancialTransaction {
  id: UUID
  type: TransactionType       // INCOME | EXPENSE | TRANSFER
  status: TransactionStatus   // PENDING | CONFIRMED | PAID | RECEIVED
  category: ExpenseCategory   // SEEDS, FUEL, LABOR, PAYOUT, etc
  
  amount: Decimal
  transactionDate: DateTime
  dueDate: DateTime?
  paidDate: DateTime?
  
  walletId: UUID              // Referência à carteira
  partnerId: UUID?            // Fornecedor/Comprador
  operationalRecordId: UUID?  // Criada via IA (áudio/foto)
}
```

### Classificação Automática via IA
O agente Claude analisa descrição e **sugere automaticamente**:
- WALLET (FARM ou PERSONAL)
- CATEGORY (SEEDS, FUEL, LABOR, etc)
- TRANSACTION_TYPE (INCOME ou EXPENSE)

O usuário **confirma com 1 clique** em vez de preencher formulário.

### Alertas de Vencimento
- **7 dias antes:** Amarelo (atenção)
- **Vencido:** Vermelho (crítico)
- Dashboard mostra "Contas a Pagar" e "Contas a Receber"

---

## 🤖 FarmDuty Copilot (WhatsApp)

### Fluxo de Conversa
1. **Usuário envia mensagem** → Webhook recebe
2. **Transcrição/OCR** → Claude processa
3. **Extração de Dados** → Identifica item, valor, fornecedor, data
4. **Confirmação Interativa** → Botões "Confirmar", "Editar", "Cancelar"
5. **Salvamento** → Cria transação no banco com metadata completa

### Metadata Armazenada (OperationalRecord)
```prisma
model OperationalRecord {
  id: UUID
  source: OperationalRecordSource  // WHATSAPP_VOICE | WHATSAPP_IMAGE | etc
  rawInput: String                 // Texto original
  audioUrl: String?                // URL do áudio original
  imageUrl: String?                // URL da imagem original
  
  rawTranscription: String?        // Áudio transcrito
  extractedData: Json              // Dados extraídos (JSON)
  confidenceScore: Float           // 0.0 a 1.0
  
  isProcessed: Boolean
  processingStatus: String         // PENDING | PROCESSING | COMPLETED | FAILED
}
```

### Suporte a Múltiplos Providers
- **Evolution API** (Recomendado — open source)
- **Z-API** (Cloud-based)
- **Twilio** (Mais conhecida)

---

## 📊 OperationalRecord: Registry de Inteligência

Cada entrada via IA (áudio, foto, texto) cria um `OperationalRecord`:
- **Rastreabilidade:** Qual foi o input original?
- **Auditoria:** Quando, de onde, com que confiança?
- **Refinamento:** Dados brutos + extração estruturada
- **Histórico de Cotações:** Parceiros X Preços ao longo do tempo

---

## 🚀 Deployment & Infraestrutura

### Frontend
- **Hosting:** Vercel
- **Build:** `npm run build` → Vite
- **Runtime:** Node.js LTS + React 18+

### Backend
- **Hosting:** Railway / Heroku / DigitalOcean
- **Runtime:** Node.js LTS + Express.js
- **Database:** PostgreSQL (Supabase)

### Variáveis de Ambiente

**Frontend (.env.local):**
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

**Backend (.env):**
```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...        # Para Whisper
WHATSAPP_PROVIDER=evolution  # evolution | zapi | twilio
EVOLUTION_INSTANCE_NAME=farmduty
EVOLUTION_API_TOKEN=...
EVOLUTION_API_URL=https://...
```

---

## 📋 Checklist de Implementação

- [x] PRD.md — Especificação completa
- [x] Prisma Schema — Modelos de dados
- [x] Services de IA — Transcrição, OCR, Extração
- [x] Webhook WhatsApp — Recepção e processamento
- [x] Componentes White-Label — Header, Footer, Branding
- [ ] Integração com Supabase — Deploy schema
- [ ] Migrations do Prisma — Criar tabelas
- [ ] API REST backend — Endpoints CRUD
- [ ] Testes unitários — IA, Sync, Autenticação
- [ ] Documentação de API — OpenAPI/Swagger
- [ ] Deploy em produção — Vercel + Railway

---

## 🎯 Próximos Passos

1. **Fase 1:** Deploy do schema no Supabase
2. **Fase 2:** Implementar API REST (POST /transactions, GET /transactions, etc)
3. **Fase 3:** Integrar webhook WhatsApp com um provider (recomendado: Evolution)
4. **Fase 4:** Testes end-to-end (enviar áudio via WhatsApp → ver transação criada)
5. **Fase 5:** Deploy em produção e onboarding de usuários

---

**FarmDuty® · A gestão agrícola que se adapta ao seu campo.**
