import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { veiculosRepo, transacoesRepo } from '@/services/repositories'
import type {
  FormaAquisicao,
  ParcelaFinanciamento,
  TipoVeiculo,
  Veiculo,
} from '@/types'
import type { Transacao } from '@/types'
import { FORMA_AQUISICAO_LABELS, TIPO_VEICULO_LABELS } from '../constants'
import { TIPOS_COM_CHASSIS, TIPOS_SEM_PLACA } from '@/types'

interface VeiculoFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  veiculo?: Veiculo
  onSalvar: () => void
}

const TODOS_TIPOS = Object.keys(TIPO_VEICULO_LABELS) as TipoVeiculo[]
const TODAS_FORMAS = Object.keys(FORMA_AQUISICAO_LABELS) as FormaAquisicao[]

function gerarParcelasDatas(
  dataInicio: string,
  total: number,
  valorParcela: number,
  parcelasExistentes: ParcelaFinanciamento[],
): ParcelaFinanciamento[] {
  const inicio = new Date(dataInicio + 'T00:00:00')
  return Array.from({ length: total }, (_, i) => {
    const venc = new Date(inicio)
    venc.setMonth(venc.getMonth() + i)
    const existente = parcelasExistentes[i]
    return {
      id: existente?.id ?? crypto.randomUUID(),
      numero: i + 1,
      valor: valorParcela,
      vencimento: venc.toISOString().slice(0, 10),
      pago: existente?.pago ?? false,
      dataPagamento: existente?.dataPagamento,
      transacaoId: existente?.transacaoId,
    }
  })
}

export function VeiculoFormDialog({
  aberto,
  onOpenChange,
  veiculo,
  onSalvar,
}: VeiculoFormDialogProps) {
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [tipo, setTipo] = useState<TipoVeiculo>('CAMINHAO')
  const [kmAtual, setKmAtual] = useState('')
  const [chassis, setChassis] = useState('')
  const [serie, setSerie] = useState('')
  const [valorAquisicao, setValorAquisicao] = useState('')
  const [formaAquisicao, setFormaAquisicao] = useState<FormaAquisicao | ''>('')
  const [possuiFinanciamento, setPossuiFinanciamento] = useState(false)
  const [instituicaoFinanciadora, setInstituicaoFinanciadora] = useState('')
  const [totalParcelas, setTotalParcelas] = useState('')
  const [valorParcela, setValorParcela] = useState('')
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState('')
  const [parcelas, setParcelas] = useState<ParcelaFinanciamento[]>([])
  const [salvando, setSalvando] = useState(false)

  const semPlaca = TIPOS_SEM_PLACA.includes(tipo)
  const comChassis = TIPOS_COM_CHASSIS.includes(tipo)

  useEffect(() => {
    if (!aberto) return
    setPlaca(veiculo?.placa ?? '')
    setModelo(veiculo?.modelo ?? '')
    setTipo(veiculo?.tipo ?? 'CAMINHAO')
    setKmAtual(veiculo ? String(veiculo.kmAtual) : '')
    setChassis(veiculo?.chassis ?? '')
    setSerie(veiculo?.serie ?? '')
    setValorAquisicao(veiculo?.valorAquisicao ? String(veiculo.valorAquisicao) : '')
    setFormaAquisicao(veiculo?.formaAquisicao ?? '')
    setPossuiFinanciamento(veiculo?.possuiFinanciamento ?? false)
    setInstituicaoFinanciadora(veiculo?.instituicaoFinanciadora ?? '')
    setTotalParcelas(veiculo?.totalParcelas ? String(veiculo.totalParcelas) : '')
    setValorParcela(veiculo?.valorParcela ? String(veiculo.valorParcela) : '')
    setDataPrimeiraParcela(veiculo?.parcelas?.[0]?.vencimento ?? '')
    setParcelas(veiculo?.parcelas ?? [])
  }, [aberto, veiculo])

  // Regenera parcelas ao mudar parâmetros de financiamento
  useEffect(() => {
    if (!possuiFinanciamento || !totalParcelas || !valorParcela || !dataPrimeiraParcela) {
      return
    }
    const total = parseInt(totalParcelas)
    const valor = parseFloat(valorParcela.replace(',', '.'))
    if (isNaN(total) || isNaN(valor) || total <= 0) return
    setParcelas((prev) => gerarParcelasDatas(dataPrimeiraParcela, total, valor, prev))
  }, [possuiFinanciamento, totalParcelas, valorParcela, dataPrimeiraParcela])

  function toggleParcela(index: number) {
    setParcelas((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              pago: !p.pago,
              dataPagamento: !p.pago ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : p,
      ),
    )
  }

  async function sincronizarParcelasFinanceiro(
    veiculoId: string,
    veiculoModelo: string,
    novasParcelas: ParcelaFinanciamento[],
  ): Promise<ParcelaFinanciamento[]> {
    const atualizadas: ParcelaFinanciamento[] = []

    for (const parcela of novasParcelas) {
      if (!parcela.transacaoId) {
        // Criar transação pendente para esta parcela
        const transacao: Transacao = {
          id: crypto.randomUUID(),
          data: parcela.vencimento,
          tipo: 'SAIDA',
          escopo: 'PROFISSIONAL',
          centroCusto: 'FROTA_TRANSPORTE',
          valor: parcela.valor,
          descricao: `Financiamento ${veiculoModelo} — Parcela ${parcela.numero}/${novasParcelas.length}`,
          categoria: 'Financiamento de equipamento',
          statusPagamento: parcela.pago ? 'PAGO' : 'PENDENTE',
          dataVencimento: parcela.vencimento,
        }
        await transacoesRepo.create(transacao)
        atualizadas.push({ ...parcela, transacaoId: transacao.id })
      } else {
        // Sincronizar status de pagamento
        const statusPagamento = parcela.pago ? 'PAGO' : 'PENDENTE'
        await transacoesRepo.update(parcela.transacaoId, {
          statusPagamento,
          data: parcela.pago ? (parcela.dataPagamento ?? parcela.vencimento) : parcela.vencimento,
        })
        atualizadas.push(parcela)
      }
    }

    return atualizadas
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const km = Number(kmAtual)

    if (!semPlaca && !placa) {
      toast.error('Preencha a placa do veículo.')
      return
    }
    if (!modelo) {
      toast.error('Preencha o modelo.')
      return
    }
    if (km < 0) {
      toast.error('KM inválido.')
      return
    }
    if (possuiFinanciamento && parcelas.length === 0) {
      toast.error('Informe os dados do financiamento para gerar as parcelas.')
      return
    }

    setSalvando(true)

    try {
      let parcelasFinais = parcelas
      if (possuiFinanciamento && parcelas.length > 0) {
        parcelasFinais = await sincronizarParcelasFinanceiro(
          veiculo?.id ?? crypto.randomUUID(),
          modelo,
          parcelas,
        )
      }

      const dados: Omit<Veiculo, 'id'> = {
        placa: semPlaca ? undefined : placa || undefined,
        modelo,
        tipo,
        kmAtual: km,
        chassis: comChassis ? chassis || undefined : undefined,
        serie: comChassis ? serie || undefined : undefined,
        valorAquisicao: valorAquisicao ? parseFloat(valorAquisicao.replace(',', '.')) : undefined,
        formaAquisicao: formaAquisicao || undefined,
        possuiFinanciamento,
        instituicaoFinanciadora: possuiFinanciamento ? instituicaoFinanciadora || undefined : undefined,
        totalParcelas: possuiFinanciamento && totalParcelas ? parseInt(totalParcelas) : undefined,
        valorParcela: possuiFinanciamento && valorParcela ? parseFloat(valorParcela.replace(',', '.')) : undefined,
        parcelas: possuiFinanciamento ? parcelasFinais : undefined,
      }

      if (veiculo) {
        await veiculosRepo.update(veiculo.id, dados)
        toast.success('Veículo atualizado!')
      } else {
        await veiculosRepo.create({ id: crypto.randomUUID(), ...dados })
        toast.success('Veículo cadastrado!')
      }

      onSalvar()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar veículo.')
    } finally {
      setSalvando(false)
    }
  }

  const parcelasPagas = parcelas.filter((p) => p.pago).length
  const totalEmAberto = parcelas
    .filter((p) => !p.pago)
    .reduce((soma, p) => soma + p.valor, 0)

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{veiculo ? 'Editar Equipamento' : 'Novo Equipamento / Veículo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo e Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="veiculo-tipo">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoVeiculo)}>
                <SelectTrigger id="veiculo-tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODOS_TIPOS.map((chave) => (
                    <SelectItem key={chave} value={chave}>
                      {TIPO_VEICULO_LABELS[chave]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="veiculo-modelo">Modelo / Descrição</Label>
              <Input
                id="veiculo-modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: John Deere 5075E"
                required
              />
            </div>
          </div>

          {/* Placa (apenas para tipos que têm placa) */}
          {!semPlaca && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo-placa">Placa</Label>
                <Input
                  id="veiculo-placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC-1D23"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veiculo-km">KM atual</Label>
                <Input
                  id="veiculo-km"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={kmAtual}
                  onChange={(e) => setKmAtual(e.target.value)}
                />
              </div>
            </div>
          )}

          {semPlaca && (
            <div className="space-y-2">
              <Label htmlFor="veiculo-km">Horímetro / KM atual</Label>
              <Input
                id="veiculo-km"
                type="number"
                min="0"
                inputMode="numeric"
                value={kmAtual}
                onChange={(e) => setKmAtual(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {/* Chassis e Série (para Trator, Retro, Drone, Implemento) */}
          {comChassis && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo-chassis">Chassis</Label>
                <Input
                  id="veiculo-chassis"
                  value={chassis}
                  onChange={(e) => setChassis(e.target.value.toUpperCase())}
                  placeholder="Nº do chassis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veiculo-serie">Série / Serial</Label>
                <Input
                  id="veiculo-serie"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  placeholder="Nº de série"
                />
              </div>
            </div>
          )}

          {/* Dados de Aquisição */}
          <div className="rounded-md border p-4 space-y-4">
            <p className="text-sm font-medium">Aquisição</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo-valor-aquisicao">Valor de aquisição (R$)</Label>
                <Input
                  id="veiculo-valor-aquisicao"
                  inputMode="decimal"
                  value={valorAquisicao}
                  onChange={(e) => setValorAquisicao(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veiculo-forma-aquisicao">Forma de aquisição</Label>
                <Select
                  value={formaAquisicao}
                  onValueChange={(v) => {
                    setFormaAquisicao(v as FormaAquisicao)
                    if (v !== 'FINANCIAMENTO' && v !== 'LEASING') {
                      setPossuiFinanciamento(false)
                    }
                  }}
                >
                  <SelectTrigger id="veiculo-forma-aquisicao" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TODAS_FORMAS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {FORMA_AQUISICAO_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggle financiamento em aberto */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="veiculo-possui-financiamento"
                checked={possuiFinanciamento}
                onChange={(e) => setPossuiFinanciamento(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <Label htmlFor="veiculo-possui-financiamento" className="cursor-pointer">
                Possui valor em aberto (financiamento / parcelamento)
              </Label>
            </div>
          </div>

          {/* Seção de Financiamento */}
          {possuiFinanciamento && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-4">
              <p className="text-sm font-medium">Detalhes do Financiamento</p>

              <div className="space-y-2">
                <Label htmlFor="veiculo-instituicao">Instituição / Credor</Label>
                <Input
                  id="veiculo-instituicao"
                  value={instituicaoFinanciadora}
                  onChange={(e) => setInstituicaoFinanciadora(e.target.value)}
                  placeholder="Ex: Banco do Brasil, FINAME..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="veiculo-total-parcelas">Nº de parcelas</Label>
                  <Input
                    id="veiculo-total-parcelas"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(e.target.value)}
                    placeholder="Ex: 36"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="veiculo-valor-parcela">Valor da parcela (R$)</Label>
                  <Input
                    id="veiculo-valor-parcela"
                    inputMode="decimal"
                    value={valorParcela}
                    onChange={(e) => setValorParcela(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="veiculo-data-primeira">1ª parcela</Label>
                  <Input
                    id="veiculo-data-primeira"
                    type="date"
                    value={dataPrimeiraParcela}
                    onChange={(e) => setDataPrimeiraParcela(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de parcelas geradas */}
              {parcelas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Parcelas ({parcelas.length})</span>
                    <span className="text-muted-foreground">
                      {parcelasPagas} pagas · Em aberto:{' '}
                      <span className="font-medium text-foreground">
                        {totalEmAberto.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded border p-2">
                    {parcelas.map((parcela, i) => (
                      <div
                        key={parcela.id}
                        className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`parcela-${i}`}
                            checked={parcela.pago}
                            onChange={() => toggleParcela(i)}
                            className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
                          />
                          <Label htmlFor={`parcela-${i}`} className="cursor-pointer text-xs">
                            {String(parcela.numero).padStart(2, '0')}/{String(parcelas.length).padStart(2, '0')}
                          </Label>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(parcela.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className={parcela.pago ? 'text-green-600 line-through' : ''}>
                          {parcela.valor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Os vencimentos serão espelhados no módulo Financeiro automaticamente.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
