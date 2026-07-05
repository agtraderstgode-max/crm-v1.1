import { useState, useEffect } from 'react'
import {
  Users, TrendingUp, CalendarCheck, Receipt,
  ShoppingCart, Package, ArrowUpRight, ArrowDownRight,
  MapPin, Phone, Clock, FileText, Sparkles
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

// Helper to parse currency string (e.g. "₹4,80,000" -> 480000)
function parseAmount(amtStr) {
  if (!amtStr) return 0
  const clean = String(amtStr).replace(/[^\d]/g, '')
  return parseInt(clean) || 0
}

const PRODUCTS_LOW_STOCK = 1 // Johnson Wood Finish Wall Tile has stock 12

// Get today's local date string (YYYY-MM-DD)
function getTodayStr() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function StatCard({ title, value, sub, icon: Icon, color, bgGradient }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shadow-sm text-white transition-transform group-hover:scale-110 duration-300', color)}>
          <Icon className="h-5.5 w-5.5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 relative z-10">
        <span className="text-[11px] font-medium text-slate-400">{sub}</span>
      </div>
      
      {/* Decorative gradient overlay on hover */}
      <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none', bgGradient)} />
    </div>
  )
}

function RecentLeadRow({ name, location, source, date }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 -mx-4 px-4 rounded-xl transition-all">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 border border-blue-100">
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {location ? (
            <span className="flex items-center gap-0.5 text-xs text-slate-500 font-medium">
              <MapPin className="h-3 w-3 text-slate-400" /> {location}
            </span>
          ) : (
            <span className="text-xs text-slate-300 font-medium">No Location</span>
          )}
          <span className="text-slate-200">·</span>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{source}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className="text-xs font-semibold text-slate-400">{fmtDate(date)}</span>
      </div>
    </div>
  )
}

function FollowupDueRow({ name, phone, dueDate, status, overdue }) {
  return (
    <div className={cn(
      'flex items-center gap-3.5 rounded-xl p-3 border border-slate-100 transition-all duration-300 hover:shadow-sm',
      overdue
        ? 'bg-red-50/60 border-red-100/80 hover:bg-red-50'
        : 'bg-slate-50/60 border-slate-100/80 hover:bg-slate-50'
    )}>
      <Clock className={cn('h-4 w-4 flex-shrink-0', overdue ? 'text-red-500 animate-pulse' : 'text-slate-400')} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-xs truncate">{name}</p>
        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
          {overdue ? <span className="text-red-600 font-bold">Overdue</span> : <span>Due Date</span>}: {fmtDate(dueDate)} · {status}
        </p>
      </div>
      <a
        href={`tel:${phone}`}
        className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all hover:scale-105 shadow-sm"
      >
        <Phone className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

export function DashboardPage() {
  const [customers, setCustomers] = useState([])
  const [leads, setLeads] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/customers').then(res => res.json()).catch(() => []),
      fetch('/api/leads').then(res => res.json()).catch(() => []),
      fetch('/api/orders').then(res => res.json()).catch(() => [])
    ])
    .then(([customersData, leadsData, ordersData]) => {
      setCustomers(customersData)
      setLeads(leadsData)
      setOrders(ordersData)
      setLoading(false)
    })
    .catch(err => {
      console.error("Error fetching dashboard data:", err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 text-sm font-medium">
        Loading live CRM metrics...
      </div>
    )
  }

  // --- Calculations ---
  const todayStr = getTodayStr()

  // 1. Total Customers Count
  const totalCustomers = customers.length

  // 2. Active Leads Count (Not Lost, Not Bought)
  const activeLeadsCount = leads.filter(l => l.status !== 'Lost Customer' && l.status !== 'Customer Bought').length

  // 3. Followups Due Today
  const followupsToday = leads.filter(l => l.nextDate === todayStr)
  const followupsTodayCount = followupsToday.length

  // 4. Overdue Followups
  const overdueFollowups = leads.filter(l => l.nextDate && l.nextDate < todayStr && l.status !== 'Lost Customer' && l.status !== 'Customer Bought')

  // Combine followups due today and overdue for listing
  const activeFollowupsList = [...followupsToday, ...overdueFollowups].slice(0, 5)

  // 5. Today's Collections (Revenue)
  let todayRevenue = 0
  orders.forEach(o => {
    if (o.payments) {
      o.payments.forEach(p => {
        if (p.date === todayStr && p.mode !== 'Write Off') {
          todayRevenue += parseFloat(p.amount) || 0
        }
      })
    }
  })

  // 6. Pending Orders (Any order not delivered/cancelled)
  const pendingOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length

  // 7. Recent Leads list (latest 5)
  const sortedRecentLeads = [...leads]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5)

  const stats = [
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      sub: 'Saved in master records',
      icon: Users,
      color: 'bg-blue-600',
      bgGradient: 'bg-blue-600'
    },
    {
      title: 'Active Leads',
      value: activeLeadsCount.toString(),
      sub: 'Excluding lost / won',
      icon: TrendingUp,
      color: 'bg-violet-600',
      bgGradient: 'bg-violet-600'
    },
    {
      title: 'Follow-ups Today',
      value: followupsTodayCount.toString(),
      sub: `${overdueFollowups.length} follow-ups overdue`,
      icon: CalendarCheck,
      color: 'bg-amber-50',
      bgGradient: 'bg-amber-500'
    },
    {
      title: "Today's Collection",
      value: `₹${Math.round(todayRevenue).toLocaleString('en-IN')}`,
      sub: 'Excluding write-offs',
      icon: Receipt,
      color: 'bg-emerald-600',
      bgGradient: 'bg-emerald-600'
    },
    {
      title: 'Pending Orders',
      value: pendingOrdersCount.toString(),
      sub: 'Awaiting showroom dispatch',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      bgGradient: 'bg-orange-500'
    },
    {
      title: 'Low Stock Alerts',
      value: PRODUCTS_LOW_STOCK.toString(),
      sub: 'Items below min safety limit',
      icon: Package,
      color: 'bg-red-500',
      bgGradient: 'bg-red-500'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Dashboard <Sparkles className="h-5 w-5 text-blue-500" />
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" /> Recent Leads
            </h2>
            <a href="/leads" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-slate-50">
            {sortedRecentLeads.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400 font-medium">No recent leads found.</p>
            ) : (
              sortedRecentLeads.map((lead) => (
                <RecentLeadRow key={lead.id} name={lead.name} location={lead.location} source={lead.source} date={lead.date} />
              ))
            )}
          </div>
        </div>

        {/* Today's & Overdue Follow-ups */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-amber-500" /> Follow-ups Action List
            </h2>
            <span className="rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
              {overdueFollowups.length} Overdue
            </span>
          </div>
          <div className="space-y-3">
            {activeFollowupsList.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400 font-medium">No follow-ups due or overdue.</p>
            ) : (
              activeFollowupsList.map((f) => (
                <FollowupDueRow
                  key={f.id}
                  name={f.name}
                  phone={f.phone}
                  dueDate={f.nextDate}
                  status={f.status}
                  overdue={f.nextDate < todayStr}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
