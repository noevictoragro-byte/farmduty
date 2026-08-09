import type { Router } from 'express'
import { Router as ExpressRouter } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  transcribeAudioWithWhisper,
  extractFromImage,
  getDataExtractionAgent,
  type ExtractedTransactionData
} from '@/services/ai'

const router = ExpressRouter()

/**
 * Interface para mensagem do WhatsApp
 */
interface WhatsAppMessage {
  from: string
  type: 'text' | 'audio' | 'image'
  text?: string
  media?: {
    url: string
    mimeType: string
  }
  timestamp: number
}

interface WhatsAppContext {
  organizationId?: string
  userId?: string
  phoneNumber: string
  conversationState: Map<string, any>
}

// Store para manter contexto de conversas (em produção, usar Redis/Database)
const conversationContexts = new Map<string, WhatsAppContext>()

/**
 * POST /whatsapp/webhook
 * Recebe webhooks do WhatsApp (via Evolution API, Z-API ou Twilio)
 */
router.post('/webhook', async (req, res) => {
  try {
    const message = req.body as WhatsAppMessage

    if (!message.from) {
      return res.status(400).json({ error: 'Missing phone number' })
    }

    let context = conversationContexts.get(message.from)
    if (!context) {
      context = {
        phoneNumber: message.from,
        conversationState: new Map(),
      }
      conversationContexts.set(message.from, context)
    }

    let response: any

    if (message.type === 'text' && message.text) {
      response = await handleTextMessage(message.text, context)
    } else if (message.type === 'audio' && message.media) {
      response = await handleAudioMessage(message.media.url, context)
    } else if (message.type === 'image' && message.media) {
      response = await handleImageMessage(message.media.url, context)
    } else {
      response = {
        success: false,
        message: 'Tipo de mensagem não suportado. Envie áudio, foto ou texto.',
      }
    }

    // Enviar resposta para WhatsApp
    await sendWhatsAppMessage(message.from, response)

    res.json({ success: true })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    res.status(500).json({ error: String(error) })
  }
})

/**
 * GET /whatsapp/webhook
 * Validação de webhook do WhatsApp (para confirmação inicial)
 */
router.get('/webhook', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'farmduty_verify_token'
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === verifyToken) {
    res.status(200).send(challenge)
  } else {
    res.status(403).send('Forbidden')
  }
})

/**
 * Processa mensagem de texto
 */
async function handleTextMessage(text: string, context: WhatsAppContext) {
  const agent = getDataExtractionAgent()

  // Limpa histórico se for comando especial
  if (text.toLowerCase() === 'novo') {
    agent.resetConversation()
    return {
      success: true,
      message: '✅ Conversa resetada. Envie uma novo registro comercial (texto, áudio ou foto).',
    }
  }

  try {
    const extracted = await agent.extractTransaction(text)
    const confirmationMessage = formatConfirmationMessage(extracted)

    // Armazena dados temporários para confirmação
    context.conversationState.set('pendingTransaction', extracted)

    return {
      success: true,
      message: confirmationMessage,
      data: extracted,
      buttons: [
        { text: '✅ Confirmar', id: 'confirm' },
        { text: '✏️ Editar', id: 'edit' },
        { text: '❌ Cancelar', id: 'cancel' },
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Desculpe, não consegui entender. Tente novamente ou envie uma foto/áudio.`,
      error: String(error),
    }
  }
}

/**
 * Processa mensagem de áudio
 */
async function handleAudioMessage(audioUrl: string, context: WhatsAppContext) {
  try {
    // Baixa o áudio e transcreve
    const audioBuffer = await downloadFile(audioUrl)
    const transcription = await transcribeAudioWithWhisper(audioBuffer, 'audio.m4a')

    // Processa transcrição como se fosse texto
    return handleTextMessage(transcription.text, context)
  } catch (error) {
    return {
      success: false,
      message: 'Desculpe, não consegui processar o áudio. Tente novamente ou envie texto/foto.',
      error: String(error),
    }
  }
}

/**
 * Processa mensagem com imagem (nota fiscal, boleto, rótulo)
 */
async function handleImageMessage(imageUrl: string, context: WhatsAppContext) {
  try {
    const extracted = await extractFromImage(imageUrl, 'auto')

    const agent = getDataExtractionAgent()

    // Construir mensagem para o agente com dados da imagem
    const contextMessage = `Baseado na imagem analisada, encontrei estes dados:
- Tipo de documento: ${extracted.documentType}
- Fornecedor: ${extracted.supplier || 'Não identificado'}
- Itens: ${JSON.stringify(extracted.items)}
- Data: ${extracted.issueDate}
- Vencimento: ${extracted.dueDate || 'Não identificado'}

Estes dados estão corretos? Se não, descreva o que precisa ser ajustado.`

    const transaction = await agent.extractTransaction(contextMessage)
    const confirmationMessage = formatConfirmationMessage(transaction)

    context.conversationState.set('pendingTransaction', transaction)

    return {
      success: true,
      message: confirmationMessage,
      data: transaction,
      buttons: [
        { text: '✅ Confirmar', id: 'confirm' },
        { text: '✏️ Editar', id: 'edit' },
        { text: '❌ Cancelar', id: 'cancel' },
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: 'Desculpe, não consegui ler a imagem. Tente outra foto mais clara ou envie texto.',
      error: String(error),
    }
  }
}

/**
 * Formata mensagem de confirmação para o usuário
 */
function formatConfirmationMessage(data: ExtractedTransactionData): string {
  return `📋 *Registrando Transação*

📦 *Produto:* ${data.item}
📊 *Quantidade:* ${data.quantity} ${data.unit}
💰 *Valor Unit.:* R$ ${data.unitPrice.toFixed(2)}
💵 *Total:* R$ ${data.totalPrice.toFixed(2)}

🏢 *Fornecedor:* ${data.supplier || 'Não informado'}
📁 *Categoria:* ${data.category}
🏠 *Carteira:* ${data.wallet === 'FARM' ? '🌾 Fazenda' : '👤 Pessoal'}
📅 *Data:* ${data.issueDate}
${data.dueDate ? `📆 *Vencimento:* ${data.dueDate}` : ''}

✨ *Confiança:* ${(data.confidenceScore * 100).toFixed(0)}%

Está correto?`
}

/**
 * Envia mensagem para WhatsApp (interface genérica)
 * Implementação depende do provider (Evolution API, Z-API, Twilio)
 */
async function sendWhatsAppMessage(phoneNumber: string, payload: any): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'evolution' // evolution | zapi | twilio

  try {
    if (provider === 'evolution') {
      await sendViaEvolutionAPI(phoneNumber, payload)
    } else if (provider === 'zapi') {
      await sendViaZAPI(phoneNumber, payload)
    } else if (provider === 'twilio') {
      await sendViaTwilio(phoneNumber, payload)
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
  }
}

/**
 * Envia via Evolution API
 * https://evolution-api.gitbook.io
 */
async function sendViaEvolutionAPI(
  phoneNumber: string,
  payload: any
): Promise<void> {
  const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'farmduty'
  const evolutionToken = process.env.EVOLUTION_API_TOKEN
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://evolution.api'

  const response = await fetch(
    `${evolutionUrl}/message/sendText/${evolutionInstance}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${evolutionToken}`,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: payload.message || 'Mensagem do FarmDuty Copilot',
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Evolution API error: ${response.statusText}`)
  }
}

/**
 * Envia via Z-API
 * https://www.z-api.io
 */
async function sendViaZAPI(phoneNumber: string, payload: any): Promise<void> {
  const zapiToken = process.env.ZAPI_TOKEN
  const zapiUrl = 'https://api.z-api.io/instances'

  const response = await fetch(`${zapiUrl}/message/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zapiToken}`,
    },
    body: JSON.stringify({
      phone: phoneNumber,
      message: payload.message || 'Mensagem do FarmDuty Copilot',
    }),
  })

  if (!response.ok) {
    throw new Error(`Z-API error: ${response.statusText}`)
  }
}

/**
 * Envia via Twilio
 * https://www.twilio.com
 */
async function sendViaTwilio(phoneNumber: string, payload: any): Promise<void> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${twilioAccountSid}:${twilioAuthToken}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        From: `whatsapp:${twilioPhoneNumber}`,
        To: `whatsapp:${phoneNumber}`,
        Body: payload.message || 'Mensagem do FarmDuty Copilot',
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Twilio error: ${response.statusText}`)
  }
}

/**
 * Baixa arquivo de URL
 */
async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Limpa contextos antigos (cron job em produção)
 */
function cleanupOldContexts(): void {
  const maxAge = 24 * 60 * 60 * 1000 // 24 horas
  const now = Date.now()

  for (const [key, context] of conversationContexts.entries()) {
    // Implementar lógica de limpeza aqui
  }
}

// Limpar contextos a cada hora
setInterval(cleanupOldContexts, 60 * 60 * 1000)

export default router
