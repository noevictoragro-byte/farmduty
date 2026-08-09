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
import { Textarea } from '@/components/ui/textarea'
import { periodosFeriasRepo } from '@/services/repositories'
import type { PeriodoFerias } from '@/types'

interface FeriasFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  funcionarioId: string
  onSalvar: () => void
}

export function FeriasFormDialog({
  aberto,
  onOpenChange,
  funcionarioId,
  onSalvar,
}: FeriasFormDialogProps) {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setDataInicio('')
    setDataFim('')
    setObservacoes('')
  }, [aberto])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!dataInicio || !dataFim || dataFim < dataInicio) {
      toast.error('Preencha um período de férias válido.')
      return
    }

    setSalvando(true)

    const novo: PeriodoFerias = {
      id: crypto.randomUUID(),
      funcionarioId,
      dataInicio,
      dataFim,
      observacoes: observacoes || undefined,
    }
    await periodosFeriasRepo.create(novo)
    toast.success('Período de férias registrado!')

    setSalvando(false)
    onSalvar()
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Férias</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ferias-inicio">Início</Label>
              <Input
                id="ferias-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ferias-fim">Fim</Label>
              <Input
                id="ferias-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ferias-obs">Observações</Label>
            <Textarea
              id="ferias-obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
            />
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
