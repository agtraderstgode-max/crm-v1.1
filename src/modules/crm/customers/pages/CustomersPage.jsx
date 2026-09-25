import { useState, useEffect, useRef, useMemo } from 'react'
import { Users, Search, Plus, Phone, MapPin, X, Calendar, User, FileText, DollarSign, HelpCircle, ArrowDownRight, Check, Trash } from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'
import { DEFAULT_STAFF_LIST, resolveStaffName } from '../../leads/pages/LeadsPage'

const TYPE_COLOR = {
  Owner:      'bg-blue-100 text-blue-700 border-blue-200',
  Builder:    'bg-violet-100 text-violet-700 border-violet-200',
  Contractor: 'bg-amber-100 text-amber-700 border-amber-200',
  Architect:  'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const STATUS_COLORS = {
  'New Customer': 'bg-slate-100 text-slate-700 border-slate-200',
  'Confirmed':    'bg-blue-50 text-blue-700 border-blue-100',
  'Processing':   'bg-amber-50 text-amber-700 border-amber-100',
  'Dispatched':   'bg-orange-50 text-orange-700 border-orange-100',
  'Delivered':    'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Cancelled':    'bg-red-50 text-red-700 border-red-100',
}

const PAYMENT_STATUS_COLORS = {
  '—':           'text-slate-400 bg-slate-50 border-slate-100',
  'Unpaid':      'bg-red-50 text-red-700 border-red-100',
  'Part Paid':   'bg-amber-50 text-amber-700 border-amber-100',
  'Fully Paid':  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Written Off': 'bg-orange-50 text-orange-700 border-orange-100',
}

const SHOWROOM_LAT = 11.0184
const SHOWROOM_LNG = 76.9744

// Haversine formula to calculate km distance
function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return ''
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d.toFixed(1)
}

// Helper to parse currency string (e.g. "₹4,80,000" -> 480000)
function parseAmount(amtStr) {
  if (!amtStr) return 0
  const clean = String(amtStr).replace(/[^\d]/g, '')
  return parseInt(clean) || 0
}

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
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
    />
  )
}

// ─── Name Autocomplete — searches existing leads database ───────────
function NameAutocomplete({ value, onChange, onSelect, leads }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(value) }, [value])

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
    onChange(val)
    setOpen(true)
  }

  const handlePick = (lead) => {
    setQuery(lead.name)
    setOpen(false)
    onSelect(lead)
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        placeholder="Type customer name... (Autofills if matches a lead)"
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 1 && setOpen(true)}
        autoComplete="off"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {suggestions.map(lead => (
            <li
              key={lead.id}
              onMouseDown={() => handlePick(lead)}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
            >
              <div className="flex h-8 w-8 items-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 flex-shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span>📞 {lead.phone}</span>
                  {lead.location && <span className="truncate">📍 {lead.location}</span>}
                </p>
              </div>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 flex-shrink-0">Lead Sync</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddCustomerDrawer({ open, onClose, onSave, leads, customer, staffList = DEFAULT_STAFF_LIST, staffRecords = [] }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    date: today, name: '', phone: '', location: '',
    lat: '', lng: '', km: '',
    source: '', size: '', budget: '', houseType: '',
    custType: 'Owner', stage: '', expectedAmt: '', remarks: '', attendedBy: '',
  })

  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id,
        date: customer.date || today,
        name: customer.name || '',
        phone: customer.phone || '',
        location: customer.location || '',
        lat: customer.lat || '',
        lng: customer.lng || '',
        km: customer.km || '',
        source: customer.source || '',
        size: customer.size || '',
        budget: customer.budget || '',
        houseType: customer.houseType || '',
        custType: customer.custType || 'Owner',
        stage: customer.stage || '',
        expectedAmt: customer.expectedAmt || '',
        remarks: customer.remarks || '',
        attendedBy: resolveStaffName(customer.attendedBy, staffRecords) || '',
      })
    } else {
      setForm({
        date: today, name: '', phone: '', location: '',
        lat: '', lng: '', km: '',
        source: '', size: '', budget: '', houseType: '',
        custType: 'Owner', stage: '', expectedAmt: '', remarks: '', attendedBy: '',
      })
    }
  }, [customer, open])

  const set = (k, v) => {
    setForm(prev => {
      const updated = { ...prev, [k]: v }
      if ((k === 'lat' || k === 'lng') && updated.lat && updated.lng) {
        updated.km = haversineKm(SHOWROOM_LAT, SHOWROOM_LNG, parseFloat(updated.lat), parseFloat(updated.lng))
      }
      return updated
    })
  }

  const handleSelectLead = (lead) => {
    setForm(prev => ({
      ...prev,
      name: lead.name,
      phone: lead.phone,
      custType: lead.custType || 'Owner',
      location: lead.location || '',
      lat: lead.lat || '',
      lng: lead.lng || '',
      km: lead.km || '',
      source: lead.source || '',
      size: lead.size || '',
      houseType: lead.houseType || '',
      stage: lead.stage || '',
      budget: lead.budget || '',
      expectedAmt: lead.expectedAmt || '',
      remarks: lead.remarks || '',
      attendedBy: lead.attendedBy || '',
    }))
  }

  const handleSave = () => {
    if (!form.name || !form.phone) return
    onSave(form)
    onClose()
  }

  return (
    <>
      <div
        className={cn('fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />

      <div className={cn(
        'fixed top-0 right-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">{customer ? `Edit Customer: ${customer.id}` : 'Add New Customer'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Master record for bills, purchases, and orders</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Basic Info */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Basic Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel text="First Contact Date" required />
                <FieldInput type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <FieldLabel text="Customer Type" required />
                <div className="grid grid-cols-2 gap-2">
                  {['Owner', 'Builder', 'Contractor', 'Architect'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('custType', t)}
                      className={cn(
                        'rounded-lg border py-2 text-xs font-bold transition-all cursor-pointer',
                        form.custType === t
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <FieldLabel text="Full Name" required />
              <NameAutocomplete
                value={form.name}
                onChange={val => set('name', val)}
                onSelect={handleSelectLead}
                leads={leads}
              />
            </div>

            <div>
              <FieldLabel text="Phone Number" required />
              <FieldInput type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. Location */}
          <div className="space-y-4">
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
            <div>
              <div className="flex justify-between items-center mb-1">
                <FieldLabel text="Distance from Showroom (km)" />
                {form.lat && form.lng && (
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">Auto-calculated</span>
                )}
              </div>
              <div className="relative">
                <FieldInput
                  type="number"
                  placeholder="Enter approximate km  e.g. 5.5"
                  value={form.km}
                  onChange={e => set('km', e.target.value)}
                  disabled={!!(form.lat && form.lng)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">km</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3. Source */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. How did they know us?</p>
            <div>
              <FieldLabel text="Source / Referred By" required />
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Tv Ad', 'Flex Display', 'Social Media', 'Google',
                  'Referral', 'Engineer', 'Marketing Person', 'Mestri',
                  'Walk In', 'Company Lead'
                ].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('source', s)}
                    className={cn(
                      'rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer truncate px-1',
                      form.source === s
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 4. Building details */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">4. Building Details</p>
            <div>
              <FieldLabel text="Building Size (sqft)" />
              <div className="flex flex-wrap gap-2">
                {['500+', '750+', '1000+', '1250+', '1500+', '2000+', '2500+'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('size', s)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                      form.size === s
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-blue-300 bg-white'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel text="Type of House" />
              <div className="grid grid-cols-3 gap-2">
                {['New', 'Old', 'Renovation'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('houseType', t)}
                    className={cn(
                      'rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer',
                      form.houseType === t
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel text="Building Stage" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Planning', 'Construction Started',
                  'Flooring Stage', 'Immediate Requirement'
                ].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('stage', s)}
                    className={cn(
                      'rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer truncate px-1',
                      form.stage === s
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 5. Budget Details */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">5. Budget Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel text="Budget Range" />
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => set('budget', val)}
                      className={cn(
                        'rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer',
                        form.budget === val
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:border-blue-300 bg-white'
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel text="Value (₹)" />
                <FieldInput type="text" placeholder="e.g. ₹80,000" value={form.expectedAmt} onChange={e => set('expectedAmt', e.target.value)} />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 6. Attended By & Remarks */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">6. Staff &amp; Remarks</p>
            <div>
              <FieldLabel text="Attended By" />
              <div className="flex flex-wrap gap-2">
                {(staffList || DEFAULT_STAFF_LIST).map(staff => (
                  <button
                    key={staff}
                    type="button"
                    onClick={() => set('attendedBy', form.attendedBy === staff ? '' : staff)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-xs font-semibold transition-all cursor-pointer',
                      form.attendedBy === staff
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                    )}
                  >
                    👤 {staff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel text="Remarks" />
              <textarea
                rows={3}
                placeholder="e.g. Wants wood finish tiles, quoted custom pricing..."
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.phone}
            className={cn(
              'rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm cursor-pointer',
              form.name && form.phone
                ? 'bg-blue-600 hover:bg-blue-700 hover:shadow'
                : 'bg-slate-300 cursor-not-allowed'
            )}
          >
            Save Customer
          </button>
        </div>
      </div>
    </>
  )
}

export function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [leads, setLeads] = useState([])
  const [orders, setOrders] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All Types')
  const [filterOrderStatus, setFilterOrderStatus] = useState('All Statuses')
  const [filterPayStatus, setFilterPayStatus] = useState('All Pay Statuses')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const fetchCustomers = () => {
    setLoading(true)
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching customers:", err)
        setLoading(false)
      })
  }

  const fetchLeads = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => setLeads(data))
      .catch(err => console.error("Error fetching leads:", err))
  }

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error("Error fetching orders:", err))
  }

  const fetchStaff = () => {
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => setStaffMembers(data || []))
      .catch(err => console.warn("Error fetching staff:", err))
  }

  useEffect(() => {
    fetchCustomers()
    fetchLeads()
    fetchOrders()
    fetchStaff()
  }, [])

  const staffList = useMemo(() => {
    const activeStaff = (staffMembers || [])
      .filter(s => s.status !== 'Inactive')
      .map(s => s.name)
      .filter(Boolean)
    return Array.from(new Set(['Manager', ...activeStaff, 'Vanmathi.B', 'Boopana']))
  }, [staffMembers])

  const getCustomerOrderStatus = (customerName) => {
    if (!customerName) return 'New Customer'
    const custOrders = orders.filter(o => o.customer.toLowerCase() === customerName.toLowerCase())
    if (custOrders.length === 0) return 'New Customer'
    
    // Sort by order ID descending to find the latest order status
    custOrders.sort((a, b) => b.id.localeCompare(a.id))
    return custOrders[0].status
  }

  const getCustomerAmountPaid = (customerName) => {
    if (!customerName) return '—'
    const custOrders = orders.filter(o => o.customer.toLowerCase() === customerName.toLowerCase())
    if (custOrders.length === 0) return '—'
    
    custOrders.sort((a, b) => b.id.localeCompare(a.id))
    const order = custOrders[0]
    
    let paid = 0
    if (order.payments) {
      order.payments.forEach(p => {
        if (p.mode !== 'Write Off') {
          paid += parseFloat(p.amount) || 0
        }
      })
    }
    return `₹${Math.round(paid).toLocaleString('en-IN')}`
  }

  const getCustomerPaymentStatus = (customerName) => {
    if (!customerName) return '—'
    const custOrders = orders.filter(o => o.customer.toLowerCase() === customerName.toLowerCase())
    if (custOrders.length === 0) return '—'
    
    custOrders.sort((a, b) => b.id.localeCompare(a.id))
    const order = custOrders[0]
    
    const total = parseAmount(order.total)
    let paid = 0
    let writeOff = 0
    if (order.payments) {
      order.payments.forEach(p => {
        if (p.mode === 'Write Off') {
          writeOff += parseFloat(p.amount) || 0
        } else {
          paid += parseFloat(p.amount) || 0
        }
      })
    }
    
    if (paid + writeOff >= total && total > 0) {
      return writeOff > 0 ? 'Written Off' : 'Fully Paid'
    } else if (paid > 0) {
      return 'Part Paid'
    }
    return 'Unpaid'
  }

  const handleSave = (form) => {
    const isEdit = !!form.id
    const url = isEdit ? `/api/customers/${form.id}` : '/api/customers'
    const method = isEdit ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        if (isEdit) {
          setCustomers(prev => prev.map(c => c.id === form.id ? data : c))
        } else {
          setCustomers(prev => [data, ...prev])
        }
        setSelectedCustomer(null)
      })
      .catch(err => console.error("Error saving customer:", err))
  }

  const handleDelete = (id, name) => {
    const ok = window.confirm(`Delete Customer\n\nAre you sure you want to delete "${name}" from master records?\n\nClick OK to confirm.`)
    if (!ok) return
    fetch(`/api/customers/${id}`, { method: 'DELETE' })
      .then(() => {
        setCustomers(prev => prev.filter(c => c.id !== id))
      })
      .catch(err => console.error("Error deleting customer:", err))
  }

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase()
    const matchesSearch = c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.location || '').toLowerCase().includes(q)
    const matchesType = filterType === 'All Types' || c.custType === filterType
    
    const orderStat = getCustomerOrderStatus(c.name)
    const matchesOrderStatus = filterOrderStatus === 'All Statuses' || orderStat === filterOrderStatus
    
    const payStat = getCustomerPaymentStatus(c.name)
    const matchesPayStatus = filterPayStatus === 'All Pay Statuses' || payStat === filterPayStatus
    
    return matchesSearch && matchesType && matchesOrderStatus && matchesPayStatus
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500">Master list of all showroom customers</p>
        </div>
        <button
          onClick={() => { setSelectedCustomer(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex-1 max-w-sm shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-slate-600 placeholder:text-slate-400"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none cursor-pointer"
        >
          <option>All Types</option>
          <option>Owner</option>
          <option>Builder</option>
          <option>Contractor</option>
          <option>Architect</option>
        </select>
        <select
          value={filterOrderStatus}
          onChange={e => setFilterOrderStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none cursor-pointer"
        >
          <option>All Statuses</option>
          <option>New Customer</option>
          <option>Confirmed</option>
          <option>Processing</option>
          <option>Dispatched</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <select
          value={filterPayStatus}
          onChange={e => setFilterPayStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none cursor-pointer"
        >
          <option>All Pay Statuses</option>
          <option>Unpaid</option>
          <option>Part Paid</option>
          <option>Fully Paid</option>
          <option>Written Off</option>
          <option>—</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading customers master...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No customers matching filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Area / Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Value</th>
                 <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount Paid</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Pay Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Attended By</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">{c.name}</span>
                        <span className="text-[10px] text-slate-400">ID: {c.id} · {fmtDate(c.date)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 font-medium">{c.phone}</td>
                  <td className="px-5 py-3.5">
                    {c.location ? (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />{c.location}
                        {c.km && <span className="text-[10px] text-slate-400 font-normal">({c.km} km)</span>}
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', TYPE_COLOR[c.custType] || '')}>
                      {c.custType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{c.expectedAmt || '—'}</td>
                  <td className="px-5 py-3.5">
                    {(() => {
                      const stat = getCustomerOrderStatus(c.name)
                      return (
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', STATUS_COLORS[stat] || 'bg-slate-100 text-slate-700 border-slate-200')}>
                          {stat}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-700">
                    {getCustomerAmountPaid(c.name)}
                  </td>
                  <td className="px-5 py-3.5">
                    {(() => {
                      const payStat = getCustomerPaymentStatus(c.name)
                      return (
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', PAYMENT_STATUS_COLORS[payStat] || 'bg-slate-100 text-slate-700 border-slate-200')}>
                          {payStat}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-600">
                    {c.attendedBy ? `👤 ${resolveStaffName(c.attendedBy, staffMembers)}` : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => { setSelectedCustomer(c); setDrawerOpen(true); }}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddCustomerDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedCustomer(null); }}
        onSave={handleSave}
        leads={leads}
        customer={selectedCustomer}
        staffList={staffList}
        staffRecords={staffMembers}
      />
    </div>
  )
}
