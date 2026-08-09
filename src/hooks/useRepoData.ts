import { useCallback, useEffect, useState } from 'react'
import type { ComId, Repository } from '@/services/repository'

export function useRepoData<T extends ComId>(repo: Repository<T>) {
  const [dados, setDados] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(() => {
    setCarregando(true)
    return repo.getAll().then((resultado) => {
      setDados(resultado)
      setCarregando(false)
    })
  }, [repo])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, carregando, recarregar }
}
