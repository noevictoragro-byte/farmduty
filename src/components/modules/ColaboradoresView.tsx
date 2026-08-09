import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRepoData } from '@/hooks/useRepoData'
import {
  funcionariosRepo,
  pagamentosAdicionaisRepo,
  periodosFeriasRepo,
  propriedadesRepo,
} from '@/services/repositories'
import type { Funcionario } from '@/types'
import {
  TIPO_CONTRATO_LABELS,
  TIPO_PAGAMENTO_ADICIONAL_LABELS,
  formatarData,
  formatarMoeda,
} from './constants'
import { ColaboradorFormDialog } from './colaboradores/ColaboradorFormDialog'
import { FeriasFormDialog } from './colaboradores/FeriasFormDialog'
import { PagamentoAdicionalFormDialog } from './colaboradores/PagamentoAdicionalFormDialog'

export function ColaboradoresView() {
  const {
    dados: colaboradores,
    carregando,
    recarregar: recarregarColaboradores,
  } = useRepoData(funcionariosRepo)
  const { dados: propriedades } = useRepoData(propriedadesRepo)
  const { dados: periodosFerias, recarregar: recarregarFerias } = useRepoData(periodosFeriasRepo)
  const { dados: pagamentos, recarregar: recarregarPagamentos } = useRepoData(
    pagamentosAdicionaisRepo,
  )

  const [colaboradorEditando, setColaboradorEditando] = useState<Funcionario | undefined>()
  const [dialogColaboradorAberto, setDialogColaboradorAberto] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [dialogFeriasAberto, setDialogFeriasAberto] = useState(false)
  const [dialogPagamentoAberto, setDialogPagamentoAberto] = useState(false)

  const colaboradorSelecionado = colaboradores.find((c) => c.id === selecionadoId)

  function nomePropriedade(propriedadeId?: string) {
    if (!propriedadeId) return 'Sem locação'
    return propriedades.find((p) => p.id === propriedadeId)?.nome ?? 'Propriedade removida'
  }

  function abrirNovoColaborador() {
    setColaboradorEditando(undefined)
    setDialogColaboradorAberto(true)
  }

  function abrirEdicaoColaborador(colaborador: Funcionario) {
    setColaboradorEditando(colaborador)
    setDialogColaboradorAberto(true)
  }

  async function excluirColaborador(colaborador: Funcionario) {
    await funcionariosRepo.delete(colaborador.id)
    if (selecionadoId === colaborador.id) setSelecionadoId(null)
    await recarregarColaboradores()
    toast.success('Colaborador removido.')
  }

  async function excluirFerias(id: string) {
    await periodosFeriasRepo.delete(id)
    await recarregarFerias()
    toast.success('Período de férias removido.')
  }

  async function excluirPagamento(id: string) {
    await pagamentosAdicionaisRepo.delete(id)
    await recarregarPagamentos()
    toast.success('Pagamento removido.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">
            {colaboradores.length} colaborador(es) cadastrado(s)
          </p>
        </div>
        <Button onClick={abrirNovoColaborador}>
          <Plus className="size-4" />
          Novo Colaborador
        </Button>
      </div>

      <div className="space-y-3">
        {!carregando && colaboradores.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado.</p>
        )}
        {colaboradores.map((colaborador) => (
          <Card
            key={colaborador.id}
            className={
              selecionadoId === colaborador.id ? 'border-primary/50 bg-primary/5' : undefined
            }
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setSelecionadoId(selecionadoId === colaborador.id ? null : colaborador.id)
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{colaborador.nome}</p>
                  {!colaborador.ativo && <Badge variant="secondary">Inativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {colaborador.cargo} · {TIPO_CONTRATO_LABELS[colaborador.tipoContrato]} ·{' '}
                  {nomePropriedade(colaborador.propriedadeId)}
                </p>
                <p className="text-sm font-medium">
                  {formatarMoeda(colaborador.valorDiariaOuSalario)}
                  {colaborador.tipoContrato === 'DIARISTA' ? ' / diária' : ' / mês'}
                </p>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirEdicaoColaborador(colaborador)}
                  aria-label="Editar colaborador"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => excluirColaborador(colaborador)}
                  aria-label="Excluir colaborador"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {colaboradorSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>{colaboradorSelecionado.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="dados">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="ferias">Férias</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">CPF: </span>
                  {colaboradorSelecionado.cpf}
                </p>
                {colaboradorSelecionado.telefone && (
                  <p>
                    <span className="text-muted-foreground">Telefone: </span>
                    {colaboradorSelecionado.telefone}
                  </p>
                )}
                {colaboradorSelecionado.dataNascimento && (
                  <p>
                    <span className="text-muted-foreground">Nascimento: </span>
                    {formatarData(colaboradorSelecionado.dataNascimento)}
                  </p>
                )}
                {colaboradorSelecionado.endereco && (
                  <p>
                    <span className="text-muted-foreground">Endereço: </span>
                    {colaboradorSelecionado.endereco}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Admissão: </span>
                  {formatarData(colaboradorSelecionado.dataAdmissao)}
                </p>
                {colaboradorSelecionado.chavePix && (
                  <p>
                    <span className="text-muted-foreground">Chave PIX: </span>
                    {colaboradorSelecionado.chavePix}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="ferias" className="space-y-3">
                <Button size="sm" variant="outline" onClick={() => setDialogFeriasAberto(true)}>
                  <CalendarDays className="size-4" />
                  Registrar Férias
                </Button>
                {periodosFerias
                  .filter((f) => f.funcionarioId === colaboradorSelecionado.id)
                  .sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))
                  .map((periodo) => (
                    <div
                      key={periodo.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {formatarData(periodo.dataInicio)} — {formatarData(periodo.dataFim)}
                        </p>
                        {periodo.observacoes && (
                          <p className="text-muted-foreground">{periodo.observacoes}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => excluirFerias(periodo.id)}
                        aria-label="Excluir período de férias"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                {periodosFerias.filter((f) => f.funcionarioId === colaboradorSelecionado.id)
                  .length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum período registrado.</p>
                )}
              </TabsContent>

              <TabsContent value="pagamentos" className="space-y-3">
                <Button size="sm" variant="outline" onClick={() => setDialogPagamentoAberto(true)}>
                  <Wallet className="size-4" />
                  Novo Pagamento
                </Button>
                {pagamentos
                  .filter((p) => p.funcionarioId === colaboradorSelecionado.id)
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((pagamento) => (
                    <div
                      key={pagamento.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {TIPO_PAGAMENTO_ADICIONAL_LABELS[pagamento.tipo]}
                          </Badge>
                          {!pagamento.pago && <Badge variant="secondary">Pendente</Badge>}
                        </div>
                        <p className="mt-1 text-muted-foreground">{pagamento.competencia}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatarMoeda(pagamento.valor)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => excluirPagamento(pagamento.id)}
                          aria-label="Excluir pagamento"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {pagamentos.filter((p) => p.funcionarioId === colaboradorSelecionado.id).length ===
                  0 && <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <ColaboradorFormDialog
        aberto={dialogColaboradorAberto}
        onOpenChange={setDialogColaboradorAberto}
        colaborador={colaboradorEditando}
        onSalvar={recarregarColaboradores}
      />

      {colaboradorSelecionado && (
        <>
          <FeriasFormDialog
            aberto={dialogFeriasAberto}
            onOpenChange={setDialogFeriasAberto}
            funcionarioId={colaboradorSelecionado.id}
            onSalvar={recarregarFerias}
          />
          <PagamentoAdicionalFormDialog
            aberto={dialogPagamentoAberto}
            onOpenChange={setDialogPagamentoAberto}
            funcionarioId={colaboradorSelecionado.id}
            nomeFuncionario={colaboradorSelecionado.nome}
            onSalvar={recarregarPagamentos}
          />
        </>
      )}
    </div>
  )
}
