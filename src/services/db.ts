import Dexie, { type Table, type Transaction } from 'dexie'
import type {
  AtividadeAgricola,
  Funcionario,
  ItemEstoque,
  ManutencaoVeiculo,
  PagamentoAdicional,
  PeriodoFerias,
  Propriedade,
  Talhao,
  Transacao,
  Veiculo,
  ViagemFrete,
} from '@/types'
import type { SyncQueueItem } from '@/lib/syncEngine'

export class ProjetoSinhoDB extends Dexie {
  transacoes!: Table<Transacao, string>
  propriedades!: Table<Propriedade & { tenant_id?: string }, string>
  talhoes!: Table<Talhao, string>
  atividadesAgricolas!: Table<AtividadeAgricola, string>
  veiculos!: Table<Veiculo, string>
  viagensFrete!: Table<ViagemFrete, string>
  manutencoesVeiculo!: Table<ManutencaoVeiculo, string>
  funcionarios!: Table<Funcionario, string>
  itensEstoque!: Table<ItemEstoque, string>
  periodosFerias!: Table<PeriodoFerias, string>
  pagamentosAdicionais!: Table<PagamentoAdicional, string>

  // Tabelas operacionais multi-tenant
  frota!: Table<any, string>
  parceiros!: Table<any, string>
  colheitas_fretes!: Table<any, string>
  transacoes_financeiras!: Table<any, string>
  colaboradores_diarias!: Table<any, string>

  // Fila de sincronização
  sync_queue!: Table<SyncQueueItem, string>

  constructor() {
    super('ProjetoSinhoDB')

    this.version(1).stores({
      transacoes: 'id, data, tipo, escopo, centroCusto, statusPagamento',
      propriedades: 'id, nome',
      talhoes: 'id, propriedadeId, cultura',
      atividadesAgricolas: 'id, talhaoId, tipoAtividade, data',
      veiculos: 'id, placa, tipo',
      viagensFrete: 'id, veiculoId, data',
      manutencoesVeiculo: 'id, veiculoId, data',
      funcionarios: 'id, nome, tipoContrato',
      itensEstoque: 'id, nome, categoria',
    })

    this.version(2)
      .stores({
        funcionarios: 'id, nome, tipoContrato, propriedadeId, ativo',
        periodosFerias: 'id, funcionarioId, dataInicio',
        pagamentosAdicionais: 'id, funcionarioId, tipo, data',
      })
      .upgrade(backfillCamposNovos)

    this.version(3).stores({}).upgrade(backfillCamposNovos)

    this.version(4)
      .stores({
        frota: 'id, tenant_id, tipo',
        parceiros: 'id, tenant_id, nome',
        colheitas_fretes: 'id, tenant_id, propriedade_id, data_colheita',
        transacoes_financeiras: 'id, tenant_id, data_transacao, tipo',
        colaboradores_diarias: 'id, tenant_id, data_diaria',
        sync_queue: 'id, tenant_id, synced, timestamp',
      })

    this.version(5)
      .stores({
        veiculos: 'id, placa, tipo, formaAquisicao, possuiFinanciamento',
      })
  }
}

async function backfillCamposNovos(tx: Transaction): Promise<void> {
  await tx
    .table('propriedades')
    .toCollection()
    .modify((propriedade) => {
      if (!Array.isArray(propriedade.tiposAtividade)) {
        propriedade.tiposAtividade = ['OUTRAS']
      }
    })
  await tx
    .table('funcionarios')
    .toCollection()
    .modify((funcionario) => {
      if (typeof funcionario.ativo !== 'boolean') {
        funcionario.ativo = true
      }
    })
}

export const db = new ProjetoSinhoDB()
