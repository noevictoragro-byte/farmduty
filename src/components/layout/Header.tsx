import { Sprout, Wifi, WifiOff, User, LogOut, Cloud, CloudOff, Check, Loader } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useApp, type EscopoSelecionado, type PerfilUsuario } from '@/contexts/AppContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useAuth } from '@/contexts/AuthContext'
import { useBranding } from '@/hooks/useBranding'
import { useEffect, useState } from 'react'
import { syncEngine, type SyncStatus } from '@/lib/syncEngine'

export function Header() {
  const { perfilAtual, solicitarTrocaPerfil, escopoFinanceiro, setEscopoFinanceiro } = useApp()
  const { usuario, logado, abrirModalAuth, fazerLogout } = useAuth()
  const { appName, primaryColor } = useBranding()
  const online = useOnlineStatus()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  useEffect(() => {
    setSyncStatus(syncEngine.getSyncStatus())
    syncEngine.onSyncStatusChange(setSyncStatus)
  }, [])

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur print:hidden">
      <div className="flex items-center gap-2 font-semibold">
        <Sprout className="size-5" style={{ color: primaryColor }} />
        {appName}
      </div>

      <Badge variant={online ? 'default' : 'destructive'} className="gap-1">
        {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
        {online ? 'Online' : 'Offline'}
      </Badge>

      {logado && (
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
              <span className="hidden sm:inline">Sincronizando</span>
            </>
          )}
          {syncStatus === 'offline' && (
            <>
              <Cloud className="size-3" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
          {syncStatus === 'conflict' && (
            <>
              <CloudOff className="size-3" />
              <span className="hidden sm:inline">Conflito</span>
            </>
          )}
          {syncStatus === 'idle' && (
            <>
              <Check className="size-3" />
              <span className="hidden sm:inline">Sincronizado</span>
            </>
          )}
        </Badge>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={perfilAtual}
          onValueChange={(value) => {
            if (value) solicitarTrocaPerfil(value as PerfilUsuario)
          }}
        >
          <ToggleGroupItem value="ADMIN" aria-label="Perfil Admin">
            👑 <span className="hidden sm:inline">Admin</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="OPERACIONAL" aria-label="Perfil Operacional">
            🛠️ <span className="hidden sm:inline">Operacional</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {perfilAtual === 'ADMIN' && (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={escopoFinanceiro}
            onValueChange={(value) => {
              if (value) setEscopoFinanceiro(value as EscopoSelecionado)
            }}
          >
            <ToggleGroupItem value="PROFISSIONAL" aria-label="Escopo Profissional">
              🚜 <span className="hidden sm:inline">Profissional</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="PESSOAL" aria-label="Escopo Pessoal">
              🏠 <span className="hidden sm:inline">Pessoal</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="TODOS" aria-label="Escopo Todos">
              📊 <span className="hidden sm:inline">Todos</span>
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        {logado ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground sm:text-sm">
              {usuario?.nome || usuario?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={fazerLogout}
              title="Fazer logout"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={abrirModalAuth}
            className="gap-2"
          >
            <User className="size-4" />
            <span className="hidden sm:inline">Entrar / Conta</span>
            <span className="inline sm:hidden">Entrar</span>
          </Button>
        )}
      </div>
    </header>
  )
}
