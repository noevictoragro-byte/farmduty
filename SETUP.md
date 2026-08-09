# FarmDuty — Guia de Setup e Configuração

**Última atualização:** 2026-08-09

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ e npm/yarn
- PostgreSQL (local ou Supabase)
- Conta no Anthropic (Claude API)
- Conta no Supabase (opcional, pode usar auto-hospedagem)

### 1. Instalação Básica

```bash
# Clonar repositório
git clone https://github.com/seu-repo/farmduty.git
cd farmduty

# Instalar dependências
npm install

# Copiar arquivo de env
cp .env.example .env.local
```

### 2. Configurar Supabase

#### Opção A: Usar Supabase Cloud (Recomendado)
1. Ir para [supabase.com](https://supabase.com) e criar um projeto
2. Copiar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para `.env.local`
3. No dashboard do Supabase, ir a SQL e executar `supabase_schema.sql`:

```sql
-- Copiar conteúdo de supabase_schema.sql e executar aqui
```

#### Opção B: Auto-hospedagem com Docker
```bash
# Usar Docker Compose para Supabase
docker-compose up -d

# Executar migrations
npm run prisma:migrate
```

### 3. Configurar Variáveis de Ambiente

**.env.local (Frontend)**
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IA
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-... # Para Whisper (opcional)
```

**.env (Backend)**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/farmduty

# Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# IA
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-... # Whisper API

# WhatsApp (Copilot)
WHATSAPP_PROVIDER=evolution  # evolution | zapi | twilio
WHATSAPP_VERIFY_TOKEN=farmduty_verify_token
EVOLUTION_INSTANCE_NAME=farmduty
EVOLUTION_API_TOKEN=your-token-here
EVOLUTION_API_URL=https://api.evolution.com
```

### 4. Rodar Aplicação

```bash
# Frontend (Vite)
npm run dev
# Abre em http://localhost:5173

# Backend (se usar)
npm run server
# Roda em http://localhost:3000
```

---

## 🔧 Configuração Avançada

### Deploy no Supabase

```bash
# Criar migration do Prisma
npx prisma migrate dev --name initial_schema

# Gerar cliente Prisma
npx prisma generate

# Deploy (push schema para prod)
npx prisma migrate deploy
```

### Integrar Evolution API (WhatsApp Copilot)

1. **Criar instância no Evolution API:**
```bash
curl -X POST https://api.evolution.com/instances \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "farmduty",
    "qrcode": true
  }'
```

2. **Configurar webhook:**
```bash
# Atualizar URL do webhook
curl -X PUT https://api.evolution.com/instances/farmduty/webhook \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://seu-servidor.com/api/whatsapp/webhook",
    "events": ["messages", "status"]
  }'
```

3. **Validar webhook:**
- GET `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...` deve retornar 200

### Configurar Whisper API (Transcrição de Áudio)

```env
OPENAI_API_KEY=sk-... # Sua chave OpenAI
```

O sistema automaticamente usará Whisper quando receber áudio via WhatsApp.

### Configurar Claude Vision (OCR de Imagens)

Nenhuma configuração adicional — usa `ANTHROPIC_API_KEY`.

---

## 📊 Estrutura de Dados

### User Roles
- **ADMIN:** Acesso total + gerenciamento de usuários
- **MANAGER:** Acesso total a dados operacionais
- **OPERATIONAL:** Apenas registro de dados (sem edição/exclusão)
- **VIEWER:** Apenas leitura

### Carteiras (Wallets)
- **FARM:** Custos operacionais (insumos, diesel, diárias)
- **PERSONAL:** Retiradas e despesas familiares

### Categorias de Despesa
- Insumos: SEEDS, FERTILIZERS, PESTICIDES
- Operação: FUEL, MACHINE_MAINTENANCE, MACHINE_RENTAL
- Mão de obra: LABOR
- Logística: FREIGHT
- Pessoal: PAYOUT, FOOD, HEALTH, EDUCATION, PERSONAL_TAX

---

## 🤖 Usar FarmDuty Copilot (WhatsApp)

### 1. Adicionar Número ao WhatsApp

Após configurar Evolution API, adicione o número do bot aos seus contatos:
```
📞 +55 (XX) XXXXX-XXXX
Mensagem: "Olá"
```

### 2. Enviar Dados de Transação

**Via Texto:**
```
"Comprei 50kg de adubo da Empresa X por R$ 250, vence dia 20"
```

**Via Áudio:**
- Grava um áudio curto descrevendo a transação
- Sistema transcreve via Whisper

**Via Foto:**
- Tira foto de nota fiscal, boleto ou rótulo
- Sistema extrai dados automaticamente via OCR

### 3. Confirmação Interativa

O bot retorna:
```
📋 Registrando Transação

📦 Produto: Adubo NPK
📊 Quantidade: 50 kg
💰 Valor Unit.: R$ 5.00
💵 Total: R$ 250.00

🏢 Fornecedor: Empresa X
📁 Categoria: FERTILIZERS
🏠 Carteira: 🌾 Fazenda
📅 Data: 09/08/2026
📆 Vencimento: 20/08/2026

✨ Confiança: 95%

Está correto?
✅ Confirmar | ✏️ Editar | ❌ Cancelar
```

Usuário clica **Confirmar** → Transação salva automaticamente.

---

## 🎨 Customização White-Label

### Atualizar Branding de uma Organização

Via API (requer token de admin):
```bash
PATCH /api/organizations/{orgId}
Content-Type: application/json

{
  "appName": "Fazenda XYZ",
  "customLogoUrl": "https://cdn.example.com/logo.png",
  "primaryColor": "#ff6b35"  // Cor hexadecimal
}
```

### No Código (hardcoded para dev)

**src/hooks/useBranding.ts**
```typescript
const branding = {
  organizationName: "Minha Fazenda",
  primaryColor: "#ff6b35",
  customLogoUrl: "https://...",
}
```

---

## 🔐 Segurança

### Row Level Security (RLS) em Supabase

Automaticamente aplicado — cada usuário só vê dados da sua organização.

### Auditoria

Todas as transações incluem:
- `createdBy: String` — Email do criador
- `createdAt: DateTime` — Data/hora
- `updatedAt: DateTime` — Última modificação

### Backup Automático

```bash
# Supabase faz backup automático
# Restaurar manualmente:
pg_dump -h host -U user -d dbname > backup.sql
psql -h host -U user -d dbname < backup.sql
```

---

## 📈 Monitoramento & Logs

### Verificar Status de Sincronização

No dashboard do Supabase:
```sql
SELECT * FROM sync_queue 
WHERE organization_id = 'your-org-id' 
AND is_synced = false;
```

### Ver Registros IA (OperationalRecords)

```sql
SELECT * FROM operational_records 
WHERE organization_id = 'your-org-id' 
ORDER BY created_at DESC 
LIMIT 20;
```

### Erros de Processamento

```sql
SELECT 
  id, source, processing_status, processing_error, created_at
FROM operational_records 
WHERE processing_status = 'FAILED' 
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### "useAuth deve ser usado dentro de um AuthProvider"
- Verificar se `<AuthProvider>` envolve toda a árvore de componentes
- Ver `src/App.tsx`

### Áudio não transcreve
- Verificar `OPENAI_API_KEY` configurada
- Testar com arquivo de áudio válido (mp3, wav, m4a)

### Foto não extrai dados
- Verificar resolução da foto (min 300x300)
- Testar com documento real (não desenho)

### WhatsApp não recebe mensagens
- Verificar URL do webhook (HTTPS obrigatório)
- Testar health check: `curl https://seu-servidor.com/health`
- Ver logs do Evolution API

### Sincronização não funciona
- Verificar `navigator.onLine` (abrir DevTools)
- Checar `sync_queue` no banco de dados
- Testar manualmente: `syncEngine.syncPendingChanges()`

---

## 📚 Documentação Adicional

- **PRD.md** — Especificação completa do produto
- **ARCHITECTURE.md** — Detalhes técnicos da arquitetura
- **Prisma Docs** — https://www.prisma.io/docs/
- **Supabase Docs** — https://supabase.com/docs
- **Claude API** — https://claude.ai/docs

---

## 🤝 Contribuindo

1. Fork o repositório
2. Criar branch feature (`git checkout -b feature/xyz`)
3. Commit mudanças (`git commit -am 'Add xyz'`)
4. Push para branch (`git push origin feature/xyz`)
5. Criar Pull Request

---

## 📞 Suporte

- **Email:** suporte@farmduty.com.br
- **WhatsApp Copilot:** [link para adicionar]
- **Issues:** GitHub Issues
- **Comunidade:** Discord

---

**FarmDuty® · Desenvolvido para quem trabalha no campo. Feito junto com você.**
