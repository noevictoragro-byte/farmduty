import type {
  CentroCusto,
  EscopoFinanceiro,
  TipoAtividadeAgricola,
  TipoAtividadePropriedade,
  TipoContrato,
  TipoPagamentoAdicional,
  TipoVeiculo,
} from '@/types'

export type TipoLancamento = 'COLHEITA' | 'FRETE' | 'ABASTECIMENTO' | 'GERAL'

export const CENTRO_CUSTO_LABELS: Record<CentroCusto, string> = {
  CITRICULTURA: 'Citricultura',
  BOVINOCULTURA: 'Bovinocultura',
  PRODUCAO_GRAOS: 'Produção de Grãos',
  FROTA_TRANSPORTE: 'Frota / Transporte',
  FOLHA_PAGAMENTO: 'Folha de Pagamento',
  OUTRAS_ATIVIDADES_AGRICOLAS: 'Outras Atividades Agrícolas',
  CASA_FAMILIA: 'Casa / Família',
  RETIRADA_PROLABORE: 'Retirada / Pró-labore',
}

export const ESCOPO_LABELS: Record<EscopoFinanceiro, string> = {
  PROFISSIONAL: 'Profissional',
  PESSOAL: 'Pessoal',
}

export const TIPO_VEICULO_LABELS: Record<TipoVeiculo, string> = {
  CAMINHAO: 'Caminhão',
  TRATOR: 'Trator',
  UTILITARIO: 'Utilitário',
}

export const TIPO_ATIVIDADE_LABELS: Record<TipoAtividadeAgricola, string> = {
  PREPARO_SOLO: 'Preparo de Solo',
  PLANTIO: 'Plantio',
  MANEJO: 'Manejo',
  COLHEITA: 'Colheita',
}

export const TIPO_ATIVIDADE_PROPRIEDADE_LABELS: Record<TipoAtividadePropriedade, string> = {
  CITRICULTURA: 'Citricultura',
  BOVINOCULTURA: 'Bovinocultura',
  PRODUCAO_GRAOS: 'Produção de Grãos',
  OUTRAS: 'Outras',
}

export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  DIARISTA: 'Diarista',
  MENSALISTA: 'Mensalista',
  PRESTADOR: 'Prestador de Serviço',
}

export const TIPO_PAGAMENTO_ADICIONAL_LABELS: Record<TipoPagamentoAdicional, string> = {
  DECIMO_TERCEIRO: 'Décimo Terceiro',
  COMISSAO: 'Comissão',
  FERIAS: 'Férias',
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarData(dataIso: string): string {
  return new Date(dataIso).toLocaleDateString('pt-BR')
}

export function estaNoMesAtual(dataIso: string): boolean {
  const data = new Date(dataIso)
  const agora = new Date()
  return data.getFullYear() === agora.getFullYear() && data.getMonth() === agora.getMonth()
}

export function estaNoMesAnterior(dataIso: string): boolean {
  const data = new Date(dataIso)
  const agora = new Date()
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
  return (
    data.getFullYear() === mesAnterior.getFullYear() && data.getMonth() === mesAnterior.getMonth()
  )
}

export function estaNoAnoAtual(dataIso: string): boolean {
  return new Date(dataIso).getFullYear() === new Date().getFullYear()
}

export type PeriodoRelatorio = 'MES_ATUAL' | 'MES_ANTERIOR' | 'ANO_ATUAL' | 'TODOS'

export const PERIODO_LABELS: Record<PeriodoRelatorio, string> = {
  MES_ATUAL: 'Mês Atual',
  MES_ANTERIOR: 'Mês Anterior',
  ANO_ATUAL: 'Ano Atual',
  TODOS: 'Todo o Período',
}

export function estaNoPeriodo(dataIso: string, periodo: PeriodoRelatorio): boolean {
  switch (periodo) {
    case 'MES_ATUAL':
      return estaNoMesAtual(dataIso)
    case 'MES_ANTERIOR':
      return estaNoMesAnterior(dataIso)
    case 'ANO_ATUAL':
      return estaNoAnoAtual(dataIso)
    case 'TODOS':
      return true
  }
}

export type FiltroCategoriaRelatorio =
  | 'TODOS'
  | 'CITRICULTURA'
  | 'BOVINOCULTURA'
  | 'GRAOS'
  | 'FROTA'
  | 'FOLHA'
  | 'PESSOAL'

export const FILTRO_CATEGORIA_LABELS: Record<FiltroCategoriaRelatorio, string> = {
  TODOS: 'Todos',
  CITRICULTURA: 'Citricultura',
  BOVINOCULTURA: 'Bovinocultura',
  GRAOS: 'Grãos',
  FROTA: 'Frota',
  FOLHA: 'Folha de Pagamento',
  PESSOAL: 'Pessoal',
}
