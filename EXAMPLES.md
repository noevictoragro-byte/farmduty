# FarmDuty — Exemplos de Uso

**Guia prático com exemplos reais de como usar FarmDuty via API e integrações**

---

## 📱 Exemplo 1: Entrada de Dados via Texto

### Usuário digita no app:
```
"Comprei 100L de diesel na semana passada por R$ 600, vencimento 15/09"
```

### Fluxo no código:

```typescript
import { getDataExtractionAgent } from '@/services/ai'

const agent = getDataExtractionAgent()

const extractedData = await agent.extractTransaction(
  "Comprei 100L de diesel na semana passada por R$ 600, vencimento 15/09"
)

console.log(extractedData)
// Resultado:
{
  item: "Diesel",
  quantity: 100,
  unit: "L",
  unitPrice: 6.00,
  totalPrice: 600.00,
  supplier: null,
  category: "FUEL",
  wallet: "FARM",
  transactionType: "EXPENSE",
  issueDate: "2026-08-09",
  dueDate: "2026-09-15",
  paymentStatus: "PENDING",
  confidenceScore: 0.94,
  extractionNotes: "Extração bem-sucedida"
}
```

### Salvar no banco:

```typescript
// 1. Criar transação no Supabase
const { data, error } = await supabase
  .from('financial_transactions')
  .insert({
    organization_id: user.organizationId,
    wallet_id: walletFarm.id,
    type: 'EXPENSE',
    status: 'PENDING',
    category: 'FUEL',
    description: 'Diesel',
    amount: 600.00,
    transaction_date: new Date('2026-08-09'),
    due_date: new Date('2026-09-15'),
    operational_record_id: null // Não foi via IA neste caso
  })

// 2. Ou salvar offline + enfileirar sincronização
await syncEngine.queueChange(
  user.organizationId,
  user.id,
  'financial_transactions',
  'INSERT',
  crypto.randomUUID(),
  extractedData
)
```

---

## 🎙️ Exemplo 2: Entrada via Áudio (WhatsApp)

### Usuário grava áudio no WhatsApp:
```
"Opa, comprei milho de sementes com o Seu João por 
três mil reais, tá saindo na próxima segunda"
```

### Fluxo no webhook:

```typescript
// /src/routes/whatsapp.ts
async function handleAudioMessage(audioUrl: string, context: WhatsAppContext) {
  try {
    // 1. Baixar áudio
    const audioBuffer = await downloadFile(audioUrl)
    
    // 2. Transcrever com Whisper
    const transcription = await transcribeAudioWithWhisper(audioBuffer, 'audio.m4a')
    console.log("Transcrição:", transcription.text)
    // "Opa, comprei milho de sementes com o Seu João por três mil reais..."
    
    // 3. Processar transcrição com IA
    const agent = getDataExtractionAgent()
    const extracted = await agent.extractTransaction(transcription.text)
    
    console.log(extracted)
    // Resultado:
    // {
    //   item: "Milho de Sementes",
    //   quantity: 1,
    //   unit: "lote",
    //   unitPrice: 3000,
    //   totalPrice: 3000,
    //   supplier: "Seu João",
    //   category: "SEEDS",
    //   wallet: "FARM",
    //   transactionType: "EXPENSE",
    //   issueDate: "2026-08-09",
    //   dueDate: "2026-08-12",
    //   confidenceScore: 0.87
    // }
    
    // 4. Enviar confirmação para WhatsApp
    const confirmationMsg = formatConfirmationMessage(extracted)
    await sendWhatsAppMessage(context.phoneNumber, {
      message: confirmationMsg,
      buttons: [
        { text: '✅ Confirmar', id: 'confirm' },
        { text: '✏️ Editar', id: 'edit' },
        { text: '❌ Cancelar', id: 'cancel' }
      ]
    })
    
  } catch (error) {
    await sendWhatsAppMessage(context.phoneNumber, {
      message: "Desculpe, não consegui processar o áudio. Tente novamente."
    })
  }
}
```

---

## 📸 Exemplo 3: Entrada via Foto (Nota Fiscal)

### Usuário fotografa nota fiscal no WhatsApp

**Foto contém:**
```
NOTA FISCAL ELETRÔNICA
Empresa XYZ Ltda
CNPJ: 12.345.678/0001-90

Descrição: Fertilizante NPK 4-14-8
Quantidade: 25 sacos
Valor Unit.: R$ 85,00
Total: R$ 2.125,00

Data Emissão: 08/08/2026
Vencimento: 07/09/2026
```

### Fluxo no webhook:

```typescript
async function handleImageMessage(imageUrl: string, context: WhatsAppContext) {
  try {
    // 1. Extrair dados com Vision
    const ocrData = await extractFromImage(imageUrl, 'invoice')
    console.log("OCR Result:", ocrData)
    // {
    //   text: "NOTA FISCAL...",
    //   items: [{
    //     name: "Fertilizante NPK 4-14-8",
    //     quantity: 25,
    //     unit: "sacos",
    //     unitPrice: 85.00,
    //     totalPrice: 2125.00
    //   }],
    //   supplier: "Empresa XYZ Ltda",
    //   issueDate: "2026-08-08",
    //   dueDate: "2026-09-07",
    //   documentType: "invoice"
    // }
    
    // 2. Processar com agente IA para classificação
    const agent = getDataExtractionAgent()
    const contextMsg = `
      Baseado nesta nota fiscal:
      - Produto: ${ocrData.items[0].name}
      - Qtd: ${ocrData.items[0].quantity} ${ocrData.items[0].unit}
      - Total: R$ ${ocrData.items[0].totalPrice}
      - Fornecedor: ${ocrData.supplier}
      - Vencimento: ${ocrData.dueDate}
      
      Confirma estes dados?
    `
    
    const extracted = await agent.extractTransaction(contextMsg)
    console.log(extracted)
    // {
    //   item: "Fertilizante NPK 4-14-8",
    //   quantity: 25,
    //   unit: "sacos",
    //   unitPrice: 85.00,
    //   totalPrice: 2125.00,
    //   supplier: "Empresa XYZ Ltda",
    //   category: "FERTILIZERS",
    //   wallet: "FARM",
    //   transactionType: "EXPENSE",
    //   issueDate: "2026-08-08",
    //   dueDate: "2026-09-07",
    //   confidenceScore: 0.98
    // }
    
    // 3. Criar OperationalRecord com metadata
    const { data: opRecord } = await supabase
      .from('operational_records')
      .insert({
        organization_id: orgId,
        type: 'EXPENSE',
        source: 'WHATSAPP_IMAGE',
        image_url: imageUrl,
        raw_input: ocrData.text,
        extracted_data: extracted,
        confidence_score: 0.98,
        is_processed: true
      })
    
    // 4. Salvar transação vinculada ao registro IA
    await supabase
      .from('financial_transactions')
      .insert({
        organization_id: orgId,
        operational_record_id: opRecord.id,
        ...extracted
      })
    
    // 5. Enviar confirmação
    await sendWhatsAppMessage(context.phoneNumber, {
      message: `✅ Transação registrada!\n\n${ocrData.items[0].name}\nR$ ${ocrData.items[0].totalPrice.toFixed(2)}\nVencimento: ${ocrData.dueDate}`
    })
    
  } catch (error) {
    console.error(error)
  }
}
```

---

## 💾 Exemplo 4: Sincronização Offline

### Cenário: Produtor está no campo sem internet

```typescript
// 1. Criar transação offline
const transactionData = {
  item: "Capinagem manual - Talhão A",
  quantity: 4,
  unit: "hora",
  unitPrice: 50,
  totalPrice: 200,
  category: "LABOR",
  wallet: "FARM"
}

// 2. Salvar em IndexedDB
await db.financial_transactions.add({
  id: crypto.randomUUID(),
  tenant_id: user.organizationId,
  ...transactionData
})

// 3. Enfileirar para sincronização
await syncEngine.queueChange(
  user.organizationId,
  user.id,
  'financial_transactions',
  'INSERT',
  id,
  transactionData
)

// 4. UI mostra indicador "Salvo Offline" (Cinza)
// Na barra de status do app

// 5. Quando volta online
// syncEngine detecta automáticamente (listener on 'online')
// Envia para Supabase
// Recebe confirmação
// UI muda para "Sincronizado" (Verde)
```

### No código:

```typescript
import { syncEngine } from '@/lib/syncEngine'

// Listener para mudança de status
syncEngine.onSyncStatusChange((status) => {
  if (status === 'syncing') {
    console.log('🔄 Sincronizando mudanças...')
  } else if (status === 'idle') {
    console.log('✅ Sincronizado')
  } else if (status === 'offline') {
    console.log('💾 Salvo offline')
  }
})

// Auto-sincronizar a cada 30 segundos
syncEngine.startAutoSync(30)
```

---

## 🏪 Exemplo 5: Criar Parceiro (Fornecedor)

### Via API:

```typescript
// POST /api/partners
const newPartner = {
  organization_id: "org_123",
  name: "Agroindústria Central",
  type: "SUPPLIER",
  email: "contato@agroindustria.com.br",
  phone: "+5511999999999",
  address: "Rua das Fazendas, 456",
  city: "Ribeirão Preto",
  state: "SP",
  document_number: "12.345.678/0001-90",
  notes: "Fornecedor de fertilizantes desde 2020"
}

const { data, error } = await supabase
  .from('partners')
  .insert(newPartner)
  .select()

console.log(data)
// { id: "partner_456", name: "Agroindústria Central", ... }
```

### Via FarmDuty Copilot:

**Usuário manda mensagem:**
```
"Cadastra novo fornecedor: Agro Semente, email: contato@agrosemente.com"
```

**IA identifica:** Comando de cadastro → Extrai nome e email → Cria parceiro

---

## 📊 Exemplo 6: Gerar Relatório Financeiro

### Com filtros:

```typescript
// Relatório da Carteira Fazenda - Agosto 2026

const { data: transactions } = await supabase
  .from('financial_transactions')
  .select('*')
  .eq('organization_id', orgId)
  .eq('wallet_id', walletFarm.id)
  .gte('transaction_date', '2026-08-01')
  .lte('transaction_date', '2026-08-31')

// Agrupar por categoria
const grouped = groupBy(transactions, 'category')

// Calcular totais
const summary = {
  totalReceita: sum(transactions.filter(t => t.type === 'INCOME').map(t => t.amount)),
  totalDespesa: sum(transactions.filter(t => t.type === 'EXPENSE').map(t => t.amount)),
  lucroLiquido: totalReceita - totalDespesa,
  porCategoria: Object.entries(grouped).map(([cat, txs]) => ({
    categoria: cat,
    total: sum(txs.map(t => t.amount))
  }))
}

console.log(summary)
// {
//   totalReceita: 15000,
//   totalDespesa: 5430,
//   lucroLiquido: 9570,
//   porCategoria: [
//     { categoria: "FERTILIZERS", total: 2125 },
//     { categoria: "FUEL", total: 600 },
//     { categoria: "LABOR", total: 1705 },
//     ...
//   ]
// }
```

---

## 🔍 Exemplo 7: Histórico de Cotações

### Buscar preços passados:

```typescript
// Quais foram os preços de fertilizante nos últimos 3 meses?

const { data: quotes } = await supabase
  .from('quotes')
  .select(`
    *,
    partner:partners(name),
    operational_record:operational_records(created_at)
  `)
  .eq('organization_id', orgId)
  .ilike('product_name', '%fertilizante%')
  .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
  .order('created_at', { ascending: false })

console.log(quotes)
// [
//   {
//     productName: "Fertilizante NPK 4-14-8",
//     partnerName: "Empresa XYZ",
//     quantity: 25,
//     pricePerUnit: 85.00,
//     totalPrice: 2125.00,
//     createdAt: "2026-09-08"
//   },
//   {
//     productName: "Fertilizante NPK 4-14-8",
//     partnerName: "Agroindústria Central",
//     quantity: 30,
//     pricePerUnit: 80.00,
//     totalPrice: 2400.00,
//     createdAt: "2026-08-20"
//   }
// ]

// IA pode sugerir: "Você pode economizar 15% comprando da Agroindústria Central"
```

---

## 🚨 Exemplo 8: Alertas de Vencimento

### Dashboard mostra automaticamente:

```typescript
const today = new Date()
const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

// Contas a vencer em 7 dias
const { data: upcoming } = await supabase
  .from('financial_transactions')
  .select(`
    *,
    partner:partners(name)
  `)
  .eq('organization_id', orgId)
  .eq('status', 'PENDING')
  .gte('due_date', today.toISOString())
  .lte('due_date', sevenDaysLater.toISOString())
  .order('due_date', { ascending: true })

// Renderizar componente de alerta
<div className="bg-yellow-50 p-4 rounded">
  <h3>⚠️ Contas a Vencer (7 dias)</h3>
  {upcoming.map(tx => (
    <div key={tx.id}>
      <p>{tx.partner?.name} - R$ {tx.amount}</p>
      <p className="text-sm text-muted">Vence: {tx.due_date}</p>
    </div>
  ))}
</div>
```

---

## 🎨 Exemplo 9: White-Label Customização

### Admin customiza marca:

```typescript
// PATCH /api/organizations/org_123
const update = {
  appName: "Sistema Fazenda XYZ",
  customLogoUrl: "https://cdn.fazendaxyz.com/logo.png",
  primaryColor: "#ff6b35"
}

const { data: updated } = await supabase
  .from('organizations')
  .update(update)
  .eq('id', 'org_123')

// Próxima vez que usuário abre app:
// Header mostra logo customizado
// Botões ficam com cor #ff6b35
// Footer mantém "Powered by FarmDuty®" (obrigatório)
```

---

## ✅ Resumo de Fluxos

| Entrada | Serviço | Output | Tempo |
|---------|---------|--------|-------|
| Texto | dataExtractionAgent | JSON estruturado | < 2s |
| Áudio | Whisper + Agent | JSON estruturado | < 5s |
| Imagem | Claude Vision + Agent | JSON estruturado | < 3s |
| Comando | Agent + contextual | Ação (criar, atualizar) | < 5s |

---

**FarmDuty® — Exemplos práticos para integração rápida.**
