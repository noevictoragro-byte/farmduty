import {
  LayoutDashboard,
  Receipt,
  Truck,
  Wheat,
  Users,
  FileBarChart,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'lancamentos', label: 'Lançamentos', icon: Receipt },
  { id: 'frota', label: 'Frota', icon: Truck },
  { id: 'campo', label: 'Campo', icon: Wheat },
  { id: 'colaboradores', label: 'Colaboradores', icon: Users },
  { id: 'relatorios', label: 'Relatórios', icon: FileBarChart },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
]
