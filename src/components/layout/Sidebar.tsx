import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

interface SidebarProps {
  activeSection: string
  onSelectSection: (id: string) => void
}

export function Sidebar({ activeSection, onSelectSection }: SidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 md:flex print:hidden">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectSection(id)}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
            activeSection === id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </aside>
  )
}
