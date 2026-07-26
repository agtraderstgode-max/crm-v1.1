import { useState, useEffect } from 'react'
import {
  Users, TrendingUp, CalendarCheck, Receipt,
  ShoppingCart, Package, ArrowUpRight, ArrowDownRight,
  MapPin, Phone, Clock, FileText, Sparkles, Key,
  LogIn, LogOut, CheckCircle2, AlertCircle, UserCheck
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
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)

  // Staff Punch State
  const [punchMode, setPunchMode] = useState('in') // 'in' | 'out'
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [punchStatusMsg, setPunchStatusMsg] = useState({ type: '', text: '' })
  const [submittingPunch, setSubmittingPunch] = useState(false)

  const loadAllData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/customers').then(res => res.json()).catch(() => []),
      fetch('/api/leads').then(res => res.json()).catch(() => []),
      fetch('/api/orders').then(res => res.json()).catch(() => []),
      fetch('/api/staff').then(res => res.json()).catch(() => [])
    ])
    .then(([customersData, leadsData, ordersData, staffData]) => {
      setCustomers(Array.isArray(customersData) ? customersData : [])
      setLeads(Array.isArray(leadsData) ? leadsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setStaffList(Array.isArray(staffData) ? staffData : [])
      setLoading(false)
    })
    .catch(err => {
      console.error("Error fetching dashboard data:", err)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Handle Staff Punch Submit
  const handlePunchSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStaffId) {
      setPunchStatusMsg({ type: 'error', text: 'Please select a staff member.' })
      return
    }
    if (!passcode) {
      setPunchStatusMsg({ type: 'error', text: 'Please enter passcode PIN.' })
      return
    }

    setSubmittingPunch(true)
    setPunchStatusMsg({ type: '', text: '' })

    const endpoint = punchMode === 'in' ? '/api/staff/punch-in' : '/api/staff/punch-out'
    const autoTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const autoDate = getTodayStr()

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaffId,
          passcode,
          date: autoDate,
          checkIn: autoTime,
          checkOut: autoTime
        })
      })

      const data = await res.json()
      if (res.ok) {
        setPunchStatusMsg({ type: 'success', text: data.message || `Signed ${punchMode === 'in' ? 'in' : 'off'} at ${autoTime}` })
        setPasscode('')
        loadAllData()
      } else {
        setPunchStatusMsg({ type: 'error', text: data.error || 'Incorrect passcode.' })
      }
    } catch (err) {
      console.error(err)
      setPunchStatusMsg({ type: 'error', text: 'Server offline. Please run start_crm.command or npm run dev' })
    } finally {
      setSubmittingPunch(false)
    }
  }

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 text-sm font-medium animate-pulse">
        Loading live CRM metrics...
      </div>
    )
  }

  // --- Calculations ---
  const todayStr = getTodayStr()

  const totalCustomers = customers.length
  const activeLeadsCount = leads.filter(l => l.status !== 'Lost Customer' && l.status !== 'Customer Bought').length
  const followupsToday = leads.filter(l => l.nextDate === todayStr)
  const followupsTodayCount = followupsToday.length
  const overdueFollowups = leads.filter(l => l.nextDate && l.nextDate < todayStr && l.status !== 'Lost Customer' && l.status !== 'Customer Bought')
  const activeFollowupsList = [...followupsToday, ...overdueFollowups].slice(0, 5)

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

  const pendingOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length

  const sortedRecentLeads = [...leads]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5)

  // Currently Signed In Staff Today
  const todaySignedInStaff = staffList.filter(s => {
    const todayLog = (s.attendance || []).find(a => a.date === todayStr)
    return todayLog && todayLog.checkIn && (!todayLog.checkOut || todayLog.checkOut === 'In Progress')
  })

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
      color: 'bg-amber-500',
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
    <div className="space-y-6 pb-12">
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

      {/* 🌟 SHORT, NEAT & SIMPLE STAFF PUNCH BAR 🌟 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Icon & Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Staff Shift Punch</span>
                {todaySignedInStaff.length > 0 && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                    {todaySignedInStaff.length} On-Duty
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => { setPunchMode('in'); setPunchStatusMsg({ type: '', text: '' }); }}
                  className={cn(
                    'text-xs font-bold px-2.5 py-0.5 rounded-md transition-all cursor-pointer',
                    punchMode === 'in'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                  )}
                >
                  Sign-In
                </button>
                <button
                  type="button"
                  onClick={() => { setPunchMode('out'); setPunchStatusMsg({ type: '', text: '' }); }}
                  className={cn(
                    'text-xs font-bold px-2.5 py-0.5 rounded-md transition-all cursor-pointer',
                    punchMode === 'out'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                  )}
                >
                  Sign-Off
                </button>
              </div>
            </div>
          </div>

          {/* Inline Form */}
          <form onSubmit={handlePunchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
              required
            >
              <option value="" disabled>-- Select Staff --</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>

            <div className="relative w-28">
              <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="password"
                placeholder="PIN"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submittingPunch}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                punchMode === 'in' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700',
                submittingPunch && 'opacity-50'
              )}
            >
              {punchMode === 'in' ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
              {punchMode === 'in' ? 'Sign In' : 'Sign Off'}
            </button>
          </form>
        </div>

        {/* Success / Error Toast */}
        {punchStatusMsg.text && (
          <div className={cn(
            'mt-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200',
            punchStatusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          )}>
            {punchStatusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{punchStatusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Bottom 2 panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent Leads */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" /> Recent Leads
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest customer enquiries added to CRM</p>
            </div>
            <a href="/leads" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View all
            </a>
          </div>

          <div className="space-y-1">
            {sortedRecentLeads.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No recent leads found.</p>
            ) : (
              sortedRecentLeads.map((lead) => (
                <RecentLeadRow
                  key={lead.id}
                  name={lead.name}
                  location={lead.location}
                  source={lead.source || 'Walk-in'}
                  date={lead.date}
                />
              ))
            )}
          </div>
        </div>

        {/* Follow-ups Action List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-amber-500" /> Follow-ups Action List
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Leads needing call or showroom visit today</p>
            </div>
            {overdueFollowups.length > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                {overdueFollowups.length} Overdue
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {activeFollowupsList.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No follow-ups due today. All caught up!</p>
            ) : (
              activeFollowupsList.map((lead) => (
                <FollowupDueRow
                  key={lead.id}
                  name={lead.name}
                  phone={lead.phone}
                  dueDate={lead.nextDate}
                  status={lead.status}
                  overdue={lead.nextDate < todayStr}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
