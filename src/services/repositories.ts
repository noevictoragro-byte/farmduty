import { db } from './db'
import { Repository } from './repository'

export const transacoesRepo = new Repository(db.transacoes)
export const propriedadesRepo = new Repository(db.propriedades)
export const talhoesRepo = new Repository(db.talhoes)
export const atividadesAgricolasRepo = new Repository(db.atividadesAgricolas)
export const veiculosRepo = new Repository(db.veiculos)
export const viagensFreteRepo = new Repository(db.viagensFrete)
export const manutencoesVeiculoRepo = new Repository(db.manutencoesVeiculo)
export const funcionariosRepo = new Repository(db.funcionarios)
export const itensEstoqueRepo = new Repository(db.itensEstoque)
export const periodosFeriasRepo = new Repository(db.periodosFerias)
export const pagamentosAdicionaisRepo = new Repository(db.pagamentosAdicionais)
