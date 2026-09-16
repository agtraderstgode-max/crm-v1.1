import { useState, useEffect } from 'react'
import {
  Users, UserPlus, Search, Edit, Trash2, X, Shield, Phone, Mail,
  MapPin, Send, Key, FileText, Fingerprint, MessageCircle, ClipboardList,
  UserCheck, Clock, Calendar, BarChart3, IndianRupee, Award, TrendingUp, Calculator,
  Gift, Star, DollarSign, ShoppingBag
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

// Get today's local date string (YYYY-MM-DD)
function getTodayStr() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'log' | 'workingData' | 'incentives'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedStaffLogFilter, setSelectedStaffLogFilter] = useState('ALL')

  // Working Data / Payroll Analytics State
  const [periodFilter, setPeriodFilter] = useState('THIS_MONTH') // 'THIS_MONTH' | 'LAST_7_DAYS' | 'LAST_MONTH' | 'ALL_TIME'
  const [dailyRates, setDailyRates] = useState({}) // { [staffId]: number }

  // Incentives State
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false)
  const [incentiveTargetStaff, setIncentiveTargetStaff] = useState(null)
  const [incentiveForm, setIncentiveForm] = useState({
    clientName: '',
    date: getTodayStr(),
    purchaseValue: '',
    incentiveAmount: '',
    notes: ''
  })
  const [selectedIncentiveStaffFilter, setSelectedIncentiveStaffFilter] = useState('ALL')
  const [incentivePeriodFilter, setIncentivePeriodFilter] = useState('THIS_MONTH')

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffForm, setStaffForm] = useState({
    id: '',
    name: '',
    role: 'Showroom Executive / Sales',
    address: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    email: '',
    aadhaar: '',
    username: '',
    passcode: '',
    status: 'Active',
    workingHours: '09:00 AM - 07:00 PM',
    shiftHours: 10,
    workingDays: '6 Days (Mon - Sat)',
    joinDate: getTodayStr()
  })

  // Attendance Logger Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceTarget, setAttendanceTarget] = useState(null)
  const [attendanceForm, setAttendanceForm] = useState({
    date: getTodayStr(),
    checkIn: '09:00 AM',
    checkOut: '07:00 PM',
    totalHours: 10,
    status: 'Present',
    notes: ''
  })

  // Fetch staff
  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      setStaff(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading staff data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  // Add / Edit Staff Actions
  const handleOpenAdd = () => {
    setSelectedStaff(null)
    const nextNum = staff.length + 1
    setStaffForm({
      id: `STF-${String(nextNum).padStart(3, '0')}`,
      name: '',
      role: 'Showroom Executive / Sales',
      address: '',
      phone: '',
      whatsapp: '',
      telegram: '',
      email: '',
      aadhaar: '',
      username: `staff${String(nextNum).padStart(2, '0')}`,
      passcode: '1234',
      status: 'Active',
      workingHours: '09:00 AM - 07:00 PM',
      shiftHours: 10,
      workingDays: '6 Days (Mon - Sat)',
      joinDate: getTodayStr()
    })
    setIsStaffModalOpen(true)
  }

  const handleOpenEdit = (member) => {
    setSelectedStaff(member)
    setStaffForm({
      id: member.id,
      name: member.name || '',
      role: member.role || 'Showroom Executive / Sales',
      address: member.address || '',
      phone: member.phone || '',
      whatsapp: member.whatsapp || '',
      telegram: member.telegram || '',
      email: member.email || '',
      aadhaar: member.aadhaar || '',
      username: member.username || '',
      passcode: member.passcode || '',
      status: member.status || 'Active',
      workingHours: member.workingHours || '09:00 AM - 07:00 PM',
      shiftHours: member.shiftHours || 10,
      workingDays: member.workingDays || '6 Days (Mon - Sat)',
      joinDate: member.joinDate || getTodayStr()
    })
    setIsStaffModalOpen(true)
  }

  const handleSaveStaff = async (e) => {
    e.preventDefault()
    const method = selectedStaff ? 'PUT' : 'POST'
    const url = selectedStaff ? `/api/staff/${staffForm.id}` : '/api/staff'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      })
      if (res.ok) {
        setIsStaffModalOpen(false)
        fetchStaff()
      } else {
        alert('Failed to save staff record.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!confirm(`Are you sure you want to delete staff member ${id}?`)) return
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (res.ok) fetchStaff()
    } catch (err) {
      console.error(err)
    }
  }

  // Attendance Actions
  const handleOpenAttendance = (member) => {
    setAttendanceTarget(member)
    setAttendanceForm({
      date: getTodayStr(),
      checkIn: '09:00 AM',
      checkOut: '07:00 PM',
      totalHours: member.shiftHours || 10,
      status: 'Present',
      notes: ''
    })
    setIsAttendanceModalOpen(true)
  }

  const handleSaveAttendance = async (e) => {
    e.preventDefault()
    if (!attendanceTarget) return
    try {
      const res = await fetch(`/api/staff/${attendanceTarget.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceForm)
      })
      if (res.ok) {
        setIsAttendanceModalOpen(false)
        fetchStaff()
      } else {
        alert('Failed to log attendance.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAttendanceRow = async (memberId, date) => {
    if (!confirm(`Are you sure you want to delete the log entry for ${date}?`)) return
    const member = staff.find(s => s.id === memberId)
    if (!member) return

    const updatedAttendance = (member.attendance || []).filter(a => a.date !== date)
    try {
      const res = await fetch(`/api/staff/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...member, attendance: updatedAttendance })
      })
      if (res.ok) {
        fetchStaff()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtering Profiles
  const filteredProfiles = staff.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
    const term = searchQuery.toLowerCase()
    return (
      s.name?.toLowerCase().includes(term) ||
      s.id?.toLowerCase().includes(term) ||
      s.username?.toLowerCase().includes(term) ||
      s.phone?.includes(term)
    )
  })

  // Aggregate All Logs
  const allLogs = []
  staff.forEach(s => {
    if (s.attendance) {
      s.attendance.forEach(a => {
        allLogs.push({
          ...a,
          staffId: s.id,
          staffName: s.name,
          staffRole: s.role
        })
      })
    }
  })
  allLogs.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Filter Logs
  const filteredLogs = allLogs.filter(log => {
    if (selectedStaffLogFilter !== 'ALL' && log.staffId !== selectedStaffLogFilter) return false
    const term = searchQuery.toLowerCase()
    return (
      log.staffName?.toLowerCase().includes(term) ||
      log.notes?.toLowerCase().includes(term) ||
      log.status?.toLowerCase().includes(term) ||
      log.date?.includes(term)
    )
  })

  // --- WORKING DATA / PAYROLL ANALYTICS CALCULATIONS ---
  const getPeriodAttendance = (attendanceList, period) => {
    if (!attendanceList) return []
    const today = new Date()
    const todayStr = getTodayStr()
    const currentMonthPrefix = todayStr.substring(0, 7) // e.g. "2026-07"

    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthPrefix = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`

    return attendanceList.filter(a => {
      if (!a.date) return false
      if (period === 'THIS_MONTH') {
        return a.date.startsWith(currentMonthPrefix)
      }
      if (period === 'LAST_MONTH') {
        return a.date.startsWith(lastMonthPrefix)
      }
      if (period === 'LAST_7_DAYS') {
        const diffDays = (today - new Date(a.date)) / (1000 * 3600 * 24)
        return diffDays >= 0 && diffDays <= 7
      }
      return true // ALL_TIME
    })
  }

  const staffPayrollAnalytics = staff.map(s => {
    const logs = getPeriodAttendance(s.attendance || [], periodFilter)

    let presentDays = 0
    let halfDays = 0
    let leaveDays = 0
    let totalMins = 0
    let otMins = 0
    const stdShiftMins = (s.shiftHours || 10) * 60 // standard shift in minutes

    logs.forEach(a => {
      const st = a.status || ''
      if (st === 'Half Day') {
        halfDays += 1
      } else if (st === 'On Leave') {
        leaveDays += 1
      } else {
        presentDays += 1
      }

      let dayMins = 0
      if (a.checkIn && a.checkOut && a.checkOut !== 'In Progress' && a.checkIn !== '—') {
        const parseMins = (str) => {
          const match = String(str).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
          if (!match) return 0
          let [_, h, min, p] = match
          h = parseInt(h)
          min = parseInt(min)
          if (p.toUpperCase() === 'PM' && h < 12) h += 12
          if (p.toUpperCase() === 'AM' && h === 12) h = 0
          return h * 60 + min
        }
        const start = parseMins(a.checkIn)
        const end = parseMins(a.checkOut)
        let diff = end - start
        if (diff < 0) diff += 24 * 60
        dayMins = diff
      } else if (a.totalHours) {
        dayMins = a.totalHours * 60
      }

      totalMins += dayMins
      // Any minutes beyond standard shift = overtime
      if (dayMins > stdShiftMins && st !== 'On Leave') {
        otMins += (dayMins - stdShiftMins)
      }
    })

    const totalHours = parseFloat((totalMins / 60).toFixed(1))
    const overtimeHours = parseFloat((otMins / 60).toFixed(1))
    const regularHours = parseFloat((totalHours - overtimeHours).toFixed(1))
    const totalWorkedDays = presentDays + (halfDays * 0.5)
    const avgHoursPerDay = totalWorkedDays > 0 ? parseFloat((totalHours / totalWorkedDays).toFixed(1)) : 0

    const rate = dailyRates[s.id] !== undefined ? dailyRates[s.id] : 600 // Default ₹600/day
    const hourlyRate = parseFloat((rate / (s.shiftHours || 10)).toFixed(1)) // per hour rate
    const otHourlyRate = parseFloat((hourlyRate * 1.5).toFixed(1)) // OT at 1.5x
    const baseSalary = Math.round(totalWorkedDays * rate)
    const overtimePay = Math.round(overtimeHours * otHourlyRate)
    const calculatedSalary = baseSalary + overtimePay

    return {
      ...s,
      presentDays,
      halfDays,
      leaveDays,
      totalWorkedDays,
      totalHours,
      overtimeHours,
      avgHoursPerDay,
      dailyRate: rate,
      overtimePay,
      calculatedSalary
    }
  })

  // Filter analytics search
  const filteredAnalytics = staffPayrollAnalytics.filter(s => {
    const term = searchQuery.toLowerCase()
    return s.name?.toLowerCase().includes(term) || s.id?.toLowerCase().includes(term)
  })

  // Totals for KPI
  const grandTotalHours = staffPayrollAnalytics.reduce((acc, curr) => acc + curr.totalHours, 0)
  const grandTotalDaysWorked = staffPayrollAnalytics.reduce((acc, curr) => acc + curr.totalWorkedDays, 0)
  const grandTotalEstPayroll = staffPayrollAnalytics.reduce((acc, curr) => acc + curr.calculatedSalary, 0)
  const grandTotalOvertimeHrs = staffPayrollAnalytics.reduce((acc, curr) => acc + curr.overtimeHours, 0)
  const grandTotalOvertimePay = staffPayrollAnalytics.reduce((acc, curr) => acc + curr.overtimePay, 0)

  // Handler for daily rate input change
  const handleRateChange = (staffId, value) => {
    setDailyRates(prev => ({ ...prev, [staffId]: parseFloat(value) || 0 }))
  }

  // KPI Calculations
  const activeCount = staff.filter(s => s.status === 'Active').length
  const whatsappApisCount = staff.filter(s => s.whatsapp).length
  const telegramApisCount = staff.filter(s => s.telegram).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Registry & Payroll Analytics</h1>
          <p className="text-sm text-slate-500">Manage employee personal records, log attendance, and compute monthly salary & working hours</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'profile' ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
            >
              <UserPlus className="h-4 w-4" /> Add Staff Member
            </button>
          ) : (
            <select
              onChange={(e) => {
                const s = staff.find(x => x.id === e.target.value)
                if (s) handleOpenAttendance(s)
                e.target.value = ''
              }}
              defaultValue=""
              className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-bold shadow-sm outline-none cursor-pointer hover:bg-blue-700 border-none transition"
            >
              <option value="" disabled>+ Log Attendance</option>
              {staff.map(s => (
                <option key={s.id} value={s.id} className="text-slate-800 font-medium">{s.name} ({s.id})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff Members</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{staff.length}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Registered staff IDs</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Status</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{activeCount}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Active working members</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Work Hours</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{grandTotalHours.toFixed(1)} <span className="text-sm font-semibold text-slate-400">hrs</span></p>
          <p className="mt-2 text-xs font-medium text-slate-400">Logged shift time</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Monthly Payroll</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">₹{grandTotalEstPayroll.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-xs font-medium text-emerald-600 font-semibold">Salary workout preview</p>
        </div>
      </div>

      {/* Tabs Selection Bar */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setActiveTab('profile'); setSearchQuery(''); }}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'profile'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <Users className="h-4.5 w-4.5" /> Staff Profile
        </button>
        <button
          onClick={() => { setActiveTab('log'); setSearchQuery(''); }}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'log'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <ClipboardList className="h-4.5 w-4.5" /> Staff Log
        </button>
        <button
          onClick={() => { setActiveTab('workingData'); setSearchQuery(''); }}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'workingData'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <BarChart3 className="h-4.5 w-4.5" /> Working Data
        </button>
        <button
          onClick={() => { setActiveTab('incentives'); setSearchQuery(''); }}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'incentives'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <Gift className="h-4.5 w-4.5" /> Incentives
        </button>
      </div>

      {/* Search & Dynamic Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'profile' ? "Search profiles by name, ID, or phone..." :
              activeTab === 'log' ? "Search logs by name, date, or notes..." :
              activeTab === 'incentives' ? "Search incentives by client, staff..." :
              "Search working data analytics..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'profile' && (
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {['ALL', 'Active', 'On Leave'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition',
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" /> Filter Staff:
            </span>
            <select
              value={selectedStaffLogFilter}
              onChange={(e) => setSelectedStaffLogFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="ALL">All Staff Members</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'workingData' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Time Period:
            </span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 shadow-sm"
            >
              <option value="THIS_MONTH">This Month (July 2026)</option>
              <option value="LAST_7_DAYS">Last 7 Days (Weekly)</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="ALL_TIME">All Time History</option>
            </select>
          </div>
        )}

        {activeTab === 'incentives' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Gift className="h-3.5 w-3.5" /> Filter:
            </span>
            <select
              value={selectedIncentiveStaffFilter}
              onChange={(e) => setSelectedIncentiveStaffFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="ALL">All Staff</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
            <select
              value={incentivePeriodFilter}
              onChange={(e) => setIncentivePeriodFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="ALL_TIME">All Time</option>
            </select>
            <button
              onClick={() => {
                setIncentiveForm({ clientName: '', date: getTodayStr(), purchaseValue: '', incentiveAmount: '', notes: '' })
                setIncentiveTargetStaff(null)
                setIsIncentiveModalOpen(true)
              }}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
            >
              <Gift className="h-3.5 w-3.5" /> + Add Incentive
            </button>
          </div>
        )}
      </div>

      {/* --- TAB 1 CONTENT: STAFF PROFILE --- */}
      {activeTab === 'profile' && (
        <>
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-sm font-medium animate-pulse">
              Loading staff records...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No profiles found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfiles.map(member => (
                <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base shadow-md shadow-blue-500/20">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                          <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {member.id}
                          </span>
                        </div>
                      </div>

                      <span className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
                        member.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}>
                        {member.status}
                      </span>
                    </div>

                    {/* Basic details */}
                    <div className="mt-4 space-y-2 text-xs">
                      {member.role && (
                        <div className="flex items-center gap-2 text-slate-700 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Shield className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{member.role}</span>
                        </div>
                      )}

                      {member.address && (
                        <div className="flex items-start gap-1.5 text-slate-500 px-1 py-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed line-clamp-2">{member.address}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Num</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" /> {member.phone || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email ID</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="h-3 w-3 text-slate-400" /> {member.email || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar ID</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                            <Fingerprint className="h-3 w-3 text-slate-400" /> {member.aadhaar || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp API</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                            <MessageCircle className="h-3 w-3 text-slate-400" /> {member.whatsapp || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telegram API (Chat ID)</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                          <Send className="h-3 w-3 text-slate-400" /> {member.telegram || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Credentials Info block */}
                    <div className="mt-4 rounded-xl bg-slate-900 text-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-blue-400" /> Unique Username:
                        </span>
                        <span className="font-bold text-white font-mono">{member.username || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Key className="h-3.5 w-3.5 text-emerald-400" /> Passcode (PIN):
                        </span>
                        <span className="font-bold text-white font-mono">{member.passcode || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenAttendance(member)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 text-xs font-bold transition"
                    >
                      <Clock className="h-3.5 w-3.5" /> Log hours
                    </button>
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- TAB 2 CONTENT: STAFF ATTENDANCE LOG --- */}
      {activeTab === 'log' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-sm font-medium animate-pulse">
              Loading log history...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No log entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Staff Member</th>
                    <th className="px-5 py-3.5">Designation</th>
                    <th className="px-5 py-3.5">Timing</th>
                    <th className="px-5 py-3.5 text-center">Hours Worked</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5">Remarks / Notes</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.map((log, index) => {
                    // Date with Day Name
                    let formattedDate = log.date
                    if (log.date && log.date.includes('-')) {
                      const [y, m, d] = log.date.split('-')
                      const dateObj = new Date(y, parseInt(m) - 1, d)
                      formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                    }

                    // Status Logic: If checkOut is 'In Progress', status is 'WORKING', else 'COMPLETED DAY'
                    const isInProgress = !log.checkOut || log.checkOut === 'In Progress'
                    const displayStatus = isInProgress ? 'WORKING' : (log.status === 'Working' || log.status === 'Present' || log.status === 'On-Duty' ? 'COMPLETED DAY' : log.status)

                    // Hours Calculation
                    let hrsDisplay = '0 hrs'
                    if (isInProgress) {
                      hrsDisplay = '0 hrs'
                    } else if (log.checkIn && log.checkOut && log.checkIn !== '—') {
                      const parseMins = (str) => {
                        const match = String(str).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
                        if (!match) return null
                        let [_, h, min, p] = match
                        h = parseInt(h)
                        min = parseInt(min)
                        if (p.toUpperCase() === 'PM' && h < 12) h += 12
                        if (p.toUpperCase() === 'AM' && h === 12) h = 0
                        return h * 60 + min
                      }
                      const start = parseMins(log.checkIn)
                      const end = parseMins(log.checkOut)
                      if (start !== null && end !== null) {
                        let diffMins = end - start
                        if (diffMins < 0) diffMins += 24 * 60
                        hrsDisplay = `${(diffMins / 60).toFixed(1)} hrs`
                      }
                    }

                    return (
                      <tr key={`${log.staffId}-${log.date}-${index}`} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                              {log.staffName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{log.staffName}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold leading-none mt-0.5">{log.staffId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-500 max-w-[160px] truncate">
                          {log.staffRole}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono font-semibold text-slate-700 whitespace-nowrap">
                          {log.checkIn} – {isInProgress ? <span className="text-blue-600 font-bold italic">In Progress</span> : log.checkOut}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-800 whitespace-nowrap">
                          {hrsDisplay}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border',
                            displayStatus === 'WORKING' && 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
                            displayStatus === 'COMPLETED DAY' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            displayStatus === 'Half Day' && 'bg-amber-50 text-amber-700 border-amber-200',
                            displayStatus === 'On Leave' && 'bg-rose-50 text-rose-700 border-rose-200'
                          )}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                          {log.notes ? `"${log.notes}"` : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteAttendanceRow(log.staffId, log.date)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                            title="Delete Log Entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3 CONTENT: WORKING DATA & SALARY ANALYTICS --- */}
      {activeTab === 'workingData' && (
        <div className="space-y-5">
          {/* Top Banner Notice */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/30 mb-2">
                <Calculator className="h-3.5 w-3.5 text-blue-400" /> Salary & Working Hours Workout
              </span>
              <h2 className="text-lg font-bold tracking-tight">Staff Working Data Analysis</h2>
              <p className="text-xs text-slate-300 mt-1">
                Computes total days worked, shift hours, leave count, and estimated monthly salary per employee based on daily rates.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL PAYROLL PREVIEW</span>
                <span className="text-xl font-black text-emerald-400">₹{grandTotalEstPayroll.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL WORK HOURS</span>
                <span className="text-xl font-black text-white">{grandTotalHours.toFixed(1)} hrs</span>
              </div>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-24 text-center text-slate-400 text-sm font-medium animate-pulse">
                Computing working data analytics...
              </div>
            ) : filteredAnalytics.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm">No analytics data available for selected period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Staff Member</th>
                      <th className="px-5 py-3.5 text-center">Full Days</th>
                      <th className="px-5 py-3.5 text-center">Half Days</th>
                      <th className="px-5 py-3.5 text-center">Leave Days</th>
                      <th className="px-5 py-3.5 text-center">Effective Days</th>
                      <th className="px-5 py-3.5 text-center">Total Hours</th>
                      <th className="px-5 py-3.5 text-center">OT Hours</th>
                      <th className="px-5 py-3.5 text-center">Avg Hrs/Day</th>
                      <th className="px-5 py-3.5 text-center">Daily Rate (₹)</th>
                      <th className="px-5 py-3.5 text-center">OT Pay (₹)</th>
                      <th className="px-5 py-3.5 text-right">Est. Salary (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAnalytics.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                              {item.name ? item.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold leading-none mt-0.5">{item.id} · {item.role}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                            {item.presentDays} days
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-bold">
                            {item.halfDays} days
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-bold">
                            {item.leaveDays} days
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center font-black text-slate-900 text-base">
                          {item.totalWorkedDays}
                        </td>

                        <td className="px-5 py-4 text-center font-extrabold text-blue-600">
                          {item.totalHours} hrs
                        </td>

                        <td className="px-5 py-4 text-center">
                          {item.overtimeHours > 0 ? (
                            <span className="inline-flex rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-0.5 text-xs font-black">
                              +{item.overtimeHours} hrs
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-semibold">0 hrs</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold text-slate-600 text-xs">
                          {item.avgHoursPerDay} hrs/day
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 focus-within:border-blue-500 focus-within:bg-white transition">
                            <span className="text-slate-400 text-xs font-bold">₹</span>
                            <input
                              type="number"
                              value={item.dailyRate}
                              onChange={(e) => handleRateChange(item.id, e.target.value)}
                              className="w-16 bg-transparent text-xs font-bold text-slate-800 outline-none text-center"
                              placeholder="600"
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          {item.overtimePay > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 text-xs font-black">
                              +₹{item.overtimePay.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-semibold">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-black text-slate-900 text-base">
                          ₹{item.calculatedSalary.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4 CONTENT: INCENTIVES --- */}
      {activeTab === 'incentives' && (() => {
        // Aggregate all incentives
        const allIncentives = []
        staff.forEach(s => {
          if (s.incentives) {
            s.incentives.forEach(inc => {
              allIncentives.push({ ...inc, staffId: s.id, staffName: s.name, staffRole: s.role })
            })
          }
        })
        allIncentives.sort((a, b) => new Date(b.date) - new Date(a.date))

        // Period filter
        const today = new Date()
        const currentMonthPrefix = getTodayStr().substring(0, 7)
        const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthPrefix = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`

        const periodFiltered = allIncentives.filter(inc => {
          if (incentivePeriodFilter === 'THIS_MONTH') return inc.date?.startsWith(currentMonthPrefix)
          if (incentivePeriodFilter === 'LAST_MONTH') return inc.date?.startsWith(lastMonthPrefix)
          return true
        })

        // Staff filter
        const staffFiltered = periodFiltered.filter(inc => {
          if (selectedIncentiveStaffFilter !== 'ALL' && inc.staffId !== selectedIncentiveStaffFilter) return false
          const term = searchQuery.toLowerCase()
          return inc.clientName?.toLowerCase().includes(term) || inc.staffName?.toLowerCase().includes(term) || inc.notes?.toLowerCase().includes(term)
        })

        // Totals
        const totalPurchaseValue = staffFiltered.reduce((acc, inc) => acc + (inc.purchaseValue || 0), 0)
        const totalIncentiveAmount = staffFiltered.reduce((acc, inc) => acc + (inc.incentiveAmount || 0), 0)

        // Per-staff summary
        const staffSummary = {}
        staffFiltered.forEach(inc => {
          if (!staffSummary[inc.staffId]) staffSummary[inc.staffId] = { name: inc.staffName, clients: 0, totalIncentive: 0, totalPurchase: 0 }
          staffSummary[inc.staffId].clients += 1
          staffSummary[inc.staffId].totalIncentive += (inc.incentiveAmount || 0)
          staffSummary[inc.staffId].totalPurchase += (inc.purchaseValue || 0)
        })

        const handleDeleteIncentive = async (staffId, incId) => {
          if (!confirm('Delete this incentive record?')) return
          try {
            const res = await fetch(`/api/staff/${staffId}/incentives/${incId}`, { method: 'DELETE' })
            if (res.ok) fetchStaff()
          } catch (err) { console.error(err) }
        }

        return (
          <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-md">
                <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShoppingBag className="h-4 w-4" /> Total Orders Attended
                </div>
                <p className="text-3xl font-black">{staffFiltered.length}</p>
                <p className="text-xs text-blue-200 mt-1">Client orders finalized by staff</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <IndianRupee className="h-4 w-4" /> Total Purchase Value
                </div>
                <p className="text-3xl font-black">₹{totalPurchaseValue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-emerald-200 mt-1">Combined order value</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-5 text-white shadow-md">
                <div className="flex items-center gap-2 text-violet-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <Star className="h-4 w-4" /> Total Incentives Earned
                </div>
                <p className="text-3xl font-black">₹{totalIncentiveAmount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-violet-200 mt-1">Staff incentive payout</p>
              </div>
            </div>

            {/* Per-Staff Mini Summary */}
            {Object.keys(staffSummary).length > 0 && (
              <div className="flex flex-wrap gap-3">
                {Object.entries(staffSummary).map(([sid, data]) => (
                  <div key={sid} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {data.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{data.name}</p>
                      <p className="text-[10px] text-slate-400">{data.clients} clients · <span className="text-emerald-600 font-bold">₹{data.totalIncentive.toLocaleString('en-IN')}</span> earned</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Incentives Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {staffFiltered.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm">No incentive records found for selected period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Staff Member</th>
                        <th className="px-5 py-3.5">Client Name</th>
                        <th className="px-5 py-3.5 text-right">Purchase Value (₹)</th>
                        <th className="px-5 py-3.5 text-right">Incentive (₹)</th>
                        <th className="px-5 py-3.5">Notes</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {staffFiltered.map((inc) => {
                        let formattedDate = inc.date
                        if (inc.date && inc.date.includes('-')) {
                          const [y, m, d] = inc.date.split('-')
                          const dateObj = new Date(y, parseInt(m) - 1, d)
                          formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                        }
                        return (
                          <tr key={inc.id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{formattedDate}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                  {inc.staffName?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-xs">{inc.staffName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono font-bold">{inc.staffId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-800">{inc.clientName}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-900">₹{(inc.purchaseValue || 0).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-4 text-right">
                              <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-black">
                                +₹{(inc.incentiveAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500 italic max-w-xs truncate">{inc.notes ? `"${inc.notes}"` : '—'}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleDeleteIncentive(inc.staffId, inc.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td className="px-5 py-3 font-black text-slate-900 text-xs uppercase" colSpan="3">Grand Total</td>
                        <td className="px-5 py-3 text-right font-black text-slate-900">₹{totalPurchaseValue.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-0.5 text-xs font-black">
                            ₹{totalIncentiveAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* MODAL: Add Incentive */}
      {isIncentiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Staff Incentive</h2>
                <p className="text-xs text-slate-500">Record client order & incentive payout</p>
              </div>
              <button onClick={() => setIsIncentiveModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!incentiveTargetStaff) return alert('Please select a staff member.')
                try {
                  const res = await fetch(`/api/staff/${incentiveTargetStaff}/incentives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(incentiveForm)
                  })
                  if (res.ok) {
                    setIsIncentiveModalOpen(false)
                    fetchStaff()
                  } else {
                    const d = await res.json()
                    alert(d.error || 'Failed to add incentive.')
                  }
                } catch (err) { console.error(err) }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Attended By (Staff)</label>
                <select
                  value={incentiveTargetStaff || ''}
                  onChange={(e) => setIncentiveTargetStaff(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500"
                  required
                >
                  <option value="" disabled>Select Staff Member</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Arun Builders"
                    value={incentiveForm.clientName}
                    onChange={e => setIncentiveForm({ ...incentiveForm, clientName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input
                    type="date"
                    value={incentiveForm.date}
                    onChange={e => setIncentiveForm({ ...incentiveForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Purchase Value (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={incentiveForm.purchaseValue}
                    onChange={e => setIncentiveForm({ ...incentiveForm, purchaseValue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Incentive Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={incentiveForm.incentiveAmount}
                    onChange={e => setIncentiveForm({ ...incentiveForm, incentiveAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-emerald-700 outline-none transition focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Notes for this Client</label>
                <input
                  type="text"
                  placeholder="e.g. Full bathroom tile order, premium vitrified"
                  value={incentiveForm.notes}
                  onChange={e => setIncentiveForm({ ...incentiveForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncentiveModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Add Incentive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Staff Member */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Staff ID</label>
                  <input
                    type="text"
                    disabled={!!selectedStaff}
                    value={staffForm.id}
                    onChange={e => setStaffForm({ ...staffForm, id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none font-mono font-bold text-blue-600 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                  <select
                    value={staffForm.status}
                    onChange={e => setStaffForm({ ...staffForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={staffForm.name}
                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Role / Designation</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="Showroom Executive / Sales">Showroom Executive / Sales</option>
                    <option value="Inventory & Stock Manager">Inventory & Stock Manager</option>
                    <option value="Billing & Accounts Executive">Billing & Accounts Executive</option>
                    <option value="Delivery Driver & Logistics">Delivery Driver & Logistics</option>
                    <option value="Showroom Manager">Showroom Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Resident Address</label>
                <textarea
                  placeholder="Enter full residential address..."
                  rows="2"
                  value={staffForm.address}
                  onChange={e => setStaffForm({ ...staffForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={staffForm.phone}
                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email ID</label>
                  <input
                    type="email"
                    placeholder="ramesh@tilescrm.com"
                    value={staffForm.email}
                    onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">WhatsApp API</label>
                  <input
                    type="text"
                    placeholder="WhatsApp phone / api URL"
                    value={staffForm.whatsapp}
                    onChange={e => setStaffForm({ ...staffForm, whatsapp: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Telegram API (Chat ID)</label>
                  <input
                    type="text"
                    placeholder="Telegram chat ID"
                    value={staffForm.telegram}
                    onChange={e => setStaffForm({ ...staffForm, telegram: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Aadhaar Card ID</label>
                <input
                  type="text"
                  placeholder="e.g. 5489 1245 7856"
                  value={staffForm.aadhaar}
                  onChange={e => setStaffForm({ ...staffForm, aadhaar: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Unique Username</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={staffForm.username}
                    onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Passcode (PIN)</label>
                  <input
                    type="text"
                    placeholder="passcode"
                    value={staffForm.passcode}
                    onChange={e => setStaffForm({ ...staffForm, passcode: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Attendance & Working Hours */}
      {isAttendanceModalOpen && attendanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Log Daily Attendance & Hours</h2>
                <p className="text-xs text-blue-600 font-semibold">{attendanceTarget.name} ({attendanceTarget.id})</p>
              </div>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={e => {
                    const st = e.target.value
                    if (st === 'On Leave') {
                      setAttendanceForm({
                        ...attendanceForm,
                        status: st,
                        checkIn: '—',
                        checkOut: '—',
                        totalHours: 0
                      })
                    } else {
                      setAttendanceForm({
                        ...attendanceForm,
                        status: st,
                        checkIn: attendanceForm.checkIn === '—' ? '09:00 AM' : attendanceForm.checkIn,
                        checkOut: attendanceForm.checkOut === '—' ? '07:00 PM' : attendanceForm.checkOut,
                        totalHours: attendanceForm.totalHours || 10
                      })
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Overtime">Overtime</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              {attendanceForm.status === 'On Leave' ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 text-center text-amber-800 text-xs font-bold space-y-1">
                  <p>🌴 Staff On Leave</p>
                  <p className="text-[11px] font-normal text-amber-600">No Check-In or Check-Out shift timing required for leave days.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Check-In Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 09:00 AM"
                        value={attendanceForm.checkIn}
                        onChange={e => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Check-Out Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 07:00 PM"
                        value={attendanceForm.checkOut}
                        onChange={e => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={attendanceForm.totalHours}
                      onChange={e => setAttendanceForm({ ...attendanceForm, totalHours: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Daily Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Completed stock count, attended 5 builder meetings"
                  value={attendanceForm.notes}
                  onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Log Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
