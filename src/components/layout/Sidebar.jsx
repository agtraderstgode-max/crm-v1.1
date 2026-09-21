import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Users,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  FileText,
  ShoppingCart,
  Receipt,
  Package,
  Warehouse,
  Truck,
  Settings,
  ChevronRight,
  Building2,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
  Layers,
  RotateCcw,
  Megaphone,
  Share2,
  ScrollText,
  Contact,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Analysis',     icon: BarChart3,       to: '/analysis' },
      { label: 'Chat Window',  icon: MessageSquare,   to: '/chat' },
      { label: 'Letter Pad',   icon: ScrollText,      to: '/letter-pad' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Enquiry - Lead', icon: TrendingUp,    to: '/leads' },
      { label: 'Follow-ups',     icon: CalendarCheck,  to: '/followups' },
      { label: 'Customers',      icon: Users,          to: '/customers' },
      { label: 'Contacts',       icon: Contact,        to: '/contacts' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Quotations',  icon: FileText,       to: '/quotations' },
      { label: 'Orders',      icon: ShoppingCart,   to: '/orders' },
      { label: 'Payments',    icon: CreditCard,     to: '/payments' },
      { label: 'Billing',     icon: Receipt,        to: '/billing' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products',    icon: Package,        to: '/products' },
      { label: 'Stock',       icon: Warehouse,      to: '/stock' },
      { label: 'Purchase Invoice', icon: FileSpreadsheet, to: '/purchase-invoices' },
      { label: 'Return',      icon: RotateCcw,      to: '/returns' },
      { label: 'Price Category', icon: Layers,       to: '/price-categories' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Marketing', icon: Megaphone, to: '/marketing', badge: 'purpleDot' },
      { label: 'Referral',  icon: Share2,    to: '/referral',  badge: 'purpleDot' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Delivery',      icon: Truck,          to: '/delivery' },
      { label: 'Staff Records', icon: UserCheck,      to: '/staff' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings',   icon: Settings,       to: '/settings' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Tiles CRM</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Showroom Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge === 'purpleDot' && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="h-2.5 w-2.5 rounded-full bg-purple-500 border border-purple-300/50 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <span className="text-[10px] font-medium text-purple-300/90 lowercase">not finished yet</span>
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom user info */}
      <div className="border-t border-slate-700/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Admin</p>
            <p className="text-[11px] text-slate-500 truncate">admin@tilescrm.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
