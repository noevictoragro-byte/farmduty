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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useRepoData } from '@/hooks/useRepoData'
import { funcionariosRepo, propriedadesRepo } from '@/services/repositories'
import type { Funcionario, TipoContrato } from '@/types'
import { TIPO_CONTRATO_LABELS } from '../constants'

interface ColaboradorFormDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  colaborador?: Funcionario
  onSalvar: () => void
}

const TODOS_TIPOS_CONTRATO = Object.keys(TIPO_CONTRATO_LABELS) as TipoContrato[]
const SEM_PROPRIEDADE = '__nenhuma__'

export function ColaboradorFormDialog({
  aberto,
  onOpenChange,
  colaborador,
  onSalvar,
}: ColaboradorFormDialogProps) {
  const { dados: propriedades } = useRepoData(propriedadesRepo)

  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cargo, setCargo] = useState('')
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('MENSALISTA')
  const [valorDiariaOuSalario, setValorDiariaOuSalario] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [dataAdmissao, setDataAdmissao] = useState('')
  const [propriedadeId, setPropriedadeId] = useState(SEM_PROPRIEDADE)
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome(colaborador?.nome ?? '')
    setCpf(colaborador?.cpf ?? '')
    setTelefone(colaborador?.telefone ?? '')
    setDataNascimento(colaborador?.dataNascimento?.slice(0, 10) ?? '')
    setEndereco(colaborador?.endereco ?? '')
    setCargo(colaborador?.cargo ?? '')
    setTipoContrato(colaborador?.tipoContrato ?? 'MENSALISTA')
    setValorDiariaOuSalario(colaborador ? String(colaborador.valorDiariaOuSalario) : '')
    setChavePix(colaborador?.chavePix ?? '')
    setDataAdmissao(
      colaborador?.dataAdmissao?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    )
    setPropriedadeId(colaborador?.propriedadeId ?? SEM_PROPRIEDADE)
    setAtivo(colaborador?.ativo ?? true)
  }, [aberto, colaborador])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const valor = Number(valorDiariaOuSalario)

    if (!nome || !cpf || !cargo || valor <= 0 || !dataAdmissao) {
      toast.error('Preencha nome, CPF, cargo, valor e data de admissão.')
      return
    }

    setSalvando(true)

    const dadosBase = {
      nome,
      cpf,
      telefone: telefone || undefined,
      dataNascimento: dataNascimento || undefined,
      endereco: endereco || undefined,
      cargo,
      tipoContrato,
      valorDiariaOuSalario: valor,
      chavePix: chavePix || undefined,
      dataAdmissao,
      propriedadeId: propriedadeId === SEM_PROPRIEDADE ? undefined : propriedadeId,
      ativo,
    }

    if (colaborador) {
      await funcionariosRepo.update(colaborador.id, dadosBase)
      toast.success('Colaborador atualizado!')
    } else {
      const novo: Funcionario = { id: crypto.randomUUID(), ...dadosBase }
      await funcionariosRepo.create(novo)
      toast.success('Colaborador cadastrado!')
    }

    setSalvando(false)
    onSalvar()
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="colab-nome">Nome completo</Label>
            <Input id="colab-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colab-cpf">CPF</Label>
              <Input
                id="colab-cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colab-telefone">Telefone</Label>
              <Input
                id="colab-telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colab-nascimento">Data de nascimento</Label>
              <Input
                id="colab-nascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colab-admissao">Data de admissão</Label>
              <Input
                id="colab-admissao"
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colab-endereco">Endereço</Label>
            <Input
              id="colab-endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colab-cargo">Cargo</Label>
              <Input
                id="colab-cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Tratorista, Colhedor..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colab-tipo-contrato">Tipo de contrato</Label>
              <Select value={tipoContrato} onValueChange={(v) => setTipoContrato(v as TipoContrato)}>
                <SelectTrigger id="colab-tipo-contrato" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODOS_TIPOS_CONTRATO.map((chave) => (
                    <SelectItem key={chave} value={chave}>
                      {TIPO_CONTRATO_LABELS[chave]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colab-valor">
                {tipoContrato === 'DIARISTA' ? 'Valor da diária (R$)' : 'Salário (R$)'}
              </Label>
              <Input
                id="colab-valor"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={valorDiariaOuSalario}
                onChange={(e) => setValorDiariaOuSalario(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colab-pix">Chave PIX</Label>
              <Input id="colab-pix" value={chavePix} onChange={(e) => setChavePix(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colab-propriedade">Propriedade (locação)</Label>
            <Select value={propriedadeId} onValueChange={setPropriedadeId}>
              <SelectTrigger id="colab-propriedade" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_PROPRIEDADE}>Nenhuma</SelectItem>
                {propriedades.map((propriedade) => (
                  <SelectItem key={propriedade.id} value={propriedade.id}>
                    {propriedade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              className="w-full"
              value={ativo ? 'ATIVO' : 'INATIVO'}
              onValueChange={(v) => v && setAtivo(v === 'ATIVO')}
            >
              <ToggleGroupItem value="ATIVO" className="flex-1">
                Ativo
              </ToggleGroupItem>
              <ToggleGroupItem value="INATIVO" className="flex-1">
                Inativo
              </ToggleGroupItem>
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
