import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/contexts/AppContext'

export function PinModal() {
  const { pinModalAberto, confirmarPin, fecharModalPin } = useApp()
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)

  function resetarEfechar() {
    setPin('')
    setErro(false)
    fecharModalPin()
  }

  function handleOpenChange(aberto: boolean) {
    if (!aberto) resetarEfechar()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (pin.length !== 4) {
      setErro(true)
      return
    }

    const sucesso = confirmarPin(pin)
    if (!sucesso) {
      setErro(true)
      toast.error('PIN incorreto.')
      setPin('')
      return
    }

    setPin('')
    setErro(false)
  }

  return (
    <Dialog open={pinModalAberto} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4" />
            Acesso Restrito - Visão Admin 🔐
          </DialogTitle>
          <DialogDescription>
            Digite o PIN de 4 dígitos para acessar os relatórios e finanças.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            autoFocus
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="••••"
            aria-label="PIN de acesso"
            className="text-center text-2xl tracking-[0.5em]"
            value={pin}
            onChange={(event) => {
              const valor = event.target.value.replace(/\D/g, '').slice(0, 4)
              setPin(valor)
              setErro(false)
            }}
          />
          {erro && (
            <p className="text-sm text-destructive">
              PIN incorreto ou incompleto. Tente novamente.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={resetarEfechar}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
