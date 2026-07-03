import {
  Users, TrendingUp, CalendarCheck, Receipt,
  ShoppingCart, Package, ArrowUpRight, ArrowDownRight,
  MapPin, Phone, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Stat Card Component ---
function StatCard({ title, value, sub, icon: Icon, color, trend, trendUp }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {trend && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium',
            trendUp ? 'text-emerald-600' : 'text-red-500'
          )}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
    </div>
  )
}

// --- Recent Lead Row ---
function LeadRow({ name, location, source, priority, date }) {
  const priorityColor = {
    High:   'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low:    'bg-blue-100 text-blue-700',
  }
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-xs text-slate-400">
            <MapPin className="h-3 w-3" /> {location}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-400">{source}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', priorityColor[priority])}>
          {priority}
        </span>
        <span className="text-xs text-slate-400">{date}</span>
      </div>
    </div>
  )
}

// --- Follow-up Alert Row ---
function FollowupRow({ name, phone, dueDate, status, overdue }) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
      overdue ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'
    )}>
      <Clock className={cn('h-4 w-4 flex-shrink-0', overdue ? 'text-red-500' : 'text-slate-400')} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 text-xs truncate">{name}</p>
        <p className="text-[11px] text-slate-500">{dueDate} · {status}</p>
      </div>
      <a href={`tel:${phone}`}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
        <Phone className="h-3 w-3" />
      </a>
    </div>
  )
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
export function DashboardPage() {
  // Mock data — will be replaced with real API calls in later steps
  const stats = [
    { title: 'Total Customers',   value: '248',  icon: Users,         color: 'bg-blue-600',    trend: '+12 this month',  trendUp: true  },
    { title: 'Active Leads',      value: '34',   icon: TrendingUp,    color: 'bg-violet-600',  trend: '+5 this week',    trendUp: true  },
    { title: 'Follow-ups Today',  value: '8',    icon: CalendarCheck, color: 'bg-amber-500',   sub: 'Due today'                         },
    { title: "Today's Revenue",   value: '₹42,500', icon: Receipt,    color: 'bg-emerald-600', trend: '+18% vs yesterday', trendUp: true },
    { title: 'Pending Orders',    value: '12',   icon: ShoppingCart,  color: 'bg-orange-500',  sub: 'Awaiting dispatch'                 },
    { title: 'Low Stock Alerts',  value: '5',    icon: Package,       color: 'bg-red-500',     sub: 'Products below min'                },
  ]

  const recentLeads = [
    { name: 'Aravind Kumar',    location: 'Gandhipuram',   source: 'Google',       priority: 'High',   date: 'Today'     },
    { name: 'Meena Rajan',      location: 'RS Puram',      source: 'Referral',     priority: 'Medium', date: 'Yesterday' },
    { name: 'Suresh Builder',   location: 'Peelamedu',     source: 'Flex Board',   priority: 'High',   date: 'Yesterday' },
    { name: 'Karthik Homes',    location: 'Saravanampatti',source: 'Social Media', priority: 'Low',    date: '2 days ago'},
    { name: 'Priya Constructions',location:'Singanallur',  source: 'Engineer',     priority: 'Medium', date: '3 days ago'},
  ]

  const followups = [
    { name: 'Aravind Kumar',     phone: '9876543210', dueDate: 'Today 11:00 AM',   status: 'Keep Tracking 2x', overdue: false },
    { name: 'Suresh Builder',    phone: '9845612307', dueDate: 'Today 2:00 PM',    status: 'Keep Tracking 3x', overdue: false },
    { name: 'Rajesh Tiles',      phone: '9003344556', dueDate: 'Yesterday (Missed)',status: 'Keep Tracking 2x', overdue: true  },
    { name: 'Ibrahim Kutty',     phone: '9894002233', dueDate: 'Yesterday (Missed)',status: 'Keep Tracking 4x', overdue: true  },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Bottom 2 panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent Leads */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Recent Leads</h2>
            <a href="/leads" className="text-xs font-medium text-blue-600 hover:underline">View all</a>
          </div>
          <div className="px-5 py-1">
            {recentLeads.map((lead) => (
              <LeadRow key={lead.name} {...lead} />
            ))}
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Follow-ups Due</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
              {followups.filter(f => f.overdue).length} overdue
            </span>
          </div>
          <div className="p-4 space-y-2">
            {followups.map((f) => (
              <FollowupRow key={f.name} {...f} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
