import { useState } from 'react'
import { AppProvider } from '@/contexts/AppContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthModal } from '@/components/modals/AuthModal'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DashboardView } from '@/components/modules/DashboardView'
import { LancamentosView } from '@/components/modules/LancamentosView'
import { FrotaView } from '@/components/modules/FrotaView'
import { CampoView } from '@/components/modules/CampoView'
import { ColaboradoresView } from '@/components/modules/ColaboradoresView'
import { RelatoriosView } from '@/components/modules/RelatoriosView'
import { ConfiguracoesView } from '@/components/modules/ConfiguracoesView'
import type { TipoLancamento } from '@/components/modules/constants'

function AppShell() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [abaLancamentoInicial, setAbaLancamentoInicial] = useState<TipoLancamento>('COLHEITA')

  function irParaLancamento(aba: TipoLancamento) {
    setAbaLancamentoInicial(aba)
    setActiveSection('lancamentos')
  }

  return (
    <MainLayout activeSection={activeSection} onSelectSection={setActiveSection}>
      {activeSection === 'dashboard' && <DashboardView />}
      {activeSection === 'lancamentos' && <LancamentosView abaInicial={abaLancamentoInicial} />}
      {activeSection === 'frota' && <FrotaView onNovoLancamento={irParaLancamento} />}
      {activeSection === 'campo' && <CampoView onNovoLancamento={irParaLancamento} />}
      {activeSection === 'colaboradores' && <ColaboradoresView />}
      {activeSection === 'relatorios' && <RelatoriosView />}
      {activeSection === 'configuracoes' && <ConfiguracoesView />}
    </MainLayout>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <OfflineBanner />
          <AppShell />
          <AuthModal />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
