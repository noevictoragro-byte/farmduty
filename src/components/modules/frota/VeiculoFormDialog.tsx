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
import { veiculosRepo } from '@/services/repositories'
import type { TipoVeiculo, Veiculo } from '@/types'
import { TIPO_VEICULO_LABELS } from '../constants'

interface VeiculoFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  veiculo?: Veiculo
  onSalvar: () => void
}

const TODOS_TIPOS = Object.keys(TIPO_VEICULO_LABELS) as TipoVeiculo[]

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
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setPlaca(veiculo?.placa ?? '')
    setModelo(veiculo?.modelo ?? '')
    setTipo(veiculo?.tipo ?? 'CAMINHAO')
    setKmAtual(veiculo ? String(veiculo.kmAtual) : '')
  }, [aberto, veiculo])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const km = Number(kmAtual)

    if (!placa || !modelo || km < 0) {
      toast.error('Preencha placa, modelo e KM atual.')
      return
    }

    setSalvando(true)

    if (veiculo) {
      await veiculosRepo.update(veiculo.id, { placa, modelo, tipo, kmAtual: km })
      toast.success('Veículo atualizado!')
    } else {
      const novo: Veiculo = {
        id: crypto.randomUUID(),
        placa,
        modelo,
        tipo,
        kmAtual: km,
      }
      await veiculosRepo.create(novo)
      toast.success('Veículo cadastrado!')
    }

    setSalvando(false)
    onSalvar()
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{veiculo ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="veiculo-modelo">Modelo</Label>
            <Input
              id="veiculo-modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Mercedes-Benz Atego 2426"
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
