import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Crown,
  Split,
  Trash2,
  UserCog,
  Wallet,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/contexts/AppContext'
import { useRepoData } from '@/hooks/useRepoData'
import { transacoesRepo } from '@/services/repositories'
import type { TipoTransacao } from '@/types'
import { CENTRO_CUSTO_LABELS, estaNoMesAtual, formatarData, formatarMoeda } from './constants'

type FiltroTipo = 'TODOS' | TipoTransacao

const CHAVE_ONBOARDING_OCULTO = 'sinho:onboarding-oculto'

function CardBoasVindas({ onFechar }: { onFechar: () => void }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Bem-vindo ao FarmDuty! 🚜</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              <UserCog className="size-3.5" />
            </span>
            <span>
              Mude o perfil de <strong>Admin</strong> para <strong>Operacional</strong> no topo
              quando a equipe for usar o app.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              <Split className="size-3.5" />
            </span>
            <span>
              Separe as contas usando o filtro <strong>Profissional</strong> vs.{' '}
              <strong>Pessoal</strong> no topo.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              <Zap className="size-3.5" />
            </span>
            <span>
              Faça lançamentos rápidos com 1 toque no menu <strong>Lançamentos</strong>.
            </span>
          </li>
        </ol>
        <Button variant="outline" size="sm" onClick={onFechar}>
          Entendi / Ocultar
        </Button>
      </CardContent>
    </Card>
  )
}

export function DashboardView() {
  const { perfilAtual, escopoFinanceiro } = useApp()
  const { dados: transacoes, recarregar } = useRepoData(transacoesRepo)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS')
  const [onboardingOculto, setOnboardingOculto] = useState(
    () => localStorage.getItem(CHAVE_ONBOARDING_OCULTO) === '1',
  )

  function ocultarOnboarding() {
    localStorage.setItem(CHAVE_ONBOARDING_OCULTO, '1')
    setOnboardingOculto(true)
  }

  const transacoesDoEscopo = useMemo(() => {
    return transacoes.filter((transacao) => {
      const noMes = estaNoMesAtual(transacao.data)
      const noEscopo = escopoFinanceiro === 'TODOS' || transacao.escopo === escopoFinanceiro
      return noMes && noEscopo
    })
  }, [transacoes, escopoFinanceiro])

  const entradas = transacoesDoEscopo
    .filter((t) => t.tipo === 'ENTRADA')
    .reduce((soma, t) => soma + t.valor, 0)

  const saidas = transacoesDoEscopo
    .filter((t) => t.tipo === 'SAIDA')
    .reduce((soma, t) => soma + t.valor, 0)

  const lucroLiquido = entradas - saidas

  const prolabore = transacoesDoEscopo
    .filter((t) => t.centroCusto === 'RETIRADA_PROLABORE')
    .reduce((soma, t) => soma + t.valor, 0)

  const listaFiltrada = [...transacoesDoEscopo]
    .filter((t) => filtroTipo === 'TODOS' || t.tipo === filtroTipo)
    .sort((a, b) => b.data.localeCompare(a.data))

  async function excluirTransacao(id: string) {
    await transacoesRepo.delete(id)
    await recarregar()
    toast.success('Transação excluída.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {perfilAtual === 'ADMIN' && !onboardingOculto && (
        <CardBoasVindas onFechar={ocultarOnboarding} />
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Resumo do mês atual — escopo: {escopoFinanceiro === 'TODOS' ? 'Todos' : escopoFinanceiro}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpCircle className="size-4 text-emerald-600" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatarMoeda(entradas)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownCircle className="size-4 text-destructive" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatarMoeda(saidas)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="size-4" />
              Lucro Líquido Real
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`text-2xl font-semibold ${lucroLiquido < 0 ? 'text-destructive' : ''}`}
          >
            {formatarMoeda(lucroLiquido)}
          </CardContent>
        </Card>
      </div>

      {perfilAtual === 'ADMIN' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Crown className="size-4" />
              Retiradas / Pró-labore do Sinho (mês)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatarMoeda(prolabore)}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Últimas Transações</CardTitle>
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="ENTRADA">Entradas</SelectItem>
              <SelectItem value="SAIDA">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-2">
          {listaFiltrada.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma transação neste filtro.</p>
          )}
          {listaFiltrada.map((transacao) => (
            <div
              key={transacao.id}
              className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{transacao.descricao}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{CENTRO_CUSTO_LABELS[transacao.centroCusto]}</Badge>
                  {transacao.statusPagamento === 'PENDENTE' && (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatarData(transacao.data)} · {transacao.categoria}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={
                    transacao.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-destructive'
                  }
                >
                  {transacao.tipo === 'ENTRADA' ? '+' : '-'}
                  {formatarMoeda(transacao.valor)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => excluirTransacao(transacao.id)}
                  aria-label="Excluir transação"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
