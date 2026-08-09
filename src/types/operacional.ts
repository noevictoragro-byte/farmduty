export type TipoAtividadePropriedade =
  | 'CITRICULTURA'
  | 'BOVINOCULTURA'
  | 'PRODUCAO_GRAOS'
  | 'OUTRAS'

export interface Propriedade {
  id: string
  nome: string
  areaHectares: number
  localizacao: string
  tiposAtividade: TipoAtividadePropriedade[]
}

export interface Talhao {
  id: string
  propriedadeId: string
  nome: string
  cultura: string
  areaHectares: number
}

export type TipoAtividadeAgricola = 'PREPARO_SOLO' | 'PLANTIO' | 'MANEJO' | 'COLHEITA'

export interface AtividadeAgricola {
  id: string
  talhaoId: string
  tipoAtividade: TipoAtividadeAgricola
  data: string
  insumosUtilizados: string[]
  observacoes?: string
}

export type TipoVeiculo = 'CAMINHAO' | 'TRATOR' | 'UTILITARIO'

export interface Veiculo {
  id: string
  placa: string
  modelo: string
  tipo: TipoVeiculo
  kmAtual: number
}

export interface ViagemFrete {
  id: string
  veiculoId: string
  cliente: string
  origem: string
  destino: string
  valorFrete: number
  kmInicial: number
  kmFinal: number
  data: string
}

export interface ManutencaoVeiculo {
  id: string
  veiculoId: string
  descricao: string
  custo: number
  kmRealizado: number
  kmProximaManutencao?: number
  litros?: number
  data: string
}

export type TipoContrato = 'DIARISTA' | 'MENSALISTA' | 'PRESTADOR'

export interface Funcionario {
  id: string
  nome: string
  cpf: string
  telefone?: string
  dataNascimento?: string
  endereco?: string
  cargo: string
  tipoContrato: TipoContrato
  valorDiariaOuSalario: number
  chavePix?: string
  dataAdmissao: string
  propriedadeId?: string
  ativo: boolean
}

export interface PeriodoFerias {
  id: string
  funcionarioId: string
  dataInicio: string
  dataFim: string
  observacoes?: string
}

export type TipoPagamentoAdicional = 'DECIMO_TERCEIRO' | 'COMISSAO' | 'FERIAS'

export interface PagamentoAdicional {
  id: string
  funcionarioId: string
  tipo: TipoPagamentoAdicional
  competencia: string
  valor: number
  data: string
  pago: boolean
  observacoes?: string
}

export type CategoriaEstoque = 'INSUMO' | 'PECA' | 'COMBUSTIVEL' | 'EMBALAGEM'

export interface ItemEstoque {
  id: string
  nome: string
  categoria: CategoriaEstoque
  quantidade: number
  unidadeMedida: string
  estoqueMinimo: number
}
