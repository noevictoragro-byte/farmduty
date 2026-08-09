import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

interface BottomNavProps {
  activeSection: string
  onSelectSection: (id: string) => void
}

export function BottomNav({ activeSection, onSelectSection }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:hidden">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectSection(id)}
          className={cn(
            'flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2 text-[10px] leading-tight font-medium transition-colors',
            activeSection === id ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Icon className="size-5 shrink-0" />
          <span className="w-full truncate text-center">{label}</span>
        </button>
      ))}
    </nav>
  )
}
