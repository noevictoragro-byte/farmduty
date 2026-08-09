import { db } from './db'

const NOMES_TABELAS = [
  'transacoes',
  'propriedades',
  'talhoes',
  'atividadesAgricolas',
  'veiculos',
  'viagensFrete',
  'manutencoesVeiculo',
  'funcionarios',
  'itensEstoque',
  'periodosFerias',
  'pagamentosAdicionais',
] as const

export interface BackupProjetoSinho {
  versao: number
  geradoEm: string
  dados: Record<string, unknown[]>
}

export async function gerarBackup(): Promise<BackupProjetoSinho> {
  const dados: Record<string, unknown[]> = {}
  for (const nome of NOMES_TABELAS) {
    dados[nome] = await db.table(nome).toArray()
  }
  return { versao: 1, geradoEm: new Date().toISOString(), dados }
}

export function backupValido(valor: unknown): valor is BackupProjetoSinho {
  if (!valor || typeof valor !== 'object') return false
  const candidato = valor as Record<string, unknown>
  return typeof candidato.dados === 'object' && candidato.dados !== null
}

export async function restaurarBackup(backup: BackupProjetoSinho): Promise<void> {
  const tabelas = NOMES_TABELAS.map((nome) => db.table(nome))
  await db.transaction('rw', tabelas, async () => {
    for (const nome of NOMES_TABELAS) {
      const registros = backup.dados[nome]
      if (!Array.isArray(registros)) continue
      const tabela = db.table(nome)
      await tabela.clear()
      if (registros.length > 0) {
        await tabela.bulkAdd(registros)
      }
    }
  })
}
