import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function OfflineBanner() {
  const { logado } = useAuth()

  if (logado) return null

  return (
    <div className="border-b bg-blue-50 px-4 py-3 text-center text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2">
        <AlertCircle className="size-4 shrink-0" />
        <span>
          <strong>Modo Demonstração FarmDuty</strong> — Faça login para sincronizar seus dados na
          nuvem.
        </span>
      </div>
    </div>
  )
}
