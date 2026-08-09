import { createContext, useContext, useState, type ReactNode } from 'react'

export type PerfilUsuario = 'ADMIN' | 'OPERACIONAL'
export type EscopoSelecionado = 'TODOS' | 'PROFISSIONAL' | 'PESSOAL'

const CHAVE_PIN_ADMIN = 'sinho:pin-admin'
const PIN_ADMIN_PADRAO = '1234'

function lerPinArmazenado(): string {
  return localStorage.getItem(CHAVE_PIN_ADMIN) ?? PIN_ADMIN_PADRAO
}

interface AppContextValue {
  perfilAtual: PerfilUsuario
  solicitarTrocaPerfil: (perfil: PerfilUsuario) => void
  pinModalAberto: boolean
  confirmarPin: (pinDigitado: string) => boolean
  fecharModalPin: () => void
  validarPin: (pinDigitado: string) => boolean
  alterarPin: (pinAntigo: string, pinNovo: string) => boolean
  escopoFinanceiro: EscopoSelecionado
  setEscopoFinanceiro: (escopo: EscopoSelecionado) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [perfilAtual, setPerfilAtual] = useState<PerfilUsuario>('ADMIN')
  const [escopoFinanceiro, setEscopoFinanceiro] = useState<EscopoSelecionado>('TODOS')
  const [pinAdmin, setPinAdmin] = useState<string>(lerPinArmazenado)
  const [pinModalAberto, setPinModalAberto] = useState(false)

  function solicitarTrocaPerfil(perfil: PerfilUsuario) {
    if (perfil === 'OPERACIONAL') {
      setPerfilAtual('OPERACIONAL')
      return
    }
    setPinModalAberto(true)
  }

  function validarPin(pinDigitado: string): boolean {
    return pinDigitado === pinAdmin
  }

  function confirmarPin(pinDigitado: string): boolean {
    if (!validarPin(pinDigitado)) return false
    setPerfilAtual('ADMIN')
    setPinModalAberto(false)
    return true
  }

  function fecharModalPin() {
    setPinModalAberto(false)
  }

  function alterarPin(pinAntigo: string, pinNovo: string): boolean {
    if (!validarPin(pinAntigo)) return false
    if (!/^\d{4}$/.test(pinNovo)) return false
    localStorage.setItem(CHAVE_PIN_ADMIN, pinNovo)
    setPinAdmin(pinNovo)
    return true
  }

  return (
    <AppContext.Provider
      value={{
        perfilAtual,
        solicitarTrocaPerfil,
        pinModalAberto,
        confirmarPin,
        fecharModalPin,
        validarPin,
        alterarPin,
        escopoFinanceiro,
        setEscopoFinanceiro,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider')
  }
  return context
}
