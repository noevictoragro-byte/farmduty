import { useAuth } from '@/contexts/AuthContext'
import { Check, Loader, Cloud, CloudOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { syncEngine, type SyncStatus } from '@/lib/syncEngine'

interface BrandedHeaderProps {
  organizationName?: string
  customLogoUrl?: string
  primaryColor?: string
  showSyncStatus?: boolean
}

/**
 * Header com suporte a White-Label
 * Renderiza logo customizada se disponível, caso contrário usa FarmDuty default
 */
export function BrandedHeader({
  organizationName = 'FarmDuty',
  customLogoUrl,
  primaryColor = '#22c55e',
  showSyncStatus = true,
}: BrandedHeaderProps) {
  const { usuario, logado, abrirModalAuth, fazerLogout } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  useEffect(() => {
    if (logado && showSyncStatus) {
      setSyncStatus(syncEngine.getSyncStatus())
      syncEngine.onSyncStatusChange(setSyncStatus)
    }
  }, [logado, showSyncStatus])

  return (
    <header
      className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b px-4 py-3 backdrop-blur"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: `${primaryColor}20`,
      }}
    >
      {/* Logo Customizada ou FarmDuty Default */}
      <div className="flex items-center gap-2">
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt={organizationName}
            className="h-8 w-auto object-contain"
            onError={(e) => {
              // Fallback se a imagem falhar ao carregar
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            🌾
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-sm" style={{ color: primaryColor }}>
            {organizationName}
          </span>
          <span className="text-xs text-muted-foreground">FarmDuty</span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {/* Sync Status Badge */}
        {logado && showSyncStatus && (
          <Badge
            variant={
              syncStatus === 'syncing'
                ? 'outline'
                : syncStatus === 'offline'
                  ? 'secondary'
                  : syncStatus === 'conflict'
                    ? 'destructive'
                    : 'default'
            }
            className="gap-1"
            style={
              syncStatus === 'idle'
                ? { backgroundColor: primaryColor }
                : undefined
            }
            title={
              syncStatus === 'syncing'
                ? 'Sincronizando mudanças...'
                : syncStatus === 'offline'
                  ? 'Salvo offline'
                  : syncStatus === 'conflict'
                    ? 'Conflito de sincronização'
                    : 'Sincronizado'
            }
          >
            {syncStatus === 'syncing' && (
              <>
                <Loader className="size-3 animate-spin" />
                <span className="hidden sm:inline text-xs">Sincronizando</span>
              </>
            )}
            {syncStatus === 'offline' && (
              <>
                <Cloud className="size-3" />
                <span className="hidden sm:inline text-xs">Offline</span>
              </>
            )}
            {syncStatus === 'conflict' && (
              <>
                <CloudOff className="size-3" />
                <span className="hidden sm:inline text-xs">Conflito</span>
              </>
            )}
            {syncStatus === 'idle' && (
              <>
                <Check className="size-3" />
                <span className="hidden sm:inline text-xs">Sincronizado</span>
              </>
            )}
          </Badge>
        )}

        {/* User Menu */}
        {logado ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground sm:text-sm">
              {usuario?.nome || usuario?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={fazerLogout} title="Logout">
              Sair
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={abrirModalAuth}
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Entrar
          </Button>
        )}
      </div>
    </header>
  )
}
