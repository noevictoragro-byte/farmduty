import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { syncEngine } from '@/lib/syncEngine'

export interface UsuarioLogado {
  id: string
  email: string
  nome?: string
  tenant_id?: string
}

interface AuthContextValue {
  usuario: UsuarioLogado | null
  carregando: boolean
  logado: boolean
  abrirModalAuth: () => void
  fecharModalAuth: () => void
  modalAuthAberto: boolean
  fazerLogout: () => void
  atualizarUsuario: (usuario: UsuarioLogado) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [modalAuthAberto, setModalAuthAberto] = useState(false)

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('sinho:usuario-logado')
    if (usuarioSalvo) {
      try {
        const usuarioLogado = JSON.parse(usuarioSalvo)
        setUsuario(usuarioLogado)
        // Inicia a sincronização automática quando carrega um usuário salvo
        if (usuarioLogado.tenant_id) {
          syncEngine.startAutoSync(30)
          syncEngine.downloadCloudChanges(usuarioLogado.tenant_id, usuarioLogado.id)
        }
      } catch {
        localStorage.removeItem('sinho:usuario-logado')
      }
    }
    setCarregando(false)
  }, [])

  function abrirModalAuth() {
    setModalAuthAberto(true)
  }

  function fecharModalAuth() {
    setModalAuthAberto(false)
  }

  function fazerLogout() {
    setUsuario(null)
    localStorage.removeItem('sinho:usuario-logado')
    localStorage.removeItem('sinho:tenant-id')
    setModalAuthAberto(false)
    syncEngine.stopAutoSync()
  }

  function atualizarUsuario(novoUsuario: UsuarioLogado) {
    setUsuario(novoUsuario)
    localStorage.setItem('sinho:usuario-logado', JSON.stringify(novoUsuario))
    if (novoUsuario.tenant_id) {
      localStorage.setItem('sinho:tenant-id', novoUsuario.tenant_id)
      // Inicia sincronização automática e baixa dados da nuvem
      syncEngine.startAutoSync(30)
      syncEngine.downloadCloudChanges(novoUsuario.tenant_id, novoUsuario.id)
    }
    setModalAuthAberto(false)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        logado: usuario !== null,
        abrirModalAuth,
        fecharModalAuth,
        modalAuthAberto,
        fazerLogout,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
