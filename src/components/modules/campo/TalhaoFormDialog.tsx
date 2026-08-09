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
import { talhoesRepo } from '@/services/repositories'
import type { Talhao } from '@/types'

interface TalhaoFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  propriedadeId: string
  talhao?: Talhao
  onSalvar: () => void
}

export function TalhaoFormDialog({
  aberto,
  onOpenChange,
  propriedadeId,
  talhao,
  onSalvar,
}: TalhaoFormDialogProps) {
  const [nome, setNome] = useState('')
  const [cultura, setCultura] = useState('')
  const [areaHectares, setAreaHectares] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome(talhao?.nome ?? '')
    setCultura(talhao?.cultura ?? '')
    setAreaHectares(talhao ? String(talhao.areaHectares) : '')
  }, [aberto, talhao])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const area = Number(areaHectares)

    if (!nome || !cultura || area <= 0) {
      toast.error('Preencha nome, cultura e área.')
      return
    }

    setSalvando(true)

    if (talhao) {
      await talhoesRepo.update(talhao.id, { nome, cultura, areaHectares: area })
      toast.success('Talhão atualizado!')
    } else {
      const novo: Talhao = {
        id: crypto.randomUUID(),
        propriedadeId,
        nome,
        cultura,
        areaHectares: area,
      }
      await talhoesRepo.create(novo)
      toast.success('Talhão cadastrado!')
    }

    setSalvando(false)
    onSalvar()
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{talhao ? 'Editar Talhão' : 'Novo Talhão'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="talhao-nome">Nome</Label>
            <Input
              id="talhao-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Talhão 01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="talhao-cultura">Cultura</Label>
              <Input
                id="talhao-cultura"
                value={cultura}
                onChange={(e) => setCultura(e.target.value)}
                placeholder="Laranja, Milho..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="talhao-area">Área (ha)</Label>
              <Input
                id="talhao-area"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={areaHectares}
                onChange={(e) => setAreaHectares(e.target.value)}
              />
            </div>
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
