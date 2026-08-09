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
import {
  atividadesAgricolasRepo,
  propriedadesRepo,
  talhoesRepo,
  transacoesRepo,
} from '@/services/repositories'
import type { AtividadeAgricola, Transacao } from '@/types'
import { formatarMoeda } from '../constants'

export function ColheitaForm() {
  const { dados: talhoes } = useRepoData(talhoesRepo)
  const { dados: propriedades } = useRepoData(propriedadesRepo)

  const [talhaoId, setTalhaoId] = useState('')
  const [caixas, setCaixas] = useState('')
  const [valorPorCaixa, setValorPorCaixa] = useState('')
  const [salvando, setSalvando] = useState(false)

  function nomeTalhao(id: string) {
    const talhao = talhoes.find((t) => t.id === id)
    if (!talhao) return ''
    const propriedade = propriedades.find((p) => p.id === talhao.propriedadeId)
    return propriedade ? `${propriedade.nome} — ${talhao.nome} (${talhao.cultura})` : talhao.nome
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const qtdCaixas = Number(caixas)
    const valorCaixa = Number(valorPorCaixa)
    if (!talhaoId || qtdCaixas <= 0 || valorCaixa <= 0) {
      toast.error('Preencha talhão, caixas e valor por caixa.')
      return
    }

    setSalvando(true)
    const dataIso = new Date().toISOString()

    const atividade: AtividadeAgricola = {
      id: crypto.randomUUID(),
      talhaoId,
      tipoAtividade: 'COLHEITA',
      data: dataIso,
      insumosUtilizados: [],
      observacoes: `${qtdCaixas} caixas colhidas a ${formatarMoeda(valorCaixa)}/caixa`,
    }

    const transacao: Transacao = {
      id: crypto.randomUUID(),
      data: dataIso,
      tipo: 'ENTRADA',
      escopo: 'PROFISSIONAL',
      centroCusto: 'CITRICULTURA',
      valor: qtdCaixas * valorCaixa,
      descricao: `Colheita — ${nomeTalhao(talhaoId)}`,
      categoria: 'Colheita',
      statusPagamento: 'PAGO',
    }

    await Promise.all([atividadesAgricolasRepo.create(atividade), transacoesRepo.create(transacao)])

    toast.success('Colheita registrada com sucesso!')
    setTalhaoId('')
    setCaixas('')
    setValorPorCaixa('')
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="colheita-talhao">Talhão</Label>
        <Select value={talhaoId} onValueChange={setTalhaoId}>
          <SelectTrigger id="colheita-talhao" className="w-full">
            <SelectValue placeholder="Selecione o talhão" />
          </SelectTrigger>
          <SelectContent>
            {talhoes.map((talhao) => (
              <SelectItem key={talhao.id} value={talhao.id}>
                {nomeTalhao(talhao.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="colheita-caixas">Caixas colhidas</Label>
          <Input
            id="colheita-caixas"
            type="number"
            min="0"
            inputMode="numeric"
            value={caixas}
            onChange={(e) => setCaixas(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="colheita-valor">Valor por caixa (R$)</Label>
          <Input
            id="colheita-valor"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={valorPorCaixa}
            onChange={(e) => setValorPorCaixa(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>

      {caixas && valorPorCaixa && (
        <p className="text-sm text-muted-foreground">
          Total: {formatarMoeda(Number(caixas) * Number(valorPorCaixa))}
        </p>
      )}

      <Button type="submit" disabled={salvando} className="w-full">
        {salvando ? 'Salvando...' : 'Registrar Colheita'}
      </Button>
    </form>
  )
}
