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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { propriedadesRepo } from '@/services/repositories'
import type { Propriedade, TipoAtividadePropriedade } from '@/types'
import { TIPO_ATIVIDADE_PROPRIEDADE_LABELS } from '../constants'

interface PropriedadeFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  propriedade?: Propriedade
  onSalvar: () => void
}

const TODOS_TIPOS = Object.keys(TIPO_ATIVIDADE_PROPRIEDADE_LABELS) as TipoAtividadePropriedade[]

export function PropriedadeFormDialog({
  aberto,
  onOpenChange,
  propriedade,
  onSalvar,
}: PropriedadeFormDialogProps) {
  const [nome, setNome] = useState('')
  const [areaHectares, setAreaHectares] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [tiposAtividade, setTiposAtividade] = useState<TipoAtividadePropriedade[]>([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome(propriedade?.nome ?? '')
    setAreaHectares(propriedade ? String(propriedade.areaHectares) : '')
    setLocalizacao(propriedade?.localizacao ?? '')
    setTiposAtividade(propriedade?.tiposAtividade ?? [])
  }, [aberto, propriedade])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const area = Number(areaHectares)

    if (!nome || area <= 0 || !localizacao || tiposAtividade.length === 0) {
      toast.error('Preencha nome, área, localização e ao menos um tipo de atividade.')
      return
    }

    setSalvando(true)

    if (propriedade) {
      await propriedadesRepo.update(propriedade.id, {
        nome,
        areaHectares: area,
        localizacao,
        tiposAtividade,
      })
      toast.success('Propriedade atualizada!')
    } else {
      const nova: Propriedade = {
        id: crypto.randomUUID(),
        nome,
        areaHectares: area,
        localizacao,
        tiposAtividade,
      }
      await propriedadesRepo.create(nova)
      toast.success('Propriedade cadastrada!')
    }

    setSalvando(false)
    onSalvar()
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{propriedade ? 'Editar Propriedade' : 'Nova Propriedade'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propriedade-nome">Nome</Label>
            <Input id="propriedade-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propriedade-area">Área (ha)</Label>
              <Input
                id="propriedade-area"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={areaHectares}
                onChange={(e) => setAreaHectares(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propriedade-local">Localização</Label>
              <Input
                id="propriedade-local"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Cidade/UF"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipos de Atividade</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              className="flex-wrap justify-start"
              value={tiposAtividade}
              onValueChange={(valor) => setTiposAtividade(valor as TipoAtividadePropriedade[])}
            >
              {TODOS_TIPOS.map((tipo) => (
                <ToggleGroupItem key={tipo} value={tipo}>
                  {TIPO_ATIVIDADE_PROPRIEDADE_LABELS[tipo]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
