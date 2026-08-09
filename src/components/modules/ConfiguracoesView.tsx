import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { DatabaseBackup, FileUp, KeyRound, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { baixarArquivo } from '@/lib/download'
import { backupValido, gerarBackup, restaurarBackup } from '@/services/backup'
import { useApp } from '@/contexts/AppContext'

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4)
}

function SecaoSeguranca() {
  const { alterarPin } = useApp()
  const [pinAtual, setPinAtual] = useState('')
  const [pinNovo, setPinNovo] = useState('')
  const [pinConfirmacao, setPinConfirmacao] = useState('')

  function limparCampos() {
    setPinAtual('')
    setPinNovo('')
    setPinConfirmacao('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (pinAtual.length !== 4 || pinNovo.length !== 4 || pinConfirmacao.length !== 4) {
      toast.error('Preencha os 3 campos com 4 dígitos cada.')
      return
    }

    if (pinNovo !== pinConfirmacao) {
      toast.error('O novo PIN e a confirmação não coincidem.')
      return
    }

    const sucesso = alterarPin(pinAtual, pinNovo)
    if (!sucesso) {
      toast.error('PIN atual incorreto.')
      return
    }

    toast.success('PIN alterado com sucesso!')
    limparCampos()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Segurança e Acesso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          O PIN de 4 dígitos protege a troca para o perfil Admin, com acesso aos relatórios e
          finanças.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="pin-atual">PIN atual</Label>
            <Input
              id="pin-atual"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              className="text-center tracking-[0.4em]"
              value={pinAtual}
              onChange={(e) => setPinAtual(apenasDigitos(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin-novo">Novo PIN</Label>
            <Input
              id="pin-novo"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              className="text-center tracking-[0.4em]"
              value={pinNovo}
              onChange={(e) => setPinNovo(apenasDigitos(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin-confirmacao">Confirmar novo PIN</Label>
            <Input
              id="pin-confirmacao"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              className="text-center tracking-[0.4em]"
              value={pinConfirmacao}
              onChange={(e) => setPinConfirmacao(apenasDigitos(e.target.value))}
            />
          </div>
          <Button type="submit" className="sm:col-span-3 sm:w-fit">
            Alterar PIN
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ConfiguracoesView() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [restaurando, setRestaurando] = useState(false)

  async function fazerBackup() {
    const backup = await gerarBackup()
    const dataArquivo = new Date().toISOString().slice(0, 10)
    baixarArquivo(
      JSON.stringify(backup, null, 2),
      `backup-sinho-${dataArquivo}.json`,
      'application/json',
    )
    toast.success('Backup gerado com sucesso!')
  }

  function selecionarArquivoRestauracao() {
    inputRef.current?.click()
  }

  async function restaurarArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return

    const confirmou = window.confirm(
      'Restaurar um backup substitui todos os dados atuais do app neste dispositivo. Deseja continuar?',
    )
    if (!confirmou) return

    setRestaurando(true)
    try {
      const texto = await arquivo.text()
      const conteudo: unknown = JSON.parse(texto)
      if (!backupValido(conteudo)) {
        toast.error('Arquivo de backup inválido.')
        return
      }
      await restaurarBackup(conteudo)
      toast.success('Backup restaurado! Recarregando o app...')
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      toast.error('Não foi possível ler o arquivo de backup.')
    } finally {
      setRestaurando(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Em breve: gestão de funcionários, estoque e preferências do app.
        </CardContent>
      </Card>

      <SecaoSeguranca />

      <Card>
        <CardHeader>
          <CardTitle>Backup e Restauração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Os dados do App Sinho ficam salvos apenas neste dispositivo. Faça backup regularmente
            para não perder informações.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fazerBackup}>
              <DatabaseBackup className="size-4" />
              Fazer Backup (Download)
            </Button>
            <Button variant="outline" onClick={selecionarArquivoRestauracao} disabled={restaurando}>
              <FileUp className="size-4" />
              {restaurando ? 'Restaurando...' : 'Restaurar Backup'}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={restaurarArquivo}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
