import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRepoData } from '@/hooks/useRepoData'
import { transacoesRepo } from '@/services/repositories'
import { baixarArquivo } from '@/lib/download'
import type { Transacao } from '@/types'
import {
  CENTRO_CUSTO_LABELS,
  FILTRO_CATEGORIA_LABELS,
  PERIODO_LABELS,
  estaNoPeriodo,
  formatarData,
  formatarMoeda,
  type FiltroCategoriaRelatorio,
  type PeriodoRelatorio,
} from './constants'

function passaNoFiltro(transacao: Transacao, filtro: FiltroCategoriaRelatorio): boolean {
  switch (filtro) {
    case 'TODOS':
      return true
    case 'CITRICULTURA':
      return transacao.centroCusto === 'CITRICULTURA'
    case 'BOVINOCULTURA':
      return transacao.centroCusto === 'BOVINOCULTURA'
    case 'GRAOS':
      return transacao.centroCusto === 'PRODUCAO_GRAOS'
    case 'FROTA':
      return transacao.centroCusto === 'FROTA_TRANSPORTE'
    case 'FOLHA':
      return transacao.centroCusto === 'FOLHA_PAGAMENTO'
    case 'PESSOAL':
      return transacao.escopo === 'PESSOAL'
  }
}

function escaparCampoCsv(valor: string): string {
  if (/[",;\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

function gerarCsv(transacoes: Transacao[]): string {
  const cabecalho = [
    'Data',
    'Tipo',
    'Escopo',
    'Centro de Custo',
    'Categoria',
    'Descrição',
    'Status',
    'Valor',
  ]

  const linhas = transacoes.map((t) =>
    [
      formatarData(t.data),
      t.tipo,
      t.escopo,
      CENTRO_CUSTO_LABELS[t.centroCusto],
      t.categoria,
      t.descricao,
      t.statusPagamento,
      t.valor.toFixed(2).replace('.', ','),
    ]
      .map((campo) => escaparCampoCsv(String(campo)))
      .join(';'),
  )

  return ['﻿' + cabecalho.join(';'), ...linhas].join('\n')
}

export function RelatoriosView() {
  const { dados: transacoes } = useRepoData(transacoesRepo)
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('MES_ATUAL')
  const [filtro, setFiltro] = useState<FiltroCategoriaRelatorio>('TODOS')

  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((t) => estaNoPeriodo(t.data, periodo) && passaNoFiltro(t, filtro))
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [transacoes, periodo, filtro])

  const entradas = transacoesFiltradas
    .filter((t) => t.tipo === 'ENTRADA')
    .reduce((soma, t) => soma + t.valor, 0)
  const saidas = transacoesFiltradas
    .filter((t) => t.tipo === 'SAIDA')
    .reduce((soma, t) => soma + t.valor, 0)
  const resultado = entradas - saidas
  const margem = entradas > 0 ? (resultado / entradas) * 100 : 0

  function exportarCsv() {
    const csv = gerarCsv(transacoesFiltradas)
    const dataArquivo = new Date().toISOString().slice(0, 10)
    baixarArquivo(csv, `relatorio-sinho-${dataArquivo}.csv`, 'text/csv;charset=utf-8;')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">App Sinho - Relatório Operacional</h1>
        <p className="text-sm text-muted-foreground">
          Período: {PERIODO_LABELS[periodo]} · Filtro: {FILTRO_CATEGORIA_LABELS[filtro]} · Gerado
          em {new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            {transacoesFiltradas.length} transação(ões) no período selecionado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarCsv}>
            <Download className="size-4" />
            Exportar CSV / Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Exportar PDF / Imprimir
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoRelatorio)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIODO_LABELS) as PeriodoRelatorio[]).map((chave) => (
              <SelectItem key={chave} value={chave}>
                {PERIODO_LABELS[chave]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroCategoriaRelatorio)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FILTRO_CATEGORIA_LABELS) as FiltroCategoriaRelatorio[]).map((chave) => (
              <SelectItem key={chave} value={chave}>
                {FILTRO_CATEGORIA_LABELS[chave]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">Entradas</td>
                <td className="py-2 text-right font-medium text-emerald-600">
                  {formatarMoeda(entradas)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">Saídas</td>
                <td className="py-2 text-right font-medium text-destructive">
                  {formatarMoeda(saidas)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">Resultado Líquido</td>
                <td
                  className={`py-2 text-right font-semibold ${resultado < 0 ? 'text-destructive' : ''}`}
                >
                  {formatarMoeda(resultado)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-muted-foreground">Margem</td>
                <td className="py-2 text-right font-semibold">{margem.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Transações</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {transacoesFiltradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação neste período/filtro.</p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Data</th>
                  <th className="py-2 pr-2 font-medium">Descrição</th>
                  <th className="py-2 pr-2 font-medium">Centro de Custo</th>
                  <th className="py-2 pr-2 font-medium">Escopo</th>
                  <th className="py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 whitespace-nowrap text-muted-foreground">
                      {formatarData(t.data)}
                    </td>
                    <td className="max-w-56 truncate py-2 pr-2">{t.descricao}</td>
                    <td className="py-2 pr-2 whitespace-nowrap text-muted-foreground">
                      {CENTRO_CUSTO_LABELS[t.centroCusto]}
                    </td>
                    <td className="py-2 pr-2 whitespace-nowrap text-muted-foreground">
                      {t.escopo}
                    </td>
                    <td
                      className={`py-2 text-right whitespace-nowrap font-medium ${
                        t.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {t.tipo === 'ENTRADA' ? '+' : '-'}
                      {formatarMoeda(t.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
