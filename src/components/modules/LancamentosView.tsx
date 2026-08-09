import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TipoLancamento } from './constants'
import { ColheitaForm } from './lancamentos/ColheitaForm'
import { FreteForm } from './lancamentos/FreteForm'
import { AbastecimentoForm } from './lancamentos/AbastecimentoForm'
import { DespesaReceitaForm } from './lancamentos/DespesaReceitaForm'

interface LancamentosViewProps {
  abaInicial?: TipoLancamento
}

export function LancamentosView({ abaInicial = 'COLHEITA' }: LancamentosViewProps) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Lançamento Rápido</h1>

      <Tabs defaultValue={abaInicial}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="COLHEITA">🍊 Colheita</TabsTrigger>
          <TabsTrigger value="FRETE">🚚 Frete</TabsTrigger>
          <TabsTrigger value="ABASTECIMENTO">⛽ Abast.</TabsTrigger>
          <TabsTrigger value="GERAL">💸 Geral</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent>
            <TabsContent value="COLHEITA">
              <ColheitaForm />
            </TabsContent>
            <TabsContent value="FRETE">
              <FreteForm />
            </TabsContent>
            <TabsContent value="ABASTECIMENTO">
              <AbastecimentoForm />
            </TabsContent>
            <TabsContent value="GERAL">
              <DespesaReceitaForm />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
