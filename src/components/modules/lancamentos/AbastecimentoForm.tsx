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
import { manutencoesVeiculoRepo, transacoesRepo, veiculosRepo } from '@/services/repositories'
import type { ManutencaoVeiculo, Transacao } from '@/types'
import { TIPO_VEICULO_LABELS } from '../constants'

export function AbastecimentoForm() {
  const { dados: veiculos, recarregar: recarregarVeiculos } = useRepoData(veiculosRepo)

  const [veiculoId, setVeiculoId] = useState('')
  const [descricao, setDescricao] = useState('Abastecimento')
  const [valor, setValor] = useState('')
  const [kmAtual, setKmAtual] = useState('')
  const [litros, setLitros] = useState('')
  const [salvando, setSalvando] = useState(false)

  function selecionarVeiculo(id: string) {
    setVeiculoId(id)
    const veiculo = veiculos.find((v) => v.id === id)
    if (veiculo) setKmAtual(String(veiculo.kmAtual))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const custo = Number(valor)
    const km = Number(kmAtual)

    if (!veiculoId || !descricao || custo <= 0 || km <= 0) {
      toast.error('Preencha veículo, valor e KM atual.')
      return
    }

    setSalvando(true)
    const dataIso = new Date().toISOString()
    const veiculo = veiculos.find((v) => v.id === veiculoId)

    const manutencao: ManutencaoVeiculo = {
      id: crypto.randomUUID(),
      veiculoId,
      descricao,
      custo,
      kmRealizado: km,
      litros: litros ? Number(litros) : undefined,
      data: dataIso,
    }

    const transacao: Transacao = {
      id: crypto.randomUUID(),
      data: dataIso,
      tipo: 'SAIDA',
      escopo: 'PROFISSIONAL',
      centroCusto: 'FROTA_TRANSPORTE',
      valor: custo,
      descricao: `${descricao} — ${veiculo?.placa ?? 'veículo'}`,
      categoria: litros ? 'Combustível' : 'Manutenção',
      statusPagamento: 'PAGO',
    }

    const tarefas: Promise<unknown>[] = [
      manutencoesVeiculoRepo.create(manutencao),
      transacoesRepo.create(transacao),
    ]
    if (veiculo && km > veiculo.kmAtual) {
      tarefas.push(veiculosRepo.update(veiculoId, { kmAtual: km }))
    }
    await Promise.all(tarefas)
    await recarregarVeiculos()

    toast.success('Lançamento registrado com sucesso!')
    setDescricao('Abastecimento')
    setValor('')
    setKmAtual('')
    setLitros('')
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="abast-veiculo">Veículo</Label>
        <Select value={veiculoId} onValueChange={selecionarVeiculo}>
          <SelectTrigger id="abast-veiculo" className="w-full">
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
        <Label htmlFor="abast-descricao">Descrição</Label>
        <Input
          id="abast-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Abastecimento, troca de óleo..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="abast-valor">Valor (R$)</Label>
          <Input
            id="abast-valor"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="abast-km">KM atual</Label>
          <Input
            id="abast-km"
            type="number"
            min="0"
            inputMode="numeric"
            value={kmAtual}
            onChange={(e) => setKmAtual(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="abast-litros">Litros (opcional)</Label>
        <Input
          id="abast-litros"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={litros}
          onChange={(e) => setLitros(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={salvando} className="w-full">
        {salvando ? 'Salvando...' : 'Registrar Lançamento'}
      </Button>
    </form>
  )
}
