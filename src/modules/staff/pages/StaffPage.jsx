import { useState, useEffect } from 'react'
import {
  Users, UserPlus, Search, Edit, Trash2, X, Shield, Phone, Mail,
  MapPin, Send, Key, FileText, Fingerprint, MessageCircle, ClipboardList
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
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'log'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedStaffLogFilter, setSelectedStaffLogFilter] = useState('ALL')

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

  // KPI Calculations
  const activeCount = staff.filter(s => s.status === 'Active').length
  const whatsappApisCount = staff.filter(s => s.whatsapp).length
  const telegramApisCount = staff.filter(s => s.telegram).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Registry & Profiles</h1>
          <p className="text-sm text-slate-500">Manage employee personal records, API integrations, usernames, and passcode credentials</p>
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp API Integrations</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{whatsappApisCount}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Configured notification links</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telegram API Connections</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{telegramApisCount}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Active Telegram bots/chats</p>
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
      </div>

      {/* Search & Dynamic Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'profile' ? "Search profiles by name, ID, or phone..." : "Search logs by name, date, or notes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'profile' ? (
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
        ) : (
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
                  {filteredLogs.map((log, index) => (
                    <tr key={`${log.staffId}-${log.date}-${index}`} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">{fmtDate(log.date)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6.5 w-6.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                            {log.staffName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{log.staffName}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-bold leading-none mt-0.5">{log.staffId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">{log.staffRole}</td>
                      <td className="px-5 py-4 text-xs font-mono font-semibold text-slate-700">
                        {log.checkIn} - {log.checkOut}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-800">
                        {log.totalHours} hrs
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border',
                          log.status === 'Present' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          log.status === 'Half Day' && 'bg-amber-50 text-amber-700 border-amber-200',
                          log.status === 'Overtime' && 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          log.status === 'On Leave' && 'bg-rose-50 text-rose-700 border-rose-200'
                        )}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                        {log.notes ? `"${log.notes}"` : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDeleteAttendanceRow(log.staffId, log.date)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                          title="Delete Log Entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                  <select
                    value={attendanceForm.status}
                    onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Overtime">Overtime</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

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
