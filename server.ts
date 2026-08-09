import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import whatsappRouter from './src/routes/whatsapp'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/whatsapp', whatsappRouter)

// CRUD: Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'] as string
    if (!orgId) return res.status(401).json({ error: 'Missing organization ID' })

    const transactions = await prisma.financialTransaction.findMany({
      where: { organization_id: orgId },
      include: { partner: true },
      orderBy: { transaction_date: 'desc' }
    })

    res.json(transactions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

app.post('/api/transactions', async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'] as string
    if (!orgId) return res.status(401).json({ error: 'Missing organization ID' })

    const transaction = await prisma.financialTransaction.create({
      data: {
        ...req.body,
        organization_id: orgId
      },
      include: { partner: true }
    })

    res.json(transaction)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await prisma.financialTransaction.update({
      where: { id: req.params.id },
      data: req.body,
      include: { partner: true }
    })

    res.json(transaction)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await prisma.financialTransaction.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

// CRUD: Organizations (Branding)
app.get('/api/organizations/:id', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id }
    })

    if (!org) return res.status(404).json({ error: 'Organization not found' })

    res.json(org)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

app.put('/api/organizations/:id', async (req, res) => {
  try {
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        customLogoUrl: req.body.customLogoUrl,
        primaryColor: req.body.primaryColor,
        appName: req.body.appName
      }
    })

    res.json(org)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

// CRUD: Sync Queue
app.get('/api/sync/status', async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'] as string
    if (!orgId) return res.status(401).json({ error: 'Missing organization ID' })

    const pending = await prisma.syncQueue.count({
      where: { organization_id: orgId, is_synced: false }
    })

    res.json({ pending, synced: pending === 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

app.post('/api/sync/push', async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'] as string
    if (!orgId) return res.status(401).json({ error: 'Missing organization ID' })

    const changes = await prisma.syncQueue.findMany({
      where: { organization_id: orgId, is_synced: false }
    })

    for (const change of changes) {
      await prisma.syncQueue.update({
        where: { id: change.id },
        data: { is_synced: true, synced_at: new Date() }
      })
    }

    res.json({ synced: changes.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error) })
  }
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 FarmDuty Backend rodando em http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. Desligando gracefully...')
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
})

export default app
