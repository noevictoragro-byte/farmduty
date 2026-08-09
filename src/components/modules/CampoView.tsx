import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRepoData } from '@/hooks/useRepoData'
import { atividadesAgricolasRepo, propriedadesRepo, talhoesRepo } from '@/services/repositories'
import type { Propriedade, Talhao } from '@/types'
import { TIPO_ATIVIDADE_LABELS, TIPO_ATIVIDADE_PROPRIEDADE_LABELS, formatarData } from './constants'
import type { TipoLancamento } from './constants'
import { PropriedadeFormDialog } from './campo/PropriedadeFormDialog'
import { TalhaoFormDialog } from './campo/TalhaoFormDialog'

interface CampoViewProps {
  onNovoLancamento: (aba: TipoLancamento) => void
}

export function CampoView({ onNovoLancamento }: CampoViewProps) {
  const {
    dados: propriedades,
    carregando: carregandoPropriedades,
    recarregar: recarregarPropriedades,
  } = useRepoData(propriedadesRepo)
  const { dados: talhoes, recarregar: recarregarTalhoes } = useRepoData(talhoesRepo)
  const { dados: atividades } = useRepoData(atividadesAgricolasRepo)

  const [propriedadeEditando, setPropriedadeEditando] = useState<Propriedade | undefined>()
  const [dialogPropriedadeAberto, setDialogPropriedadeAberto] = useState(false)

  const [talhaoEditando, setTalhaoEditando] = useState<Talhao | undefined>()
  const [propriedadeDoTalhao, setPropriedadeDoTalhao] = useState<string>('')
  const [dialogTalhaoAberto, setDialogTalhaoAberto] = useState(false)

  const areaTotal = propriedades.reduce((soma, p) => soma + p.areaHectares, 0)
  const atividadesOrdenadas = [...atividades].sort((a, b) => b.data.localeCompare(a.data))

  function nomeTalhao(talhaoId: string) {
    const talhao = talhoes.find((t) => t.id === talhaoId)
    return talhao?.nome ?? 'Talhão removido'
  }

  function abrirNovaPropriedade() {
    setPropriedadeEditando(undefined)
    setDialogPropriedadeAberto(true)
  }

  function abrirEdicaoPropriedade(propriedade: Propriedade) {
    setPropriedadeEditando(propriedade)
    setDialogPropriedadeAberto(true)
  }

  async function excluirPropriedade(propriedade: Propriedade) {
    const temTalhoes = talhoes.some((t) => t.propriedadeId === propriedade.id)
    if (temTalhoes) {
      toast.error('Remova os talhões desta propriedade antes de excluí-la.')
      return
    }
    await propriedadesRepo.delete(propriedade.id)
    await recarregarPropriedades()
    toast.success('Propriedade excluída.')
  }

  function abrirNovoTalhao(propriedadeId: string) {
    setTalhaoEditando(undefined)
    setPropriedadeDoTalhao(propriedadeId)
    setDialogTalhaoAberto(true)
  }

  function abrirEdicaoTalhao(talhao: Talhao) {
    setTalhaoEditando(talhao)
    setPropriedadeDoTalhao(talhao.propriedadeId)
    setDialogTalhaoAberto(true)
  }

  async function excluirTalhao(talhao: Talhao) {
    await talhoesRepo.delete(talhao.id)
    await recarregarTalhoes()
    toast.success('Talhão excluído.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Citricultura & Campo</h1>
          <p className="text-sm text-muted-foreground">
            {propriedades.length} propriedade(s) — {areaTotal} ha ao todo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={abrirNovaPropriedade}>
            <Plus className="size-4" />
            Nova Propriedade
          </Button>
          <Button onClick={() => onNovoLancamento('COLHEITA')}>
            <Plus className="size-4" />
            Nova Colheita
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propriedades e Talhões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!carregandoPropriedades && propriedades.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma propriedade cadastrada.</p>
          )}
          {propriedades.map((propriedade) => (
            <div key={propriedade.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{propriedade.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {propriedade.areaHectares} ha — {propriedade.localizacao}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(propriedade.tiposAtividade ?? []).map((tipo) => (
                      <Badge key={tipo} variant="outline">
                        {TIPO_ATIVIDADE_PROPRIEDADE_LABELS[tipo]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEdicaoPropriedade(propriedade)}
                    aria-label="Editar propriedade"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => excluirPropriedade(propriedade)}
                    aria-label="Excluir propriedade"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {talhoes
                  .filter((t) => t.propriedadeId === propriedade.id)
                  .map((talhao) => (
                    <span
                      key={talhao.id}
                      className="inline-flex items-center gap-1 rounded-full border bg-secondary py-0.5 pr-1 pl-3"
                    >
                      <button
                        type="button"
                        onClick={() => abrirEdicaoTalhao(talhao)}
                        className="text-xs font-medium text-secondary-foreground"
                      >
                        {talhao.nome} · {talhao.cultura} · {talhao.areaHectares} ha
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        onClick={() => excluirTalhao(talhao)}
                        aria-label="Excluir talhão"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </span>
                  ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => abrirNovoTalhao(propriedade.id)}
                >
                  <Plus className="size-3" />
                  Talhão
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {atividadesOrdenadas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          )}
          {atividadesOrdenadas.map((atividade) => (
            <div
              key={atividade.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div>
                <Badge>{TIPO_ATIVIDADE_LABELS[atividade.tipoAtividade]}</Badge>
                <span className="ml-2 font-medium">{nomeTalhao(atividade.talhaoId)}</span>
                {atividade.observacoes && (
                  <p className="mt-1 text-muted-foreground">{atividade.observacoes}</p>
                )}
              </div>
              <span className="text-muted-foreground">{formatarData(atividade.data)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <PropriedadeFormDialog
        aberto={dialogPropriedadeAberto}
        onOpenChange={setDialogPropriedadeAberto}
        propriedade={propriedadeEditando}
        onSalvar={recarregarPropriedades}
      />

      <TalhaoFormDialog
        aberto={dialogTalhaoAberto}
        onOpenChange={setDialogTalhaoAberto}
        propriedadeId={propriedadeDoTalhao}
        talhao={talhaoEditando}
        onSalvar={recarregarTalhoes}
      />
    </div>
  )
}
