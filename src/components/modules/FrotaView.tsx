import { useState } from 'react'
import { toast } from 'sonner'
import { Fuel, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRepoData } from '@/hooks/useRepoData'
import { manutencoesVeiculoRepo, veiculosRepo, viagensFreteRepo } from '@/services/repositories'
import type { Veiculo } from '@/types'
import { TIPO_VEICULO_LABELS, estaNoMesAtual, formatarData, formatarMoeda } from './constants'
import type { TipoLancamento } from './constants'
import { VeiculoFormDialog } from './frota/VeiculoFormDialog'

const LIMITE_ALERTA_KM = 1000

interface FrotaViewProps {
  onNovoLancamento: (aba: TipoLancamento) => void
}

export function FrotaView({ onNovoLancamento }: FrotaViewProps) {
  const { dados: veiculos, carregando, recarregar: recarregarVeiculos } = useRepoData(veiculosRepo)
  const { dados: viagens } = useRepoData(viagensFreteRepo)
  const { dados: manutencoes } = useRepoData(manutencoesVeiculoRepo)

  const [veiculoEditando, setVeiculoEditando] = useState<Veiculo | undefined>()
  const [dialogVeiculoAberto, setDialogVeiculoAberto] = useState(false)

  function abrirNovoVeiculo() {
    setVeiculoEditando(undefined)
    setDialogVeiculoAberto(true)
  }

  function abrirEdicaoVeiculo(veiculo: Veiculo) {
    setVeiculoEditando(veiculo)
    setDialogVeiculoAberto(true)
  }

  async function excluirVeiculo(veiculo: Veiculo) {
    await veiculosRepo.delete(veiculo.id)
    await recarregarVeiculos()
    toast.success('Veículo excluído.')
  }

  const viagensOrdenadas = [...viagens].sort((a, b) => b.data.localeCompare(a.data))

  function alertaManutencao(veiculoId: string, kmAtual: number) {
    const historico = manutencoes
      .filter((m) => m.veiculoId === veiculoId && m.kmProximaManutencao)
      .sort((a, b) => b.data.localeCompare(a.data))
    const proxima = historico[0]?.kmProximaManutencao
    if (!proxima) return null

    const restante = proxima - kmAtual
    if (restante <= 0) return { texto: 'Manutenção atrasada', variant: 'destructive' as const }
    if (restante <= LIMITE_ALERTA_KM) {
      return { texto: `Manutenção em ${restante} km`, variant: 'destructive' as const }
    }
    return null
  }

  function lucroDoMes(veiculoId: string) {
    const receita = viagens
      .filter((v) => v.veiculoId === veiculoId && estaNoMesAtual(v.data))
      .reduce((soma, v) => soma + v.valorFrete, 0)
    const custo = manutencoes
      .filter((m) => m.veiculoId === veiculoId && estaNoMesAtual(m.data))
      .reduce((soma, m) => soma + m.custo, 0)
    return { receita, custo, lucro: receita - custo }
  }

  function placaVeiculo(veiculoId: string) {
    return veiculos.find((v) => v.id === veiculoId)?.placa ?? 'Veículo removido'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Frota & Logística</h1>
          <p className="text-sm text-muted-foreground">{veiculos.length} veículo(s) cadastrado(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={abrirNovoVeiculo}>
            <Plus className="size-4" />
            Novo Veículo
          </Button>
          <Button variant="outline" onClick={() => onNovoLancamento('ABASTECIMENTO')}>
            <Fuel className="size-4" />
            Abastecer
          </Button>
          <Button onClick={() => onNovoLancamento('FRETE')}>
            <Plus className="size-4" />
            Nova Viagem
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {!carregando && veiculos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>
        )}
        {veiculos.map((veiculo) => {
          const alerta = alertaManutencao(veiculo.id, veiculo.kmAtual)
          const { receita, custo, lucro } = lucroDoMes(veiculo.id)

          return (
            <Card key={veiculo.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{veiculo.placa}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">{TIPO_VEICULO_LABELS[veiculo.tipo]}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => abrirEdicaoVeiculo(veiculo)}
                      aria-label="Editar veículo"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => excluirVeiculo(veiculo)}
                      aria-label="Excluir veículo"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{veiculo.modelo}</p>
                <p>{veiculo.kmAtual.toLocaleString('pt-BR')} km rodados</p>

                {alerta && (
                  <Badge variant={alerta.variant} className="gap-1">
                    <TriangleAlert className="size-3" />
                    {alerta.texto}
                  </Badge>
                )}

                <div className="border-t pt-2 text-muted-foreground">
                  <p>Lucro do mês (fretes − manutenção/combustível)</p>
                  <p className="text-base font-semibold text-foreground">{formatarMoeda(lucro)}</p>
                  <p className="text-xs">
                    Receita {formatarMoeda(receita)} · Custos {formatarMoeda(custo)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Viagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {viagensOrdenadas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma viagem registrada ainda.</p>
          )}
          {viagensOrdenadas.map((viagem) => (
            <div
              key={viagem.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div>
                <span className="font-medium">{placaVeiculo(viagem.veiculoId)}</span>
                <span className="ml-2 text-muted-foreground">
                  {viagem.cliente} · {viagem.origem} → {viagem.destino}
                </span>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatarMoeda(viagem.valorFrete)}</p>
                <p className="text-xs text-muted-foreground">{formatarData(viagem.data)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <VeiculoFormDialog
        aberto={dialogVeiculoAberto}
        onOpenChange={setDialogVeiculoAberto}
        veiculo={veiculoEditando}
        onSalvar={recarregarVeiculos}
      />
    </div>
  )
}
