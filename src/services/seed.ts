import { db } from './db'
import type { Propriedade, Talhao, Transacao, Veiculo } from '@/types'

export async function seedDatabase(): Promise<void> {
  const jaSemeado = await db.propriedades.count()
  if (jaSemeado > 0) return

  const veiculo: Veiculo = {
    id: crypto.randomUUID(),
    placa: 'SIN-1H23',
    modelo: 'Mercedes-Benz Atego 2426',
    tipo: 'CAMINHAO',
    kmAtual: 152340,
  }

  const propriedade: Propriedade = {
    id: crypto.randomUUID(),
    nome: 'Fazenda do Sinho',
    areaHectares: 85,
    localizacao: 'Bebedouro, SP',
    tiposAtividade: ['CITRICULTURA'],
  }

  const talhao: Talhao = {
    id: crypto.randomUUID(),
    propriedadeId: propriedade.id,
    nome: 'Talhão 01',
    cultura: 'Laranja',
    areaHectares: 12,
  }

  const transacaoPessoal: Transacao = {
    id: crypto.randomUUID(),
    data: new Date().toISOString(),
    tipo: 'SAIDA',
    escopo: 'PESSOAL',
    centroCusto: 'CASA_FAMILIA',
    valor: 450,
    descricao: 'Compras do mês - mercado',
    categoria: 'Alimentação',
    statusPagamento: 'PAGO',
  }

  const transacaoProfissional: Transacao = {
    id: crypto.randomUUID(),
    data: new Date().toISOString(),
    tipo: 'ENTRADA',
    escopo: 'PROFISSIONAL',
    centroCusto: 'CITRICULTURA',
    valor: 18500,
    descricao: 'Venda de laranja - safra 2026',
    categoria: 'Venda de produção',
    statusPagamento: 'PENDENTE',
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }

  await db.transaction(
    'rw',
    [db.veiculos, db.propriedades, db.talhoes, db.transacoes],
    async () => {
      await db.veiculos.add(veiculo)
      await db.propriedades.add(propriedade)
      await db.talhoes.add(talhao)
      await db.transacoes.bulkAdd([transacaoPessoal, transacaoProfissional])
    },
  )
}
