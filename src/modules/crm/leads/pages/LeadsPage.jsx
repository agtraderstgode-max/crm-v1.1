import { useState, useRef, useEffect } from 'react'
import { Search, Plus, MapPin, Phone, X, Save, Navigation } from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────
const SOURCES = ['Tv Ad','Flex Display','Social Media','Google','Referral','Engineer','Marketing Person','Mestri','Walk In','Company Lead']
const BUILDING_SIZES = ['500+','750+','1000+','1250+','1500+','2000+','2500+']
const BUDGETS = ['Low','Medium','High']
const HOUSE_TYPES = ['New','Old','Renovation']
const CUSTOMER_TYPES = ['Owner','Builder','Contractor','Architect']
const STAGES = ['Planning','Construction Started','Flooring Stage','Immediate Requirement']
const PRIORITIES = ['High','Medium','Low']
const STATUSES_LIST = ['New Entry','Keep Tracking 2x','Keep Tracking 3x','Keep Tracking 4x','Customer Bought','Lost Customer']
const STAFF_LIST = ['Manager', 'Staff 1', 'Staff 2', 'Staff 3']

// Showroom coordinates (AG TRADERS, TIRUCHENGODE)
const SHOWROOM_LAT = 11.3477
const SHOWROOM_LNG = 77.9037

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
}

// ─── Table constants ──────────────────────────────────────────
const FILTER_STATUSES = ['All Status','New Entry','Keep Tracking 2x','Keep Tracking 3x','Keep Tracking 4x','Customer Bought','Lost Customer']
const FILTER_SOURCES  = ['All Sources','Tv Ad','Flex Display','Social Media','Google','Referral','Engineer','Marketing Person','Mestri','Walk In','Company Lead']

const PRIORITY_STYLE = {
  High:   'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low:    'bg-blue-100 text-blue-700 border-blue-200',
}
const STATUS_STYLE = {
  'New Entry':          'bg-slate-100 text-slate-600',
  'Keep Tracking 2x':  'bg-violet-100 text-violet-700',
  'Keep Tracking 3x':  'bg-violet-100 text-violet-700',
  'Keep Tracking 4x':  'bg-purple-100 text-purple-700',
  'Customer Bought':   'bg-emerald-100 text-emerald-700',
  'Lost Customer':     'bg-red-100 text-red-500',
}

const INITIAL_LEADS = [
  { id:'L001', date:'2026-07-03', name:'Aravind Kumar',        phone:'9876543210', location:'Gandhipuram',      lat:11.0172, lng:76.9561, km:0.5,  source:'Google',          size:'1500+', budget:'Medium', houseType:'New',        custType:'Owner',     stage:'Immediate',           priority:'High',   status:'New Entry',        nextDate:'2026-07-05', expectedAmt:'₹80,000',  remarks:'Wants premium wood finish tiles.' },
  { id:'L002', date:'2026-07-02', name:'Suresh Constructions', phone:'9845612307', location:'Peelamedu',        lat:11.0300, lng:77.0200, km:6.2,  source:'Engineer',        size:'2500+', budget:'High',   houseType:'New',        custType:'Builder',   stage:'Flooring Stage',      priority:'High',   status:'Keep Tracking 2x', nextDate:'2026-07-04', expectedAmt:'₹3,20,000', remarks:'Looking for imported marble.' },
  { id:'L003', date:'2026-07-01', name:'Meena Rajan',          phone:'9003344556', location:'RS Puram',         lat:11.0140, lng:76.9420, km:1.2,  source:'Walk In',         size:'750+',  budget:'Low',    houseType:'Renovation', custType:'Owner',     stage:'Planning',            priority:'Low',    status:'Lost Customer',    nextDate:'',           expectedAmt:'₹30,000',  remarks:'Price too high. Went elsewhere.' },
  { id:'L004', date:'2026-06-30', name:'Devi Architects',      phone:'9988776655', location:'Saravanampatti',   lat:11.0680, lng:77.0200, km:8.5,  source:'Social Media',    size:'2000+', budget:'High',   houseType:'New',        custType:'Architect', stage:'Construction Started', priority:'Medium', status:'Keep Tracking 3x', nextDate:'2026-07-06', expectedAmt:'₹2,10,000', remarks:'Interested in large format slabs.' },
  { id:'L005', date:'2026-06-29', name:'Karthik Homes',        phone:'9444123456', location:'Thudiyalur',       lat:11.0800, lng:76.9700, km:7.2,  source:'Tv Ad',           size:'500+',  budget:'Low',    houseType:'Renovation', custType:'Owner',     stage:'Immediate',           priority:'Medium', status:'Customer Bought',  nextDate:'',           expectedAmt:'₹22,000',  remarks:'Bought bathroom tiles set.' },
  { id:'L006', date:'2026-06-28', name:'Ibrahim Kutty',        phone:'9894002233', location:'Karumathampatti',  lat:11.0900, lng:77.1100, km:24.6, source:'Mestri',          size:'1000+', budget:'Low',    houseType:'New',        custType:'Owner',     stage:'Flooring Stage',      priority:'High',   status:'Keep Tracking 4x', nextDate:'2026-07-03', expectedAmt:'₹55,000',  remarks:'Mestri Ramu referred. Needs discount.' },
]

// ─── Reusable field components — defined OUTSIDE drawer to prevent remount on every keystroke ───
function FieldLabel({ text, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
      {text} {required && <span className="text-red-400">*</span>}
    </label>
  )
}
function FieldInput({ value, onChange, ...props }) {
  return (
    <input
      {...props}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
    />
  )
}
function FieldSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── Name Autocomplete — searches existing leads DB ───────────
function NameAutocomplete({ value, onChange, onSelect, leads }) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState(value)
  const wrapRef               = useRef(null)

  // Sync external value changes (e.g. on form reset)
  useEffect(() => { setQuery(value) }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = query.length >= 1
    ? leads.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.phone.includes(query)
      ).slice(0, 6)
    : []

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)       // update form.name
    setOpen(true)
  }

  const handlePick = (lead) => {
    setQuery(lead.name)
    setOpen(false)
    onSelect(lead)      // auto-fill all fields
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        placeholder="e.g. Aravind Kumar"
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 1 && setOpen(true)}
        autoComplete="off"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {suggestions.map(lead => (
            <li
              key={lead.id}
              onMouseDown={() => handlePick(lead)}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 flex-shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><span>📞</span>{lead.phone}</span>
                  {lead.location && <span className="flex items-center gap-0.5"><span>📍</span>{lead.location}</span>}
                </p>
              </div>
              <span className="text-[10px] font-medium text-blue-500 bg-blue-50 rounded px-1.5 py-0.5 flex-shrink-0">Existing</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddLeadDrawer({ open, onClose, onSave, leads, lead }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today, name: '', phone: '', location: '',
    lat: '', lng: '', km: '', withinDays: '',
    source: '', size: '', budget: '', houseType: '',
    custType: '', stage: '', expectedAmt: '', priority: 'Medium',
    status: 'New Entry', nextDate: '', remarks: '', attendedBy: '',
  })

  // Sync editing lead details if opening in edit mode
  useEffect(() => {
    if (lead) {
      setForm({
        id: lead.id,
        date: lead.date || today,
        name: lead.name || '',
        phone: lead.phone || '',
        location: lead.location || '',
        lat: lead.lat || '',
        lng: lead.lng || '',
        km: lead.km || '',
        withinDays: lead.withinDays || '',
        source: lead.source || '',
        size: lead.size || '',
        budget: lead.budget || '',
        houseType: lead.houseType || '',
        custType: lead.custType || '',
        stage: lead.stage || '',
        expectedAmt: lead.expectedAmt || '',
        priority: lead.priority || 'Medium',
        status: lead.status || 'New Entry',
        nextDate: lead.nextDate || '',
        remarks: lead.remarks || '',
        attendedBy: lead.attendedBy || '',
      })
    } else {
      setForm({
        date: today, name: '', phone: '', location: '',
        lat: '', lng: '', km: '', withinDays: '',
        source: '', size: '', budget: '', houseType: '',
        custType: '', stage: '', expectedAmt: '', priority: 'Medium',
        status: 'New Entry', nextDate: '', remarks: '', attendedBy: '',
      })
    }
  }, [lead, open])

  const set = (k, v) => {
    setForm(prev => {
      const updated = { ...prev, [k]: v }
      if ((k === 'lat' || k === 'lng') && updated.lat && updated.lng) {
        updated.km = haversineKm(SHOWROOM_LAT, SHOWROOM_LNG, parseFloat(updated.lat), parseFloat(updated.lng))
      }
      return updated
    })
  }

  const handleSave = () => {
    if (!form.name || !form.phone) return
    onSave(form)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">{lead ? `Edit Enquiry / Lead: ${lead.id}` : 'Add New Enquiry / Lead'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{lead ? 'Update lead and follow-up details' : 'Fill in customer details and enquiry info'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Section 1 — Basic Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Basic Information</p>

            <div>
              <FieldLabel text="First Contact Date" required />
              <FieldInput type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>

            <div>
              <FieldLabel text="Customer Type" required />
              <div className="flex gap-2 flex-wrap mt-1">
                {CUSTOMER_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('custType', t)}
                    className={cn(
                      'flex-1 min-w-fit rounded-lg border px-3 py-2 text-sm font-semibold transition-all whitespace-nowrap',
                      form.custType === t
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel text="Full Name" required />
              <NameAutocomplete
                value={form.name}
                onChange={val => set('name', val)}
                leads={leads}
                onSelect={lead => {
                  setForm(prev => ({
                    ...prev,
                    name: lead.name,
                    phone: lead.phone || '',
                    location: lead.location || '',
                    lat: lead.lat || '',
                    lng: lead.lng || '',
                    km: lead.km || '',
                    custType: lead.custType || prev.custType,
                    source: lead.source || prev.source,
                    size: lead.size || prev.size,
                    budget: lead.budget || prev.budget,
                    houseType: lead.houseType || prev.houseType,
                    stage: lead.stage || prev.stage,
                    expectedAmt: lead.expectedAmt || prev.expectedAmt,
                    priority: lead.priority || prev.priority
                  }))
                }}
              />
            </div>

            <div>
              <FieldLabel text="Phone Number" required />
              <FieldInput type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          {/* Section 2 — Location */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Location</p>

            <div>
              <FieldLabel text="Location Name / Area" />
              <FieldInput type="text" placeholder="e.g. Gandhipuram, Peelamedu..." value={form.location} onChange={e => set('location', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel text="Latitude" />
                <FieldInput type="number" step="any" placeholder="e.g. 11.0168" value={form.lat} onChange={e => set('lat', e.target.value)} />
              </div>
              <div>
                <FieldLabel text="Longitude" />
                <FieldInput type="number" step="any" placeholder="e.g. 76.9558" value={form.lng} onChange={e => set('lng', e.target.value)} />
              </div>
            </div>

            {/* Manual KM input */}
            <div>
              <FieldLabel text="Distance from Showroom (km)" />
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter approximate km  e.g. 5.5"
                  value={form.km}
                  onChange={e => set('km', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-16 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">km</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                💡 Auto-fills when Latitude &amp; Longitude entered above. Or type approximate distance manually.
              </p>
            </div>
          </div>

          {/* Section 3 — How they know us */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. How Did They Know Us?</p>
            <div>
              <FieldLabel text="Source / Referred By" required />
              <div className="grid grid-cols-3 gap-2 mt-1">
                {SOURCES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('source', s)}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-xs font-medium transition-all text-center',
                      form.source === s
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4 — Building Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">4. Building Details</p>

            {/* Building Size */}
            <div>
              <FieldLabel text="Building Size (sqft)" />
              <div className="grid grid-cols-4 gap-2 mt-1">
                {BUILDING_SIZES.map(s => (
                  <button key={s} type="button" onClick={() => set('size', s)}
                    className={cn('rounded-lg border px-2 py-1.5 text-xs font-medium transition-all text-center',
                      form.size === s ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                    )}>{s}</button>
                ))}
              </div>
            </div>

            {/* Type of House */}
            <div>
              <FieldLabel text="Type of House" />
              <div className="flex gap-2 mt-1">
                {HOUSE_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => set('houseType', t)}
                    className={cn('flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all text-center',
                      form.houseType === t ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                    )}>{t}</button>
                ))}
              </div>
            </div>

            {/* Building Stage */}
            <div>
              <FieldLabel text="Building Stage" />
              <div className="grid grid-cols-2 gap-2 mt-1">
                {STAGES.map(s => (
                  <button key={s} type="button" onClick={() => set('stage', s)}
                    className={cn('rounded-lg border px-2 py-1.5 text-xs font-medium transition-all text-center',
                      form.stage === s ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                    )}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5 — Budget & Priority */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">5. Budget & Priority</p>

            {/* Budget Range — visual click buttons */}
            <div>
              <FieldLabel text="Budget Range" />
              <div className="flex gap-3 mt-1">
                {[
                  { val: 'Low',    active: 'bg-blue-500 border-blue-500 text-white shadow-sm' },
                  { val: 'Medium', active: 'bg-amber-500 border-amber-500 text-white shadow-sm' },
                  { val: 'High',   active: 'bg-emerald-500 border-emerald-500 text-white shadow-sm' },
                ].map(({ val, active }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('budget', val)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm font-semibold transition-all',
                      form.budget === val ? active : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel text="Expected Purchase Amt" />
              <FieldInput type="text" placeholder="e.g. ₹80,000" value={form.expectedAmt} onChange={e => set('expectedAmt', e.target.value)} />
            </div>

            {/* Priority — visual radio buttons */}
            <div>
              <FieldLabel text="Priority (Chances to Buy)" required />
              <div className="flex gap-3 mt-1">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('priority', p)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm font-semibold transition-all',
                      form.priority === p
                        ? p === 'High'   ? 'bg-red-500 border-red-500 text-white shadow-sm'
                          : p === 'Medium' ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                          :                  'bg-blue-500 border-blue-500 text-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6 — Status & Follow-up */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">6. Status & Follow-up</p>

            <div>
              <FieldLabel text="Current Status" />
              <div className="grid grid-cols-2 gap-2 mt-1">
                {STATUSES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={cn('rounded-lg border px-2 py-1.5 text-xs font-medium transition-all text-center',
                      form.status === s ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                    )}>{s}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Next Follow-up Date */}
              <div>
                <FieldLabel text="Next Follow-up Date" />
                <input
                  type="date"
                  value={form.nextDate}
                  onChange={e => {
                    const dateVal = e.target.value
                    let days = ''
                    if (dateVal) {
                      const diff = Math.round(
                        (new Date(dateVal) - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24)
                      )
                      days = diff >= 0 ? String(diff) : ''
                    }
                    setForm(prev => ({ ...prev, nextDate: dateVal, withinDays: days }))
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Within Days */}
              <div>
                <FieldLabel text="Within Days (approximate)" />
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    placeholder="e.g. 3"
                    value={form.withinDays}
                    onChange={e => {
                      const days = e.target.value
                      let dateVal = ''
                      if (days !== '' && !isNaN(days)) {
                        const d = new Date()
                        d.setDate(d.getDate() + parseInt(days))
                        dateVal = d.toISOString().split('T')[0]
                      }
                      setForm(prev => ({ ...prev, withinDays: days, nextDate: dateVal }))
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-14 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">days</span>
                </div>
              </div>
            </div>

            {/* Live preview */}
            {form.nextDate && (
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">
                    {form.withinDays || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-800">
                    Follow-up in {form.withinDays || '?'} day{form.withinDays !== '1' ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-blue-500">
                    {new Date(form.nextDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 7 — Attended By */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <FieldLabel text="Lead Attended By" />
            <div className="flex flex-wrap gap-2 mt-1">
              {STAFF_LIST.map(staff => (
                <button
                  key={staff}
                  type="button"
                  onClick={() => set('attendedBy', form.attendedBy === staff ? '' : staff)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-semibold transition-all',
                    form.attendedBy === staff
                      ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700'
                  )}
                >
                  {staff}
                </button>
              ))}
            </div>
          </div>

          {/* Section 8 — Remarks */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <FieldLabel text="Remarks / Notes" />
            <textarea
              value={form.remarks}
              onChange={e => set('remarks', e.target.value)}
              rows={3}
              placeholder="Any additional details about the customer or enquiry..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.phone}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" /> Save Lead
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Leads Page ───────────────────────────────────────────────
export function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [activeTab, setActiveTab] = useState('active')
  const [sortField, setSortField] = useState(null)
  const [sortOrder, setSortOrder] = useState(null)
  const [filterSource, setFilterSource] = useState('All Sources')
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)

  // Fetch leads from Express backend
  useEffect(() => {
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
  }, [])

  const handleSave = (lead) => {
    if (lead.id) {
      // Edit mode: PUT update
      fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      })
        .then(res => res.json())
        .then(updatedLead => {
          setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l))
          setSelectedLead(null)
        })
        .catch(err => console.error("Error updating lead:", err))
    } else {
      // Create mode: POST insert
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      })
        .then(res => res.json())
        .then(savedLead => {
          setLeads(prev => [savedLead, ...prev])
        })
        .catch(err => console.error("Error saving new lead:", err))
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc')
      else {
        setSortField(null)
        setSortOrder(null)
      }
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Tab-level filter
  const ACTIVE_STATUSES = ['New Entry', 'Keep Tracking 2x', 'Keep Tracking 3x', 'Keep Tracking 4x']
  const tabFiltered = leads.filter(l => {
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(l.status)
    if (activeTab === 'won')    return l.status === 'Customer Bought'
    if (activeTab === 'lost')   return l.status === 'Lost Customer'
    return true // 'all'
  })

  const filtered = tabFiltered.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.location || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All Status' || l.status === filterStatus
    const matchSource = filterSource === 'All Sources' || l.source === filterSource
    return matchSearch && matchStatus && matchSource
  })

  const sortedLeads = [...filtered].sort((a, b) => {
    if (!sortField || !sortOrder) return 0

    let valA = a[sortField]
    let valB = b[sortField]

    if (sortField === 'km') {
      valA = a.km !== '' && !isNaN(a.km) ? parseFloat(a.km) : 999999
      valB = b.km !== '' && !isNaN(b.km) ? parseFloat(b.km) : 999999
    }
    else if (sortField === 'withinDays') {
      valA = a.withinDays !== '' && !isNaN(a.withinDays) ? parseInt(a.withinDays) : 999999
      valB = b.withinDays !== '' && !isNaN(b.withinDays) ? parseInt(b.withinDays) : 999999
    }
    else if (sortField === 'priority') {
      const pmap = { High: 3, Medium: 2, Low: 1 }
      valA = pmap[a.priority] || 0
      valB = pmap[b.priority] || 0
    }
    else {
      valA = (valA || '').toString().toLowerCase()
      valB = (valB || '').toString().toLowerCase()
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const ACTIVE_STATUSES_COUNT = ['New Entry', 'Keep Tracking 2x', 'Keep Tracking 3x', 'Keep Tracking 4x']
  const counts = {
    total:  leads.length,
    active: leads.filter(l => ACTIVE_STATUSES_COUNT.includes(l.status)).length,
    won:    leads.filter(l => l.status === 'Customer Bought').length,
    lost:   leads.filter(l => l.status === 'Lost Customer').length,
  }

  return (
    <>
      <AddLeadDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedLead(null); }} onSave={handleSave} leads={leads} lead={selectedLead} />

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          {/* Add Lead button — LEFT side */}
          <button
            onClick={() => { setSelectedLead(null); setDrawerOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Enquiry / Lead
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-800">Enquiry - Lead</h1>
            <p className="text-sm text-slate-500">Track every enquiry from first contact to close</p>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { key: 'active', label: 'Active', val: counts.active, activeClass: 'bg-white text-blue-700 shadow-sm',   inactiveClass: 'text-slate-500 hover:text-blue-600'  },
            { key: 'won',    label: 'Won',    val: counts.won,    activeClass: 'bg-white text-emerald-700 shadow-sm', inactiveClass: 'text-slate-500 hover:text-emerald-600' },
            { key: 'lost',   label: 'Lost',   val: counts.lost,   activeClass: 'bg-white text-red-600 shadow-sm',    inactiveClass: 'text-slate-500 hover:text-red-500'   },
            { key: 'all',    label: 'Total',  val: counts.total,  activeClass: 'bg-white text-slate-800 shadow-sm',  inactiveClass: 'text-slate-500 hover:text-slate-700' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setFilterStatus('All Status') }}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all',
                activeTab === tab.key ? tab.activeClass : tab.inactiveClass
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                activeTab === tab.key
                  ? tab.key === 'active' ? 'bg-blue-100 text-blue-700'
                    : tab.key === 'won' ? 'bg-emerald-100 text-emerald-700'
                    : tab.key === 'lost' ? 'bg-red-100 text-red-600'
                    : 'bg-slate-200 text-slate-600'
                  : 'bg-slate-200 text-slate-500'
              )}>
                {tab.val}
              </span>
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex-1 min-w-52 shadow-sm">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search name, phone, location..."
              className="flex-1 text-sm outline-none text-slate-600 placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          >
            {FILTER_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none"
            value={filterSource} onChange={e => setFilterSource(e.target.value)}
          >
            {FILTER_SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  { label: 'Lead ID', field: 'id' },
                  { label: 'Date', field: 'date' },
                  { label: 'Customer', field: 'name' },
                  { label: 'Next Follow-up', field: 'nextDate' },
                  { label: 'Within Days', field: 'withinDays' },
                  { label: 'Location / KM', field: 'km' },
                  { label: 'Source', field: null },
                  { label: 'Building', field: null },
                  { label: 'Priority', field: 'priority' },
                  { label: 'Status', field: 'status' },
                  { label: 'Attended By', field: null },
                  { label: 'Comments', field: null },
                  { label: '', field: null }
                ].map(h => {
                  if (!h.field) {
                    return (
                      <th key={h.label} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h.label}
                      </th>
                    )
                  }
                  const isCurrent = sortField === h.field
                  return (
                    <th
                      key={h.label}
                      onClick={() => handleSort(h.field)}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors select-none",
                        h.field === 'withinDays' ? 'text-center' : 'text-left'
                      )}
                    >
                      <div className={cn("flex items-center gap-1", h.field === 'withinDays' && "justify-center")}>
                        <span>{h.label}</span>
                        <span className="text-[10px] text-slate-400">
                          {isCurrent ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{lead.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(lead.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 flex-shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-0.5">
                          <Phone className="h-2.5 w-2.5" />{lead.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Next Follow-up Date */}
                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold whitespace-nowrap">
                    {lead.nextDate ? fmtDate(lead.nextDate) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Within Days — live calculated from today */}
                  <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
                    {lead.nextDate ? (() => {
                      const [y, m, d] = lead.nextDate.split('-').map(Number)
                      const next = new Date(y, m - 1, d)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const diff = Math.round((next - today) / (1000 * 60 * 60 * 24))

                      if (diff < 0) {
                        // Overdue — red
                        return (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-xs font-bold text-red-700">
                            🔴 {diff} days
                          </span>
                        )
                      } else if (diff === 0) {
                        // Due today — amber
                        return (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            🟡 Today
                          </span>
                        )
                      } else if (diff === 1) {
                        return (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                            +{diff} day
                          </span>
                        )
                      } else {
                        // Upcoming — blue
                        return (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                            +{diff} days
                          </span>
                        )
                      }
                    })() : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1 text-slate-600 text-xs">
                      <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />{lead.location}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 pl-4">{lead.km} km from showroom</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{lead.source}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{lead.size} sqft</p>
                    <p className="text-[11px] text-slate-400">{lead.houseType} · {lead.budget}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', PRIORITY_STYLE[lead.priority])}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', STATUS_STYLE[lead.status] || 'bg-slate-100 text-slate-500')}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.attendedBy ? (
                      <span className="inline-block rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                        {lead.attendedBy}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {lead.remarks ? (
                      <p className="text-[11px] text-slate-500 truncate" title={lead.remarks}>
                        {lead.remarks}
                      </p>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedLead(lead)
                        setDrawerOpen(true)
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading Enquiry &amp; Leads...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No leads found matching filters.</div>
          ) : null}
        </div>
      </div>
    </>
  )
}
