import { useState, useEffect } from 'react'
import { CalendarCheck, Phone, Clock, AlertCircle, MessageSquare, Send, CheckCircle, X, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FollowupsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Drawer Form State
  const [outcome, setOutcome] = useState('') // 'Keep Tracking' | 'Customer Bought' | 'Lost Customer' | 'No Answer'
  const [snoozeDays, setSnoozeDays] = useState('3') // '3' | '5' | '7' | 'custom'
  const [customDate, setCustomDate] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [boughtAmt, setBoughtAmt] = useState('')
  const [remarks, setRemarks] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchLeads()
  }, [])

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

  const handleOpenDrawer = (lead) => {
    setSelectedLead(lead)
    setOutcome('')
    setSnoozeDays('3')
    setCustomDate('')
    setLostReason('')
    setBoughtAmt('')
    setRemarks(lead.remarks || '')   // ← Pre-fill with existing lead remarks
    setDrawerOpen(true)
  }

  const handleSaveOutcome = () => {
    if (!selectedLead || !outcome) return

    let finalStatus = selectedLead.status
    let finalNextDate = selectedLead.nextDate
    let finalWithinDays = selectedLead.withinDays
    let finalRemarks = remarks || 'Outcome logged'
    let finalExpectedAmt = selectedLead.expectedAmt

    const todayDate = new Date()

    if (outcome === 'No Answer') {
      // Auto-snooze by 1 day
      const next = new Date(todayDate)
      next.setDate(todayDate.getDate() + 1)
      finalNextDate = next.toISOString().split('T')[0]
      finalWithinDays = '1'
      finalStatus = 'Keep Tracking 2x' // keep in loop
    } 
    else if (outcome === 'Keep Tracking') {
      let days = 3
      if (snoozeDays === '5') days = 5
      else if (snoozeDays === '7') days = 7
      else if (snoozeDays === 'custom' && customDate) {
        const diffTime = Math.abs(new Date(customDate) - todayDate)
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      const next = new Date(todayDate)
      next.setDate(todayDate.getDate() + days)
      finalNextDate = next.toISOString().split('T')[0]
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
      outcome,
      status: finalStatus,
      remarks: remarks,
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
      <div>
        <h1 className="text-xl font-bold text-slate-800">Today's Follow-up Agenda</h1>
        <p className="text-sm text-slate-500">Auto-filtered checklist. Log outcomes, snooze calls, or close sales quickly.</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading today's agenda...</div>
      ) : (
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
                  <LeadCard key={l.id} lead={l} onAction={() => handleOpenDrawer(l)} daysSince={getDaysSinceContact(l.date)} />
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
                  <LeadCard key={l.id} lead={l} onAction={() => handleOpenDrawer(l)} daysSince={getDaysSinceContact(l.date)} />
                ))}
              </div>
            )}
          </div>

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
                    { label: 'No Answer', value: 'No Answer', color: 'border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600', active: 'bg-blue-600 border-blue-600 text-white shadow-sm' }
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Next Follow-up In</label>
                  <div className="flex gap-2">
                    {['3', '5', '7', 'custom'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSnoozeDays(day)}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all text-center capitalize',
                          snoozeDays === day
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                        )}
                      >
                        {day === 'custom' ? 'Custom Date' : `${day} Days`}
                      </button>
                    ))}
                  </div>

                  {snoozeDays === 'custom' && (
                    <input
                      type="date"
                      min={todayStr}
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
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
                          <span className="font-medium bg-slate-100 rounded px-1.5 py-0.5">{h.outcome}</span>
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
function LeadCard({ lead, onAction, daysSince }) {
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
            <Clock className="h-3.5 w-3.5" /> Next: {lead.nextDate}
          </span>
          <span className="bg-slate-100 rounded px-2 py-0.5 font-medium">
            ⏳ {daysSince} days since entry
          </span>
          <span className="bg-slate-100 rounded px-2 py-0.5 text-slate-600 font-semibold">
            {lead.status}
          </span>
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
          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
        >
          <Phone className="h-3.5 w-3.5" /> Log Call Outcome
        </button>
      </div>
    </div>
  )
}
