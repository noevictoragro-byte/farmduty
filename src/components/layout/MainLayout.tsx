import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { PinModal } from '@/components/modals/PinModal'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface MainLayoutProps {
  activeSection: string
  onSelectSection: (id: string) => void
  children: ReactNode
}

export function MainLayout({ activeSection, onSelectSection, children }: MainLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeSection={activeSection} onSelectSection={onSelectSection} />
        <main className="min-w-0 flex-1 p-4 pb-24 md:pb-4">{children}</main>
      </div>
      <BottomNav activeSection={activeSection} onSelectSection={onSelectSection} />
      <PinModal />
      <Toaster />
    </div>
  )
}
