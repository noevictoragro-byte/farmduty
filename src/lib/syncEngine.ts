import { db } from '@/services/db'
import { supabase } from './supabase'
import { toast } from 'sonner'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'conflict'
export type EntityType = 'propriedades' | 'frota' | 'parceiros' | 'colheitas_fretes' | 'transacoes_financeiras' | 'colaboradores_diarias'

export interface SyncQueueItem {
  id: string
  tenantId: string
  userId: string
  entityType: EntityType
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  entityId: string
  payload: Record<string, unknown>
  timestamp: number
  synced: boolean
  retries: number
}

class SyncEngine {
  private syncStatus: SyncStatus = 'idle'
  private onStatusChange: ((status: SyncStatus) => void)[] = []
  private syncIntervalId: number | null = null
  private lastSyncTimestamp: Record<string, number> = {}

  constructor() {
    this.initializeListeners()
  }

  private initializeListeners() {
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  private handleOnline() {
    if (navigator.onLine) {
      this.setSyncStatus('syncing')
      this.syncPendingChanges()
    }
  }

  private handleOffline() {
    this.setSyncStatus('offline')
  }

  private setSyncStatus(status: SyncStatus) {
    this.syncStatus = status
    this.onStatusChange.forEach((callback) => callback(status))
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.onStatusChange.push(callback)
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus
  }

  async queueChange(
    tenantId: string,
    userId: string,
    entityType: EntityType,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    entityId: string,
    payload: Record<string, unknown>,
  ) {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      tenantId,
      userId,
      entityType,
      operation,
      entityId,
      payload,
      timestamp: Date.now(),
      synced: false,
      retries: 0,
    }

    await db.sync_queue.add(item)

    if (navigator.onLine) {
      this.syncPendingChanges()
    }
  }

  async syncPendingChanges() {
    if (this.syncStatus === 'syncing') return

    this.setSyncStatus('syncing')

    try {
      const pendingChanges = await db.sync_queue.where('synced').equals(false).toArray()

      if (pendingChanges.length === 0) {
        this.setSyncStatus('idle')
        return
      }

      const grouped = this.groupByEntity(pendingChanges)

      for (const [entityType, changes] of Object.entries(grouped)) {
        await this.syncEntityChanges(entityType as EntityType, changes as SyncQueueItem[])
      }

      this.setSyncStatus('idle')
    } catch (error) {
      console.error('Sync error:', error)
      this.setSyncStatus('offline')
      toast.error('Erro ao sincronizar. Tentaremos novamente quando a conexão voltar.')
    }
  }

  private groupByEntity(changes: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    return changes.reduce(
      (acc, change) => {
        if (!acc[change.entityType]) {
          acc[change.entityType] = []
        }
        acc[change.entityType].push(change)
        return acc
      },
      {} as Record<string, SyncQueueItem[]>,
    )
  }

  private async syncEntityChanges(entityType: EntityType, changes: SyncQueueItem[]) {
    for (const change of changes) {
      try {
        const cloudData = await this.fetchCloudRecord(entityType, change.entityId, change.tenantId)

        if (cloudData && this.hasConflict(change, cloudData)) {
          const resolved = this.resolveConflict(change, cloudData)
          await this.pushToCloud(entityType, change.entityId, resolved, change.tenantId)
        } else {
          await this.pushToCloud(entityType, change.entityId, change.payload, change.tenantId)
        }

        change.synced = true
        await db.sync_queue.update(change.id, { synced: true })
      } catch (error) {
        change.retries += 1
        if (change.retries > 3) {
          console.error(`Failed to sync ${change.entityId} after 3 retries:`, error)
          await db.sync_queue.update(change.id, { retries: change.retries })
        } else {
          await db.sync_queue.update(change.id, { retries: change.retries })
        }
      }
    }
  }

  private async fetchCloudRecord(
    entityType: EntityType,
    entityId: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from(entityType)
      .select('*')
      .eq('id', entityId)
      .eq('tenant_id', tenantId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  }

  private hasConflict(local: SyncQueueItem, cloud: Record<string, unknown>): boolean {
    const cloudTimestamp = (cloud.updated_at as string) ? new Date(cloud.updated_at as string).getTime() : 0
    return cloudTimestamp > local.timestamp
  }

  private resolveConflict(
    local: SyncQueueItem,
    cloud: Record<string, unknown>,
  ): Record<string, unknown> {
    const cloudTimestamp = (cloud.updated_at as string)
      ? new Date(cloud.updated_at as string).getTime()
      : 0

    if (cloudTimestamp > local.timestamp) {
      return cloud
    }

    return local.payload
  }

  private async pushToCloud(
    entityType: EntityType,
    entityId: string,
    payload: Record<string, unknown>,
    tenantId: string,
  ) {
    const cloudRecord = await this.fetchCloudRecord(entityType, entityId, tenantId)

    if (cloudRecord) {
      const { error } = await supabase
        .from(entityType)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', entityId)
        .eq('tenant_id', tenantId)

      if (error) throw error
    } else {
      const { error } = await supabase.from(entityType).insert({
        id: entityId,
        tenant_id: tenantId,
        ...payload,
      })

      if (error) throw error
    }
  }

  async downloadCloudChanges(tenantId: string, userId: string) {
    try {
      const lastSync = this.lastSyncTimestamp[tenantId] || 0
      const syncTime = Date.now()

      const tables: EntityType[] = [
        'propriedades',
        'frota',
        'parceiros',
        'colheitas_fretes',
        'transacoes_financeiras',
        'colaboradores_diarias',
      ]

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('tenant_id', tenantId)
          .gt('updated_at', new Date(lastSync).toISOString())

        if (error) {
          console.error(`Error fetching ${table}:`, error)
          continue
        }

        if (data && data.length > 0) {
          const repo = (db[table as keyof typeof db] as any) || db[table]
          if (repo) {
            await repo.bulkPut(data)
          }
        }
      }

      this.lastSyncTimestamp[tenantId] = syncTime
    } catch (error) {
      console.error('Error downloading cloud changes:', error)
      throw error
    }
  }

  startAutoSync(intervalSeconds: number = 60) {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
    }

    this.syncIntervalId = window.setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingChanges()
      }
    }, intervalSeconds * 1000)
  }

  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
      this.syncIntervalId = null
    }
  }
}

export const syncEngine = new SyncEngine()
