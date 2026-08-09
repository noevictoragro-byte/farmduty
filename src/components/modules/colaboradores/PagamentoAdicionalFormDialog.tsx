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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { pagamentosAdicionaisRepo, transacoesRepo } from '@/services/repositories'
import type { PagamentoAdicional, Transacao, TipoPagamentoAdicional } from '@/types'
import { TIPO_PAGAMENTO_ADICIONAL_LABELS } from '../constants'

interface PagamentoAdicionalFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  funcionarioId: string
  nomeFuncionario: string
  onSalvar: () => void
}

const TODOS_TIPOS = Object.keys(TIPO_PAGAMENTO_ADICIONAL_LABELS) as TipoPagamentoAdicional[]

export function PagamentoAdicionalFormDialog({
  aberto,
  onOpenChange,
  funcionarioId,
  nomeFuncionario,
  onSalvar,
}: PagamentoAdicionalFormDialogProps) {
  const [tipo, setTipo] = useState<TipoPagamentoAdicional>('DECIMO_TERCEIRO')
  const [competencia, setCompetencia] = useState('')
  const [valor, setValor] = useState('')
  const [pago, setPago] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setTipo('DECIMO_TERCEIRO')
    setCompetencia('')
    setValor('')
    setPago(false)
  }, [aberto])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const valorNumerico = Number(valor)

    if (!competencia || valorNumerico <= 0) {
      toast.error('Preencha a competência e o valor.')
      return
    }

    setSalvando(true)
    const dataIso = new Date().toISOString()

    const novoPagamento: PagamentoAdicional = {
      id: crypto.randomUUID(),
      funcionarioId,
      tipo,
      competencia,
      valor: valorNumerico,
      data: dataIso,
      pago,
    }

    const tarefas: Promise<unknown>[] = [pagamentosAdicionaisRepo.create(novoPagamento)]

    if (pago) {
      const transacao: Transacao = {
        id: crypto.randomUUID(),
        data: dataIso,
        tipo: 'SAIDA',
        escopo: 'PROFISSIONAL',
        centroCusto: 'FOLHA_PAGAMENTO',
        valor: valorNumerico,
        descricao: `${TIPO_PAGAMENTO_ADICIONAL_LABELS[tipo]} — ${nomeFuncionario}`,
        categoria: TIPO_PAGAMENTO_ADICIONAL_LABELS[tipo],
        statusPagamento: 'PAGO',
      }
      tarefas.push(transacoesRepo.create(transacao))
    }

    await Promise.all(tarefas)
    toast.success('Pagamento registrado!')

    setSalvando(false)
    onSalvar()
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Pagamento Adicional</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pagamento-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPagamentoAdicional)}>
              <SelectTrigger id="pagamento-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TODOS_TIPOS.map((chave) => (
                  <SelectItem key={chave} value={chave}>
                    {TIPO_PAGAMENTO_ADICIONAL_LABELS[chave]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pagamento-competencia">Competência</Label>
              <Input
                id="pagamento-competencia"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                placeholder="2026 - 1ª parcela"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pagamento-valor">Valor (R$)</Label>
              <Input
                id="pagamento-valor"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              className="w-full"
              value={pago ? 'PAGO' : 'PENDENTE'}
              onValueChange={(v) => v && setPago(v === 'PAGO')}
            >
              <ToggleGroupItem value="PENDENTE" className="flex-1">
                Pendente
              </ToggleGroupItem>
              <ToggleGroupItem value="PAGO" className="flex-1">
                Pago
              </ToggleGroupItem>
            </ToggleGroup>
            {pago && (
              <p className="text-xs text-muted-foreground">
                Um lançamento financeiro será criado automaticamente.
              </p>
            )}
          </div>

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
