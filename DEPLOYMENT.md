# 🚀 FarmDuty — Guia Completo de Deployment

**Full Stack Deployment: Frontend + Backend + Database**

---

## 📋 Pré-requisitos

- ✅ Conta GitHub
- ✅ Conta Vercel (free)
- ✅ Conta Railway (free trial)
- ✅ Conta Supabase (free)
- ✅ Domínio farmduty.com.br (registrado)
- ✅ Node.js 18+ instalado localmente

---

## 🎯 Checklist de Deployment

- [ ] **Passo 1:** Supabase Setup (Database)
- [ ] **Passo 2:** Backend Deploy (Railway)
- [ ] **Passo 3:** Frontend Deploy (Vercel)
- [ ] **Passo 4:** Configurar Domínio
- [ ] **Passo 5:** CI/CD Setup (GitHub Actions)
- [ ] **Passo 6:** Configurar WhatsApp Copilot
- [ ] **Passo 7:** Verificar Environment Variables
- [ ] **Passo 8:** Teste End-to-End

---

## ✅ PASSO 1: Supabase Setup (Database)

### 1.1 Criar Projeto

```bash
# 1. Ir para https://supabase.com
# 2. Clicar "New Project"
# 3. Preencher:
   - Project name: farmduty-prod
   - Database password: [Gerar senha forte 32+ chars]
   - Region: South America (São Paulo)
# 4. Aguardar 2-3 minutos
```

### 1.2 Executar Schema SQL

**No Supabase Dashboard:**
1. Ir a **SQL Editor**
2. Clicar **"New Query"**
3. Copiar TODO conteúdo de `supabase_schema.sql`
4. Colar e clicar **"Run"**

**Ou via CLI:**
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Criar arquivo .env na raiz:
echo "SUPABASE_ACCESS_TOKEN=your_token_here" > .env

# Link ao projeto
supabase link --project-ref YOUR_REF

# Executar migrations
supabase db push
```

### 1.3 Copiar Credenciais

No Supabase Dashboard → **Settings** → **API**:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Salvar em local seguro. **Nunca committar no Git!**

---

## ✅ PASSO 2: Backend Deploy (Railway)

### 2.1 Preparar Repositório

```bash
# 1. Instalar dependências locais
npm install

# 2. Gerar Prisma client
npm run prisma:generate

# 3. Testar localmente
npm run dev:server
# Deve estar rodando em http://localhost:3000/health
```

### 2.2 Criar Projeto Railway

1. Ir para https://railway.app
2. Clicar **"New Project"**
3. Selecionar **"Deploy from GitHub"**
4. Conectar sua conta GitHub
5. Selecionar repositório `farmduty`
6. Clicar **"Deploy"**

### 2.3 Configurar Environment Variables (Railway)

No dashboard Railway → **Project** → **Settings** → **Environment**:

Adicionar cada variável (NÃO copiar/colar tudo junto):

```
DATABASE_URL=postgresql://user:pass@host:5432/farmduty
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://farmduty.com.br
WHATSAPP_PROVIDER=evolution
EVOLUTION_INSTANCE_NAME=farmduty
EVOLUTION_API_TOKEN=your_token
EVOLUTION_API_URL=https://api.evolution.com
```

### 2.4 Deployar

Railway faz deploy automaticamente ao push no branch `main`:

```bash
# Fazer commit e push
git add .
git commit -m "chore: prepare deployment"
git push origin main

# Railway automaticamente:
# 1. Build
# 2. Run migrations (Procfile: release)
# 3. Start server
```

**Aguarde 5-10 minutos para conclusão**

Acessar: `https://your-railway-app.railway.app/health`

---

## ✅ PASSO 3: Frontend Deploy (Vercel)

### 3.1 Preparar Build

```bash
# 1. Testar build localmente
npm run build
npm run preview
# Deve estar rodando em http://localhost:4173

# 2. Se tudo OK, fazer push
git push origin main
```

### 3.2 Criar Projeto Vercel

1. Ir para https://vercel.com
2. Clicar **"New Project"**
3. **Import** seu repositório GitHub
4. Selecionar `projeto-sinho` como root
5. Clicar **"Deploy"**

### 3.3 Configurar Environment Variables (Vercel)

No Vercel → **Project Settings** → **Environment Variables**:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
```

### 3.4 Configurar Domínio (Vercel)

1. Vercel → **Project Settings** → **Domains**
2. Clicar **"Add Domain"**
3. Entrar `farmduty.com.br`
4. Vercel fornecerá nameservers (NS records)
5. Ir ao seu registrador de domínio (ex: Namecheap, GoDaddy)
6. Atualizar nameservers com os do Vercel

**Propagação do DNS: 24-48 horas**

---

## ✅ PASSO 4: Configurar Domínio

### 4.1 DNS Setup

Se não usou Vercel como registrador:

**Adicionar ao seu registrador:**
```
CNAME: www.farmduty.com.br → cname.vercel-dns.com
A:     farmduty.com.br     → 76.76.19.21
AAAA:  farmduty.com.br     → 2606:4700:4400::681b:1315
```

### 4.2 SSL Certificate

Vercel fornece automaticamente via Let's Encrypt.

**Verificar:** https://farmduty.com.br (deve ter HTTPS)

### 4.3 Configurar API Backend

**No Frontend (.env.production):**
```
VITE_API_URL=https://farmduty-api.railway.app
```

**No Vercel Environment Variables:**
```
VITE_API_URL=https://farmduty-api.railway.app
```

---

## ✅ PASSO 5: CI/CD Setup (GitHub Actions)

### 5.1 Adicionar Secrets ao GitHub

GitHub → **Settings** → **Secrets and variables** → **Actions**:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
RAILWAY_TOKEN=your_railway_token
```

### 5.2 Como Obter Tokens

**Vercel Token:**
```bash
vercel login
vercel tokens list
# Copiar token
```

**Railway Token:**
1. Railway → **Settings** → **Tokens**
2. Clicar **"Create New Token"**
3. Copiar

### 5.3 Testar Pipeline

```bash
# Fazer push para main (dispara workflow)
git push origin main

# Verificar em GitHub → Actions
```

Pipeline automaticamente:
- ✅ Roda testes
- ✅ Deploy frontend no Vercel
- ✅ Deploy backend no Railway
- ✅ Notifica sucesso

---

## ✅ PASSO 6: Configurar WhatsApp Copilot

### 6.1 Escolher Provider

Recomendado: **Evolution API** (open source, self-hosted friendly)

**Via Docker:**
```bash
docker run -d \
  -p 8080:8080 \
  -e SECRET_KEY=your_secret_key \
  --name evolution-api \
  docker.io/digisec/evolution-api:latest

# Acessar em http://localhost:8080
```

**Via Cloud (Hosted):**
1. Ir para https://evolution-api.com
2. Criar conta
3. Criar instância `farmduty`
4. Obter API Token

### 6.2 Configurar Webhook

Railway → **Environment**:
```
EVOLUTION_API_URL=https://your-evolution-instance.com
EVOLUTION_INSTANCE_NAME=farmduty
EVOLUTION_API_TOKEN=your_token
```

### 6.3 Validar Webhook

```bash
curl -X GET "https://farmduty-api.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=farmduty_verify_token_secure&hub.challenge=test123"

# Deve retornar: test123
```

---

## ✅ PASSO 7: Verificar Environment Variables

### Frontend (Vercel)

```bash
vercel env ls
# Deve listar: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ANTHROPIC_API_KEY
```

### Backend (Railway)

```bash
railway run env | grep -E "DATABASE_URL|SUPABASE_URL|NODE_ENV"
# Deve mostrar todas as variáveis críticas
```

---

## ✅ PASSO 8: Teste End-to-End

### 8.1 Testar Frontend

```bash
# Visitar https://farmduty.com.br
# Verificar:
✅ Banner "Modo Demonstração AgroGest"
✅ Header com logo FarmDuty
✅ Botão "Entrar / Conta"
✅ Dashboard carrega
✅ Cores carregam corretamente
```

### 8.2 Testar Backend

```bash
# Health check
curl https://farmduty-api.railway.app/health
# Deve retornar: { "status": "ok", "timestamp": "..." }

# Teste de transação
curl -X POST https://farmduty-api.railway.app/api/transactions \
  -H "x-organization-id: test-org" \
  -H "Content-Type: application/json" \
  -d '{"description":"Test","amount":100}'
```

### 8.3 Testar WhatsApp

1. Enviar mensagem para o número do bot
2. Verificar em Railway logs:
```bash
railway logs
# Deve mostrar: "Received message from +55..."
```

### 8.4 Testar Banco de Dados

```bash
# Acessar Supabase Dashboard
# Ir a SQL Editor
# Executar:
SELECT COUNT(*) FROM profiles;
# Deve retornar count
```

---

## 📊 Monitoramento & Logs

### Railway Logs

```bash
railway login
railway link (selecionar projeto)
railway logs
```

### Vercel Logs

```bash
vercel logs
```

### Supabase Logs

Dashboard → **Database** → **Logs**

---

## 🚨 Troubleshooting

### ❌ "Database connection refused"

```bash
# Verificar DATABASE_URL
railway run psql $DATABASE_URL

# Se falhar, resetar no Supabase → Settings → Password
```

### ❌ "Cannot find module '@prisma/client'"

```bash
npm install @prisma/client
npm run prisma:generate
git add . && git commit -m "fix: add prisma" && git push
```

### ❌ "CORS error from frontend"

Railway → **Environment**:
```
FRONTEND_URL=https://farmduty.com.br
```

Vercel → **Environment**:
```
VITE_API_URL=https://farmduty-api.railway.app
```

### ❌ "WhatsApp webhook not working"

```bash
# Verificar WHATSAPP_VERIFY_TOKEN
railway run curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Deve retornar: test
```

---

## ✨ Resumo de URLs

| Serviço | URL |
|---------|-----|
| **Frontend** | https://farmduty.com.br |
| **Backend Health** | https://farmduty-api.railway.app/health |
| **API** | https://farmduty-api.railway.app/api |
| **WhatsApp Webhook** | https://farmduty-api.railway.app/api/whatsapp/webhook |
| **Supabase Dashboard** | https://app.supabase.com |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Railway Dashboard** | https://railway.app |

---

## 🎉 Parabéns!

FarmDuty está em produção! 🚀

**Próximos passos:**
1. ✅ Monitorar logs diários
2. ✅ Configurar alertas (Sentry, DataDog)
3. ✅ Backup automático do banco
4. ✅ Rollout para usuários

---

**FarmDuty® — Agora em Produção**  
`version 1.0.0 · 2026-08-09`
