import { useState, useEffect, useMemo } from 'react'
import {
  CalendarCheck, Calendar, Phone, Clock, AlertCircle, MessageSquare,
  Send, CheckCircle, X, ChevronRight, User, History, CheckCheck,
  Search, Filter, RotateCcw, CalendarDays, ArrowRight
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'
import { DEFAULT_STAFF_LIST, resolveStaffName } from '../../leads/pages/LeadsPage'

export function getLocalYMD(date = new Date()) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLogDate(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    const [, d, m, y] = slashMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) {
    return getLocalYMD(dt)
  }
  return ''
}

function formatHistoryTimestamp(timestamp = '', logDate = '', todayYMD = '', yesterdayYMD = '') {
  let timeStr = ''
  if (timestamp.includes(',')) {
    timeStr = timestamp.split(',')[1]?.trim() || ''
  }

  if (logDate === todayYMD) {
    return timeStr ? `Today at ${timeStr}` : 'Today'
  }
  if (logDate === yesterdayYMD) {
    return timeStr ? `Yesterday at ${timeStr}` : 'Yesterday'
  }
  if (logDate) {
    const [y, m, d] = logDate.split('-').map(Number)
    const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    return timeStr ? `${formattedDate}, ${timeStr}` : formattedDate
  }
  return timestamp || 'Completed'
}

const OUTCOME_STYLES = {
  'Keep Tracking': 'bg-amber-50 text-amber-700 border-amber-200',
  'Keep Tracking 2x': 'bg-amber-50 text-amber-700 border-amber-200',
  'Keep Tracking 3x': 'bg-amber-50 text-amber-700 border-amber-200',
  'Keep Tracking 4x': 'bg-purple-50 text-purple-700 border-purple-200',
  'Customer Bought': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Lost Customer': 'bg-red-50 text-red-700 border-red-200',
  'No Answer': 'bg-rose-50 text-rose-700 border-rose-200',
}

export function FollowupsPage() {
  const [leads, setLeads] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Navigation tab: 'agenda' (Today's Follow-up Agenda) | 'history' (Completed Follow-up History)
  const [activeMainTab, setActiveMainTab] = useState('agenda')

  // History Filter State
  const [historyPeriod, setHistoryPeriod] = useState('today') // 'today' | 'yesterday' | 'week' | 'all'
  const [historySearch, setHistorySearch] = useState('')
  const [historyStaffFilter, setHistoryStaffFilter] = useState('All Staff')
  const [historyOutcomeFilter, setHistoryOutcomeFilter] = useState('All Outcomes')

  // Drawer Form State
  const [outcome, setOutcome] = useState('') // 'Keep Tracking' | 'Customer Bought' | 'Lost Customer' | 'No Answer'
  const [withinDays, setWithinDays] = useState('3')
  const [customDate, setCustomDate] = useState('')
  const [attendedStaff, setAttendedStaff] = useState('Vanmathi.B')
  const [lostReason, setLostReason] = useState('')
  const [boughtAmt, setBoughtAmt] = useState('')
  const [remarks, setRemarks] = useState('')

  const todayStr = getLocalYMD()
  const todayYMD = todayStr
  const yesterdayYMD = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getLocalYMD(d)
  }, [])
  const sevenDaysAgoYMD = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return getLocalYMD(d)
  }, [])

  useEffect(() => {
    fetchLeads()
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => setStaffMembers(data || []))
      .catch(err => console.warn("Error fetching staff:", err))
  }, [])

  const staffList = useMemo(() => {
    const activeStaff = (staffMembers || [])
      .filter(s => s.status !== 'Inactive')
      .map(s => s.name)
      .filter(Boolean)
    return Array.from(new Set(['Manager', ...activeStaff, 'Vanmathi.B', 'Boopana']))
  }, [staffMembers])

  const fetchLeads = () => {
    setLoading(true)
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching leads:", err)
        setLoading(false)
      })
  }

  // Filter Active Follow-ups (excluding won/lost status)
  const activeLeads = leads.filter(l => l.status !== 'Customer Bought' && l.status !== 'Lost Customer')

  // Group into Overdue & Today
  const overdueLeads = activeLeads.filter(l => {
    if (!l.nextDate) return false
    return l.nextDate < todayStr
  })

  const todayLeads = activeLeads.filter(l => {
    if (!l.nextDate) return false
    return l.nextDate === todayStr
  })

  // Priority sorting helper: High Priority + Immediate stage gets highest score
  const getPriorityScore = (l) => {
    let score = 0
    if (l.priority === 'High') score += 10
    if (l.priority === 'Medium') score += 5
    if (l.stage === 'Immediate' || l.stage === 'Immediate Requirement') score += 10
    if (l.stage === 'Flooring Stage') score += 5
    return score
  }

  const sortedOverdue = [...overdueLeads].sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
  const sortedToday = [...todayLeads].sort((a, b) => getPriorityScore(b) - getPriorityScore(a))

  // Flatten all completed follow-ups from lead history
  const completedFollowups = useMemo(() => {
    const list = []
    leads.forEach(lead => {
      if (Array.isArray(lead.history)) {
        lead.history.forEach((h, idx) => {
          const logDate = h.date || parseLogDate(h.timestamp) || ''
          list.push({
            id: `${lead.id}-hist-${idx}`,
            leadId: lead.id,
            leadName: lead.name,
            leadPhone: lead.phone,
            leadLocation: lead.location,
            leadCustType: lead.custType,
            leadPriority: lead.priority,
            leadDate: lead.date,
            logDate,
            timestamp: h.timestamp || '',
            formattedTime: formatHistoryTimestamp(h.timestamp || '', logDate, todayYMD, yesterdayYMD),
            outcome: h.outcome || lead.status || 'Keep Tracking',
            status: h.status || lead.status,
            remarks: h.remarks || '',
            attendedBy: resolveStaffName(h.attendedBy || lead.attendedBy, staffMembers),
            lostReason: h.lostReason,
            amount: h.amount,
            nextDate: h.nextDate,
            rawLog: h,
            lead
          })
        })
      }
    })

    // Sort descending by logDate and timestamp (newest completed first)
    list.sort((a, b) => {
      if (b.logDate && a.logDate && b.logDate !== a.logDate) {
        return b.logDate.localeCompare(a.logDate)
      }
      return (b.timestamp || '').localeCompare(a.timestamp || '')
    })

    return list
  }, [leads, staffMembers, todayYMD, yesterdayYMD])

  const historyCounts = useMemo(() => {
    return {
      today: completedFollowups.filter(item => item.logDate === todayYMD).length,
      yesterday: completedFollowups.filter(item => item.logDate === yesterdayYMD).length,
      week: completedFollowups.filter(item => item.logDate && item.logDate >= sevenDaysAgoYMD).length,
      all: completedFollowups.length
    }
  }, [completedFollowups, todayYMD, yesterdayYMD, sevenDaysAgoYMD])

  const filteredHistory = useMemo(() => {
    return completedFollowups.filter(item => {
      // Period filter
      if (historyPeriod === 'today' && item.logDate !== todayYMD) return false
      if (historyPeriod === 'yesterday' && item.logDate !== yesterdayYMD) return false
      if (historyPeriod === 'week' && (!item.logDate || item.logDate < sevenDaysAgoYMD)) return false

      // Staff filter
      if (historyStaffFilter !== 'All Staff' && item.attendedBy !== historyStaffFilter) return false

      // Outcome filter
      if (historyOutcomeFilter !== 'All Outcomes' && !item.outcome?.toLowerCase().includes(historyOutcomeFilter.toLowerCase())) return false

      // Search filter
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase()
        const matchesName = item.leadName?.toLowerCase().includes(q)
        const matchesPhone = item.leadPhone?.includes(q)
        const matchesLoc = item.leadLocation?.toLowerCase().includes(q)
        const matchesRemarks = item.remarks?.toLowerCase().includes(q)
        const matchesStaff = item.attendedBy?.toLowerCase().includes(q)
        if (!matchesName && !matchesPhone && !matchesLoc && !matchesRemarks && !matchesStaff) {
          return false
        }
      }

      return true
    })
  }, [completedFollowups, historyPeriod, historyStaffFilter, historyOutcomeFilter, historySearch, todayYMD, yesterdayYMD, sevenDaysAgoYMD])

  const handleDaysChange = (days) => {
    setWithinDays(days)
    if (days !== '' && !isNaN(days)) {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(days, 10))
      setCustomDate(d.toISOString().split('T')[0])
    } else {
      setCustomDate('')
    }
  }

  const handleDateChange = (dateVal) => {
    setCustomDate(dateVal)
    if (dateVal) {
      const [y, m, d] = dateVal.split('-').map(Number)
      const target = new Date(y, m - 1, d)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
      setWithinDays(diff >= 0 ? String(diff) : '0')
    } else {
      setWithinDays('')
    }
  }

  const handleOpenDrawer = (lead) => {
    setSelectedLead(lead)
    setOutcome('')
    const initialDays = '3'
    setWithinDays(initialDays)
    const d = new Date()
    d.setDate(d.getDate() + 3)
    setCustomDate(d.toISOString().split('T')[0])
    setLostReason('')
    setBoughtAmt('')
    setRemarks(lead.remarks || '')   // ← Pre-fill with existing lead remarks
    const initialStaff = resolveStaffName(lead.attendedBy, staffMembers) || (staffList && staffList[1]) || 'Vanmathi.B'
    setAttendedStaff(initialStaff)
    setDrawerOpen(true)
  }

  const handleSaveOutcome = () => {
    if (!selectedLead || !outcome) return

    let finalStatus = selectedLead.status
    let finalNextDate = selectedLead.nextDate
    let finalWithinDays = selectedLead.withinDays
    let finalRemarks = (selectedLead.remarks || '').trim()
    const staff = attendedStaff || resolveStaffName(selectedLead.attendedBy, staffMembers) || 'Vanmathi.B'

    if (remarks && remarks.trim() && remarks.trim() !== finalRemarks) {
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
      const newEntry = `[${dateStr}, ${timeStr} • ${staff} • ${outcome}] ${remarks.trim()}`
      finalRemarks = finalRemarks ? `${finalRemarks}\n\n${newEntry}` : newEntry
    }
    let finalExpectedAmt = selectedLead.expectedAmt

    if (outcome === 'No Answer') {
      // No Answer = treated as Lost Customer (customer unreachable)
      finalStatus = 'Lost Customer'
      finalNextDate = ''
      finalWithinDays = ''
    } 
    else if (outcome === 'Keep Tracking') {
      let days = 3
      if (withinDays !== '' && !isNaN(withinDays)) {
        days = parseInt(withinDays, 10)
      } else if (customDate) {
        const [y, m, d] = customDate.split('-').map(Number)
        const target = new Date(y, m - 1, d)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
        days = diff >= 0 ? diff : 0
      }

      let nextDateVal = customDate
      if (!nextDateVal) {
        const next = new Date()
        next.setDate(next.getDate() + days)
        nextDateVal = next.toISOString().split('T')[0]
      }

      finalNextDate = nextDateVal
      finalWithinDays = String(days)

      // Increment Keep Tracking stages logically
      if (selectedLead.status === 'New Entry') finalStatus = 'Keep Tracking 2x'
      else if (selectedLead.status === 'Keep Tracking 2x') finalStatus = 'Keep Tracking 3x'
      else finalStatus = 'Keep Tracking 4x'
    } 
    else if (outcome === 'Customer Bought') {
      finalStatus = 'Customer Bought'
      finalNextDate = ''
      finalWithinDays = ''
      if (boughtAmt) finalExpectedAmt = `₹${parseFloat(boughtAmt).toLocaleString('en-IN')}`
    } 
    else if (outcome === 'Lost Customer') {
      finalStatus = 'Lost Customer'
      finalNextDate = ''
      finalWithinDays = ''
    }

    // Build timeline log object
    const historyLog = {
      timestamp: new Date().toLocaleString('en-IN'),
      date: getLocalYMD(),
      outcome,
      status: finalStatus,
      remarks: remarks,
      attendedBy: staff,
      lostReason: outcome === 'Lost Customer' ? lostReason : null,
      amount: outcome === 'Customer Bought' ? boughtAmt : null,
      nextDate: finalNextDate
    }

    const updatedHistory = [historyLog, ...(selectedLead.history || [])]

    const updatedLead = {
      ...selectedLead,
      status: finalStatus,
      nextDate: finalNextDate,
      withinDays: finalWithinDays,
      attendedBy: staff,
      expectedAmt: finalExpectedAmt,
      remarks: finalRemarks,
      history: updatedHistory
    }

    // Save update via PUT API
    fetch(`/api/leads/${selectedLead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLead)
    })
      .then(res => res.json())
      .then(() => {
        setDrawerOpen(false)
        fetchLeads() // reload data list
      })
      .catch(err => console.error("Error saving outcome:", err))
  }

  // Calculate days since initial creation
  const getDaysSinceContact = (leadDate) => {
    if (!leadDate) return 0
    const start = new Date(leadDate)
    const current = new Date()
    const diff = Math.round((current - start) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff : 0
  }

  return (
    <div className="space-y-6">
      {/* Header and Main Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {activeMainTab === 'agenda' ? "Today's Follow-up Agenda" : "Follow-up Completed History"}
          </h1>
          <p className="text-sm text-slate-500">
            {activeMainTab === 'agenda'
              ? 'Auto-filtered checklist. Log outcomes, snooze calls, or close sales quickly.'
              : 'Audit trail of completed calls, outcome notes, and staff follow-ups.'}
          </p>
        </div>

        {/* Main Tab Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveMainTab('agenda')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer',
              activeMainTab === 'agenda'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            )}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Today's Agenda</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
              activeMainTab === 'agenda' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
            )}>
              {sortedOverdue.length + sortedToday.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer',
              activeMainTab === 'history'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Follow-up History</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
              activeMainTab === 'history' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
            )}>
              {historyCounts.all}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading follow-ups...</div>
      ) : activeMainTab === 'agenda' ? (
        /* ─── Agenda View (Overdue & Today) ─── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4" /> Missed / Overdue Follow-ups ({sortedOverdue.length})
            </h2>
            {sortedOverdue.length === 0 ? (
              <p className="text-slate-400 text-sm italic py-4 pl-2">No overdue calls. Good job!</p>
            ) : (
              <div className="space-y-3">
                {sortedOverdue.map(l => (
                  <LeadCard key={l.id} lead={l} onAction={() => handleOpenDrawer(l)} daysSince={getDaysSinceContact(l.date)} staffRecords={staffMembers} />
                ))}
              </div>
            )}
          </div>

          {/* Today's Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <CalendarCheck className="h-4 w-4" /> Today's Scheduled Calls ({sortedToday.length})
            </h2>
            {sortedToday.length === 0 ? (
              <p className="text-slate-400 text-sm italic py-4 pl-2">No scheduled calls for today.</p>
            ) : (
              <div className="space-y-3">
                {sortedToday.map(l => (
                  <LeadCard key={l.id} lead={l} onAction={() => handleOpenDrawer(l)} daysSince={getDaysSinceContact(l.date)} staffRecords={staffMembers} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Follow-up History View ─── */
        <div className="space-y-5">
          {/* Sub-tabs: Today's Done / Yesterday's Done / Last 7 Days / All History */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit flex-wrap">
              {[
                { id: 'today', label: "Today's Done", count: historyCounts.today, icon: CheckCheck, activeClass: 'bg-white text-emerald-700 shadow-xs' },
                { id: 'yesterday', label: "Yesterday's Done", count: historyCounts.yesterday, icon: RotateCcw, activeClass: 'bg-white text-blue-700 shadow-xs' },
                { id: 'week', label: 'Last 7 Days', count: historyCounts.week, icon: CalendarDays, activeClass: 'bg-white text-violet-700 shadow-xs' },
                { id: 'all', label: 'All History', count: historyCounts.all, icon: History, activeClass: 'bg-white text-slate-800 shadow-xs' },
              ].map(tab => {
                const Icon = tab.icon
                const isActive = historyPeriod === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryPeriod(tab.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      isActive ? tab.activeClass : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                      isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200 text-slate-600'
                    )}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredHistory.length} completed log{filteredHistory.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 flex-1 min-w-56 shadow-xs">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search customer, phone, notes, location..."
                className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={historyStaffFilter}
              onChange={e => setHistoryStaffFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs outline-none cursor-pointer"
            >
              <option value="All Staff">All Staff</option>
              {staffList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={historyOutcomeFilter}
              onChange={e => setHistoryOutcomeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs outline-none cursor-pointer"
            >
              <option value="All Outcomes">All Outcomes</option>
              <option value="Keep Tracking">Keep Tracking</option>
              <option value="Customer Bought">Customer Bought</option>
              <option value="Lost Customer">Lost Customer</option>
              <option value="No Answer">No Answer</option>
            </select>
          </div>

          {/* History Cards List */}
          {filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {historyPeriod === 'today'
                    ? "No follow-ups logged today yet"
                    : historyPeriod === 'yesterday'
                    ? "No follow-ups logged yesterday"
                    : "No completed follow-ups match filters"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {historyPeriod === 'today'
                    ? "When staff complete calls from Today's Agenda, they will automatically appear here."
                    : "Try switching periods or clearing filters."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {historyCounts.yesterday > 0 && historyPeriod === 'today' && (
                  <button
                    type="button"
                    onClick={() => setHistoryPeriod('yesterday')}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> View Yesterday's Done ({historyCounts.yesterday})
                  </button>
                )}
                {historyCounts.all > 0 && (
                  <button
                    type="button"
                    onClick={() => { setHistoryPeriod('all'); setHistorySearch(''); setHistoryStaffFilter('All Staff'); setHistoryOutcomeFilter('All Outcomes'); }}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" /> View All History ({historyCounts.all})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveMainTab('agenda')}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" /> Go to Today's Agenda ({sortedToday.length})
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredHistory.map(item => (
                <FollowupHistoryCard
                  key={item.id}
                  item={item}
                  onOpenDrawer={handleOpenDrawer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Outcome Drawer */}
      {drawerOpen && selectedLead && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)} />

          {/* Drawer Body */}
          <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">Log Call Outcome</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedLead.name} ({selectedLead.id})</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Phone Quick Dial */}
              <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer Mobile</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedLead.phone}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Customer
                  </a>
                  <a
                    href={`https://wa.me/91${selectedLead.phone}?text=Hi%20${encodeURIComponent(selectedLead.name)},%20this%20is%20AG%20Traders%20Tiruchengode.%20Checking%20in%20regarding%20your%20flooring%20tiles%20enquiry.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Status Outcome Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Call Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Keep Tracking', value: 'Keep Tracking', color: 'border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-600', active: 'bg-amber-500 border-amber-500 text-white shadow-sm' },
                    { label: 'Customer Bought', value: 'Customer Bought', color: 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600', active: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
                    { label: 'Lost Customer', value: 'Lost Customer', color: 'border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-600', active: 'bg-red-500 border-red-500 text-white shadow-sm' },
                    { label: 'No Answer', value: 'No Answer', color: 'border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-500', active: 'bg-red-400 border-red-400 text-white shadow-sm' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOutcome(opt.value)}
                      className={cn(
                        'rounded-xl border py-3 text-sm font-semibold transition-all text-center',
                        outcome === opt.value ? opt.active : opt.color + ' bg-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome Specific Options */}
              {outcome === 'Keep Tracking' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Next Follow-up In
                    </label>
                    <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Auto-syncs Days &amp; Date
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { days: '0', label: 'Today (0d)' },
                      { days: '1', label: 'Tomorrow (1d)' },
                      { days: '2', label: '2 Days' },
                      { days: '3', label: '3 Days' },
                      { days: '5', label: '5 Days' },
                      { days: '7', label: '7 Days' }
                    ].map(p => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => handleDaysChange(p.days)}
                        className={cn(
                          'flex-1 min-w-[70px] rounded-lg border py-2 px-2 text-xs font-semibold transition-all text-center cursor-pointer',
                          withinDays === p.days
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 bg-white'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual Days Input and Date Picker Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Enter Days (0, 1, 2...)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="365"
                          placeholder="e.g. 0, 1, 2"
                          value={withinDays}
                          onChange={e => handleDaysChange(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-12 text-sm text-slate-700 font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          days
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        value={customDate}
                        onChange={e => handleDateChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Live preview */}
                  {customDate && (
                    <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                        <span className="text-xs font-bold text-blue-700">
                          {withinDays !== '' ? withinDays : '?'}d
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          {withinDays === '0'
                            ? 'Follow-up Today'
                            : withinDays === '1'
                            ? 'Follow-up Tomorrow (in 1 day)'
                            : `Follow-up in ${withinDays || '?'} days`}
                        </p>
                        <p className="text-[11px] text-blue-600">
                          {(() => {
                            try {
                              const [y, m, d] = customDate.split('-').map(Number)
                              return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                            } catch {
                              return customDate
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {outcome === 'Customer Bought' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Amount (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 80000"
                    value={boughtAmt}
                    onChange={e => setBoughtAmt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {outcome === 'Lost Customer' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Reason for Lost (Mandatory)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Bought elsewhere',
                      'Rate high',
                      'Design not good',
                      'No response',
                      'Budget mismatch',
                      'Project cancelled'
                    ].map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setLostReason(reason)}
                        className={cn(
                          'rounded-lg border px-2 py-2 text-xs font-medium transition-all text-center',
                          lostReason === reason
                            ? 'bg-red-50 border-red-500 text-red-700 font-semibold'
                            : 'border-slate-200 text-slate-500 hover:border-red-300 bg-white'
                        )}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Call Remarks — always visible, pre-filled from lead */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Notes / Remarks
                  </label>
                  {selectedLead.remarks && (
                    <span className="text-[10px] text-blue-500 font-medium bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                      ← Previous notes pre-loaded
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder="Describe what was discussed with the customer..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>

              {/* Call Attended By Staff */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-violet-600" />
                    Call Attended By Staff
                  </label>
                  {attendedStaff && (
                    <span className="text-xs font-bold text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-0.5 rounded-full">
                      👤 {attendedStaff}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {staffList.map(staff => (
                    <button
                      key={staff}
                      type="button"
                      onClick={() => setAttendedStaff(staff)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer',
                        attendedStaff === staff
                          ? 'bg-violet-600 border-violet-600 text-white shadow-sm ring-2 ring-violet-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700'
                      )}
                    >
                      <span>👤</span>
                      <span>{staff}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Call History Timeline */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Call History Timeline</label>
                {(!selectedLead.history || selectedLead.history.length === 0) ? (
                  <p className="text-slate-400 text-xs italic pl-1">No past logs for this customer.</p>
                ) : (
                  <div className="border-l border-slate-200 pl-4 space-y-4">
                    {selectedLead.history.map((h, i) => (
                      <div key={i} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white" />
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-600">{h.timestamp}</span>
                          <div className="flex items-center gap-1.5">
                            {h.attendedBy && (
                              <span className="font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded px-1.5 py-0.5">
                                👤 {h.attendedBy}
                              </span>
                            )}
                            <span className="font-medium bg-slate-100 rounded px-1.5 py-0.5">{h.outcome}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 italic">"{h.remarks || 'No notes'}"</p>
                        {h.lostReason && <p className="text-[10px] font-bold text-red-500">Reason: {h.lostReason}</p>}
                        {h.amount && <p className="text-[10px] font-bold text-emerald-600">Sales: ₹{parseFloat(h.amount).toLocaleString('en-IN')}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutcome}
                disabled={!outcome || (outcome === 'Lost Customer' && !lostReason)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <CheckCircle className="h-4 w-4" /> Save Outcome
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Reusable Lead Card Component ─────────────────────────────
function LeadCard({ lead, onAction, daysSince, staffRecords = [] }) {
  const priorityStyle = {
    High:   'bg-red-50 border-red-100 text-red-700',
    Medium: 'bg-amber-50 border-amber-100 text-amber-700',
    Low:    'bg-blue-50 border-blue-100 text-blue-700',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 flex-shrink-0">
            {lead.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">{lead.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{lead.location || 'Unknown location'} · <span className="font-semibold text-slate-500">{lead.custType}</span></p>
          </div>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold border ml-1', priorityStyle[lead.priority] || priorityStyle.Medium)}>
            {lead.priority}
          </span>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 pl-1.5 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
            <Clock className="h-3.5 w-3.5" /> Next: {fmtDate(lead.nextDate)}
          </span>
          <span className="bg-slate-100 rounded px-2 py-0.5 font-medium">
            ⏳ {daysSince} days since entry
          </span>
          <span className="bg-slate-100 rounded px-2 py-0.5 text-slate-600 font-semibold">
            {lead.status}
          </span>
          {lead.attendedBy && (
            <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-100 rounded px-2 py-0.5 text-xs font-semibold">
              <span>👤</span>
              <span>{resolveStaffName(lead.attendedBy, staffRecords)}</span>
            </span>
          )}
        </div>

        {lead.remarks && (
          <p className="text-xs text-slate-400 italic pl-1.5 truncate max-w-md">
            Last notes: "{lead.remarks}"
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onAction}
          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap cursor-pointer"
        >
          <Phone className="h-3.5 w-3.5" /> Log Call Outcome
        </button>
      </div>
    </div>
  )
}

// ─── Reusable Follow-up History Card Component ────────────────
function FollowupHistoryCard({ item, onOpenDrawer }) {
  const priorityStyle = {
    High:   'bg-red-50 border-red-100 text-red-700',
    Medium: 'bg-amber-50 border-amber-100 text-amber-700',
    Low:    'bg-blue-50 border-blue-100 text-blue-700',
  }

  const outcomeStyle = OUTCOME_STYLES[item.outcome] || 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all space-y-3.5">
      {/* Top Header: Customer Info & Status / Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex-shrink-0">
            {item.leadName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-800 truncate">{item.leadName}</h3>
              {item.leadPriority && (
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold border', priorityStyle[item.leadPriority] || priorityStyle.Medium)}>
                  {item.leadPriority}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span>📞 {item.leadPhone}</span>
              {item.leadLocation && <span>• 📍 {item.leadLocation}</span>}
              {item.leadCustType && <span>• <span className="font-semibold text-slate-500">{item.leadCustType}</span></span>}
            </p>
          </div>
        </div>

        {/* Right side tags: Outcome + Timestamp */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap', outcomeStyle)}>
            {item.outcome}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md whitespace-nowrap">
            <Clock className="w-3 h-3 text-slate-400" />
            {item.formattedTime}
          </span>
        </div>
      </div>

      {/* Middle: Notes & Follow-up Details */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            Discussion Notes &amp; Outcome
          </span>
          {item.attendedBy && (
            <span className="inline-flex items-center gap-1 font-semibold text-violet-700 bg-violet-100/80 border border-violet-200 px-2 py-0.5 rounded-full text-xs">
              <span>👤 Attended By:</span>
              <span className="font-bold">{item.attendedBy}</span>
            </span>
          )}
        </div>

        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {item.remarks || <span className="italic text-slate-400">No notes recorded for this call.</span>}
        </p>

        {/* Next follow-up or outcome details */}
        {(item.nextDate || item.amount || item.lostReason) && (
          <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 flex-wrap text-xs">
            {item.nextDate && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                Next Scheduled Call: {fmtDate(item.nextDate)}
              </span>
            )}
            {item.amount && (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                💰 Sales Closed: ₹{parseFloat(item.amount).toLocaleString('en-IN')}
              </span>
            )}
            {item.lostReason && (
              <span className="inline-flex items-center gap-1 font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                ❌ Lost Reason: {item.lostReason}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
        <div className="flex items-center gap-2">
          <a
            href={`tel:${item.leadPhone}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Phone className="w-3 h-3 text-blue-600" /> Call
          </a>
          <a
            href={`https://wa.me/91${item.leadPhone}?text=Hi%20${encodeURIComponent(item.leadName)},%20this%20is%20AG%20Traders%20Tiruchengode.%20Checking%20in%20regarding%20your%20flooring%20tiles%20enquiry.`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors shadow-xs"
          >
            <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={() => onOpenDrawer(item.lead)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Log Next Outcome
        </button>
      </div>
    </div>
  )
}
