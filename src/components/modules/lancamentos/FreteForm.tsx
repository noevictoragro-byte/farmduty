import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
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
import { useRepoData } from '@/hooks/useRepoData'
import { transacoesRepo, veiculosRepo, viagensFreteRepo } from '@/services/repositories'
import type { Transacao, ViagemFrete } from '@/types'
import { TIPO_VEICULO_LABELS, formatarMoeda } from '../constants'

export function FreteForm() {
  const { dados: veiculos, recarregar: recarregarVeiculos } = useRepoData(veiculosRepo)

  const [veiculoId, setVeiculoId] = useState('')
  const [cliente, setCliente] = useState('')
  const [origem, setOrigem] = useState('')
  const [destino, setDestino] = useState('')
  const [valorFrete, setValorFrete] = useState('')
  const [kmInicial, setKmInicial] = useState('')
  const [kmFinal, setKmFinal] = useState('')
  const [salvando, setSalvando] = useState(false)

  function selecionarVeiculo(id: string) {
    setVeiculoId(id)
    const veiculo = veiculos.find((v) => v.id === id)
    if (veiculo) setKmInicial(String(veiculo.kmAtual))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const valor = Number(valorFrete)
    const km1 = Number(kmInicial)
    const km2 = Number(kmFinal)

    if (!veiculoId || !cliente || !origem || !destino || valor <= 0 || km2 < km1) {
      toast.error('Preencha todos os campos corretamente.')
      return
    }

    setSalvando(true)
    const dataIso = new Date().toISOString()
    const veiculo = veiculos.find((v) => v.id === veiculoId)

    const viagem: ViagemFrete = {
      id: crypto.randomUUID(),
      veiculoId,
      cliente,
      origem,
      destino,
      valorFrete: valor,
      kmInicial: km1,
      kmFinal: km2,
      data: dataIso,
    }

    const transacao: Transacao = {
      id: crypto.randomUUID(),
      data: dataIso,
      tipo: 'ENTRADA',
      escopo: 'PROFISSIONAL',
      centroCusto: 'FROTA_TRANSPORTE',
      valor,
      descricao: `Frete — ${cliente} (${origem} → ${destino})`,
      categoria: 'Frete',
      statusPagamento: 'PAGO',
    }

    const tarefas: Promise<unknown>[] = [
      viagensFreteRepo.create(viagem),
      transacoesRepo.create(transacao),
    ]
    if (veiculo && km2 > veiculo.kmAtual) {
      tarefas.push(veiculosRepo.update(veiculoId, { kmAtual: km2 }))
    }
    await Promise.all(tarefas)
    await recarregarVeiculos()

    toast.success('Viagem registrada com sucesso!')
    setCliente('')
    setOrigem('')
    setDestino('')
    setValorFrete('')
    setKmInicial('')
    setKmFinal('')
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="frete-veiculo">Veículo</Label>
        <Select value={veiculoId} onValueChange={selecionarVeiculo}>
          <SelectTrigger id="frete-veiculo" className="w-full">
            <SelectValue placeholder="Selecione o veículo" />
          </SelectTrigger>
          <SelectContent>
            {veiculos.map((veiculo) => (
              <SelectItem key={veiculo.id} value={veiculo.id}>
                {veiculo.placa} — {veiculo.modelo} ({TIPO_VEICULO_LABELS[veiculo.tipo]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frete-cliente">Cliente</Label>
        <Input id="frete-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frete-origem">Origem</Label>
          <Input id="frete-origem" value={origem} onChange={(e) => setOrigem(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frete-destino">Destino</Label>
          <Input id="frete-destino" value={destino} onChange={(e) => setDestino(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frete-valor">Valor do frete (R$)</Label>
        <Input
          id="frete-valor"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={valorFrete}
          onChange={(e) => setValorFrete(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frete-km-inicial">KM inicial</Label>
          <Input
            id="frete-km-inicial"
            type="number"
            min="0"
            inputMode="numeric"
            value={kmInicial}
            onChange={(e) => setKmInicial(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frete-km-final">KM final</Label>
          <Input
            id="frete-km-final"
            type="number"
            min="0"
            inputMode="numeric"
            value={kmFinal}
            onChange={(e) => setKmFinal(e.target.value)}
          />
        </div>
      </div>

      {valorFrete && (
        <p className="text-sm text-muted-foreground">
          Receita da viagem: {formatarMoeda(Number(valorFrete))}
        </p>
      )}

      <Button type="submit" disabled={salvando} className="w-full">
        {salvando ? 'Salvando...' : 'Registrar Viagem'}
      </Button>
    </form>
  )
}
