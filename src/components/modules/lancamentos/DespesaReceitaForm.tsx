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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { transacoesRepo } from '@/services/repositories'
import type { CentroCusto, EscopoFinanceiro, StatusPagamento, Transacao, TipoTransacao } from '@/types'
import { CENTRO_CUSTO_LABELS } from '../constants'

export function DespesaReceitaForm() {
  const [tipo, setTipo] = useState<TipoTransacao>('SAIDA')
  const [escopo, setEscopo] = useState<EscopoFinanceiro>('PROFISSIONAL')
  const [centroCusto, setCentroCusto] = useState<CentroCusto>('OUTRAS_ATIVIDADES_AGRICOLAS')
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('PAGO')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const valorNumerico = Number(valor)
    if (valorNumerico <= 0 || !descricao || !categoria) {
      toast.error('Preencha valor, descrição e categoria.')
      return
    }

    setSalvando(true)

    const transacao: Transacao = {
      id: crypto.randomUUID(),
      data: new Date().toISOString(),
      tipo,
      escopo,
      centroCusto,
      valor: valorNumerico,
      descricao,
      categoria,
      statusPagamento,
    }

    await transacoesRepo.create(transacao)

    toast.success('Lançamento registrado com sucesso!')
    setValor('')
    setDescricao('')
    setCategoria('')
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={tipo}
          onValueChange={(value) => value && setTipo(value as TipoTransacao)}
        >
          <ToggleGroupItem value="ENTRADA" className="flex-1">
            Entrada
          </ToggleGroupItem>
          <ToggleGroupItem value="SAIDA" className="flex-1">
            Saída
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label>Escopo</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={escopo}
          onValueChange={(value) => value && setEscopo(value as EscopoFinanceiro)}
        >
          <ToggleGroupItem value="PROFISSIONAL" className="flex-1">
            🚜 Profissional
          </ToggleGroupItem>
          <ToggleGroupItem value="PESSOAL" className="flex-1">
            🏠 Pessoal
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="geral-centro-custo">Centro de Custo</Label>
        <Select value={centroCusto} onValueChange={(v) => setCentroCusto(v as CentroCusto)}>
          <SelectTrigger id="geral-centro-custo" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CENTRO_CUSTO_LABELS) as CentroCusto[]).map((chave) => (
              <SelectItem key={chave} value={chave}>
                {CENTRO_CUSTO_LABELS[chave]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="geral-valor">Valor (R$)</Label>
          <Input
            id="geral-valor"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="geral-categoria">Categoria</Label>
          <Input
            id="geral-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Alimentação, Insumos..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="geral-descricao">Descrição</Label>
        <Input
          id="geral-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={statusPagamento}
          onValueChange={(value) => value && setStatusPagamento(value as StatusPagamento)}
        >
          <ToggleGroupItem value="PAGO" className="flex-1">
            Pago
          </ToggleGroupItem>
          <ToggleGroupItem value="PENDENTE" className="flex-1">
            Pendente
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Button type="submit" disabled={salvando} className="w-full">
        {salvando ? 'Salvando...' : 'Registrar Lançamento'}
      </Button>
    </form>
  )
}
