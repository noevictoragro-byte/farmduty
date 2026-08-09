import type { Table, UpdateSpec } from 'dexie'

export interface ComId {
  id: string
}

export class Repository<T extends ComId> {
  private readonly table: Table<T, string>

  constructor(table: Table<T, string>) {
    this.table = table
  }

  getAll(): Promise<T[]> {
    return this.table.toArray()
  }

  getById(id: string): Promise<T | undefined> {
    return this.table.get(id)
  }

  create(item: T): Promise<string> {
    return this.table.add(item)
  }

  update(id: string, changes: Partial<T>): Promise<number> {
    return this.table.update(id, changes as UpdateSpec<T>)
  }

  delete(id: string): Promise<void> {
    return this.table.delete(id)
  }

  clear(): Promise<void> {
    return this.table.clear()
  }
}
