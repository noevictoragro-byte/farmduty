export type EscopoFinanceiro = 'PROFISSIONAL' | 'PESSOAL'

export type CentroCusto =
  | 'CITRICULTURA'
  | 'BOVINOCULTURA'
  | 'PRODUCAO_GRAOS'
  | 'FROTA_TRANSPORTE'
  | 'FOLHA_PAGAMENTO'
  | 'OUTRAS_ATIVIDADES_AGRICOLAS'
  | 'CASA_FAMILIA'
  | 'RETIRADA_PROLABORE'

export type TipoTransacao = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA'

export type StatusPagamento = 'PAGO' | 'PENDENTE'

export interface Transacao {
  id: string
  data: string
  tipo: TipoTransacao
  escopo: EscopoFinanceiro
  centroCusto: CentroCusto
  valor: number
  descricao: string
  categoria: string
  statusPagamento: StatusPagamento
  dataVencimento?: string
  comprovanteUrl?: string
}
