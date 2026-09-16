import { useState, useEffect } from 'react'
import {
  Share2, Plus, Search, Users, UserPlus, Phone, MapPin, IndianRupee,
  Calendar, CheckCircle2, Clock, CreditCard, ChevronRight, Edit, Trash2,
  X, Award, FileSpreadsheet, Send, TrendingUp, Sparkles, AlertCircle
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

export function ReferralPage() {
  const [referrals, setReferrals] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('partners') // 'partners' | 'orders' | 'payouts'
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Modals
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null) // for edit or detail
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [targetPartnerId, setTargetPartnerId] = useState('')

  // Partner Form State
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    category: 'Mestri / Mason',
    phone: '',
    whatsapp: '',
    location: '',
    commissionType: 'Percentage',
    commissionValue: 3,
    upiId: '',
    notes: ''
  })

  // Link Order Form State
  const [orderForm, setOrderForm] = useState({
    orderId: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    orderAmount: '',
    commissionAmount: ''
  })

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    mode: 'UPI',
    notes: ''
  })

  // Fetch referrals and orders
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resRef, resOrd] = await Promise.all([
        fetch('/api/referrals'),
        fetch('/api/orders')
      ])
      const dataRef = await resRef.json()
      const dataOrd = await resOrd.json()

      setReferrals(Array.isArray(dataRef) ? dataRef : [])
      setOrders(Array.isArray(dataOrd) ? dataOrd : [])
    } catch (err) {
      console.error('Failed to load referral data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Partner CRUD
  const handleOpenAddPartner = () => {
    setSelectedPartner(null)
    setPartnerForm({
      name: '',
      category: 'Mestri / Mason',
      phone: '',
      whatsapp: '',
      location: '',
      commissionType: 'Percentage',
      commissionValue: 3,
      upiId: '',
      notes: ''
    })
    setIsPartnerModalOpen(true)
  }

  const handleOpenEditPartner = (p) => {
    setSelectedPartner(p)
    setPartnerForm({
      name: p.name || '',
      category: p.category || 'Mestri / Mason',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      location: p.location || '',
      commissionType: p.commissionType || 'Percentage',
      commissionValue: p.commissionValue || 3,
      upiId: p.upiId || '',
      notes: p.notes || ''
    })
    setIsPartnerModalOpen(true)
  }

  const handleSavePartner = async (e) => {
    e.preventDefault()
    if (!partnerForm.name.trim()) return alert('Partner name is required')

    const url = selectedPartner ? `/api/referrals/${selectedPartner.id}` : '/api/referrals'
    const method = selectedPartner ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerForm)
      })
      if (res.ok) {
        setIsPartnerModalOpen(false)
        fetchData()
      } else {
        alert('Failed to save partner.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeletePartner = async (id) => {
    if (!confirm(`Are you sure you want to delete referral partner ${id}?`)) return
    try {
      const res = await fetch(`/api/referrals/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  // Link Order Submit
  const handleSaveReferredOrder = async (e) => {
    e.preventDefault()
    if (!targetPartnerId) return alert('Select a referral partner')
    if (!orderForm.orderAmount || parseFloat(orderForm.orderAmount) <= 0) return alert('Enter valid order amount')

    try {
      const res = await fetch(`/api/referrals/${targetPartnerId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      })
      if (res.ok) {
        setIsOrderModalOpen(false)
        setOrderForm({ orderId: '', clientName: '', date: new Date().toISOString().split('T')[0], orderAmount: '', commissionAmount: '' })
        fetchData()
      } else {
        alert('Failed to link order.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Record Payout Submit
  const handleSavePayout = async (e) => {
    e.preventDefault()
    if (!targetPartnerId) return alert('Select a referral partner')
    if (!payoutForm.amount || parseFloat(payoutForm.amount) <= 0) return alert('Enter valid payout amount')

    try {
      const res = await fetch(`/api/referrals/${targetPartnerId}/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutForm)
      })
      if (res.ok) {
        setIsPayoutModalOpen(false)
        setPayoutForm({ date: new Date().toISOString().split('T')[0], amount: '', mode: 'UPI', notes: '' })
        fetchData()
      } else {
        alert('Failed to record payout.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Calculate totals per partner
  const enrichedPartners = referrals.map(p => {
    const ordersList = p.referredOrders || []
    const payoutsList = p.payouts || []

    const totalReferredVolume = ordersList.reduce((acc, curr) => acc + (curr.orderAmount || 0), 0)
    const totalCommissionEarned = ordersList.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0)
    const totalPayoutsMade = payoutsList.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    const pendingPayout = Math.max(0, totalCommissionEarned - totalPayoutsMade)

    return {
      ...p,
      totalReferredVolume,
      totalCommissionEarned,
      totalPayoutsMade,
      pendingPayout,
      ordersCount: ordersList.length
    }
  })

  // Filter partners
  const filteredPartners = enrichedPartners.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
    const term = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.id?.toLowerCase().includes(term) ||
      p.phone?.includes(term) ||
      p.location?.toLowerCase().includes(term)
    )
  })

  // Aggregate all referred orders across partners
  const allReferredOrders = []
  enrichedPartners.forEach(p => {
    (p.referredOrders || []).forEach(ord => {
      allReferredOrders.push({
        ...ord,
        partnerId: p.id,
        partnerName: p.name,
        partnerCategory: p.category
      })
    })
  })
  allReferredOrders.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Aggregate all payouts across partners
  const allPayouts = []
  enrichedPartners.forEach(p => {
    (p.payouts || []).forEach(pay => {
      allPayouts.push({
        ...pay,
        partnerId: p.id,
        partnerName: p.name,
        partnerCategory: p.category,
        partnerUpi: p.upiId
      })
    })
  })
  allPayouts.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Overall KPIs
  const grandTotalPartners = enrichedPartners.length
  const grandTotalReferredVolume = enrichedPartners.reduce((acc, curr) => acc + curr.totalReferredVolume, 0)
  const grandTotalCommissionEarned = enrichedPartners.reduce((acc, curr) => acc + curr.totalCommissionEarned, 0)
  const grandTotalPendingPayout = enrichedPartners.reduce((acc, curr) => acc + curr.pendingPayout, 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referral & Commission Management</h1>
          <p className="text-sm text-slate-500">Track Mestris, Architects, Engineers, & Designers. Manage commissions & payout settlements</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenAddPartner}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
          >
            <UserPlus className="h-4 w-4" /> Add Referral Partner
          </button>
          <button
            onClick={() => {
              if (referrals.length > 0) setTargetPartnerId(referrals[0].id)
              setIsOrderModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Link Referred Order
          </button>
          <button
            onClick={() => {
              if (referrals.length > 0) setTargetPartnerId(referrals[0].id)
              setIsPayoutModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 shadow-sm transition"
          >
            <CreditCard className="h-4 w-4" /> Record Payout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Partners</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{grandTotalPartners}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Mestris, Engineers & Designers</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Brought</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">₹{grandTotalReferredVolume.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Referred order business</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission Earned</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">₹{grandTotalCommissionEarned.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-xs font-medium text-emerald-600 font-semibold">Total partner incentives</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payouts</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-600">₹{grandTotalPendingPayout.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-xs font-medium text-amber-600 font-semibold">Due for settlement</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('partners')}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'partners'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <Users className="h-4.5 w-4.5" /> Referral Partners ({filteredPartners.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'orders'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <FileSpreadsheet className="h-4.5 w-4.5" /> Referred Orders ({allReferredOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={cn(
            "pb-3 text-sm font-bold border-b-3 transition-all flex items-center gap-2",
            activeTab === 'payouts'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          <CreditCard className="h-4.5 w-4.5" /> Commission Payouts ({allPayouts.length})
        </button>
      </div>

      {/* Search & Category Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by partner name, ID, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'partners' && (
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 overflow-x-auto">
            {['ALL', 'Mestri / Mason', 'Civil Engineer', 'Interior Designer', 'Customer'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition',
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: REFERRAL PARTNERS GRID */}
      {activeTab === 'partners' && (
        <>
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-sm font-medium animate-pulse">
              Loading referral partners...
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No referral partners found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPartners.map(partner => (
                <div key={partner.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base shadow-md shadow-blue-500/20">
                          {partner.name ? partner.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{partner.name}</h3>
                          <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {partner.id}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-extrabold">
                        {partner.commissionValue}% Comm.
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <Award className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <span>{partner.category}</span>
                      </div>

                      {partner.location && (
                        <div className="flex items-center gap-1.5 text-slate-500 px-1 py-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{partner.location}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" /> {partner.phone || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">UPI / Payment ID</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5 truncate font-mono text-[11px]">
                            <CreditCard className="h-3 w-3 text-slate-400" /> {partner.upiId || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Ledger Block */}
                    <div className="mt-4 rounded-xl bg-slate-900 text-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Referred Orders ({partner.ordersCount}):</span>
                        <span className="font-bold text-white">₹{partner.totalReferredVolume.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Total Comm. Earned:</span>
                        <span className="font-bold text-emerald-400">₹{partner.totalCommissionEarned.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800">
                        <span className="text-slate-400 font-bold">Pending Settlement:</span>
                        <span className="font-black text-amber-400 text-sm">₹{partner.pendingPayout.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setTargetPartnerId(partner.id)
                        setIsOrderModalOpen(true)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1.5 text-xs font-bold transition"
                    >
                      + Link Order
                    </button>
                    <button
                      onClick={() => {
                        setTargetPartnerId(partner.id)
                        setPayoutForm({ ...payoutForm, amount: partner.pendingPayout || '' })
                        setIsPayoutModalOpen(true)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 px-2.5 py-1.5 text-xs font-bold transition"
                    >
                      Pay Comm.
                    </button>
                    <button
                      onClick={() => handleOpenEditPartner(partner)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePartner(partner.id)}
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

      {/* TAB 2: REFERRED ORDERS LEDGER */}
      {activeTab === 'orders' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {allReferredOrders.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No referred orders recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Referred By (Partner)</th>
                    <th className="px-5 py-3.5">Client / Order Name</th>
                    <th className="px-5 py-3.5 text-right">Order Value (₹)</th>
                    <th className="px-5 py-3.5 text-right">Commission (₹)</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allReferredOrders.map((ord, idx) => (
                    <tr key={`${ord.id}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{fmtDate(ord.date)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                            {ord.partnerName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{ord.partnerName}</p>
                            <p className="text-[10px] text-slate-400">{ord.partnerCategory}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{ord.clientName}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">₹{(ord.orderAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-right font-black text-emerald-600 text-base">
                        +₹{(ord.commissionAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                          {ord.status || 'Approved'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMISSION PAYOUTS HISTORY */}
      {activeTab === 'payouts' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {allPayouts.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No commission payout records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Payment Date</th>
                    <th className="px-5 py-3.5">Partner Name</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Payment Mode</th>
                    <th className="px-5 py-3.5">Notes</th>
                    <th className="px-5 py-3.5 text-right">Settled Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allPayouts.map((pay, idx) => (
                    <tr key={`${pay.id}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{fmtDate(pay.date)}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{pay.partnerName}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">{pay.partnerCategory}</td>
                      <td className="px-5 py-4 text-xs">
                        <span className="inline-flex rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 font-bold">
                          {pay.mode}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 italic max-w-xs truncate">{pay.notes || '—'}</td>
                      <td className="px-5 py-4 text-right font-black text-violet-700 text-base">
                        ₹{(pay.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT REFERRAL PARTNER */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedPartner ? 'Edit Referral Partner' : 'Add Referral Partner'}
              </h2>
              <button onClick={() => setIsPartnerModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mestri Ramu or Er. Karthik"
                  value={partnerForm.name}
                  onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select
                    value={partnerForm.category}
                    onChange={e => setPartnerForm({ ...partnerForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500"
                  >
                    <option value="Mestri / Mason">Mestri / Mason</option>
                    <option value="Civil Engineer">Civil Engineer</option>
                    <option value="Interior Designer">Interior Designer</option>
                    <option value="Architect">Architect</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="3"
                    value={partnerForm.commissionValue}
                    onChange={e => setPartnerForm({ ...partnerForm, commissionValue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-blue-600 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="9894001122"
                    value={partnerForm.phone}
                    onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">UPI / Payment ID</label>
                  <input
                    type="text"
                    placeholder="ramu@upi or GPay"
                    value={partnerForm.upiId}
                    onChange={e => setPartnerForm({ ...partnerForm, upiId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Location / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Gandhipuram, Coimbatore"
                  value={partnerForm.location}
                  onChange={e => setPartnerForm({ ...partnerForm, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK REFERRED ORDER */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Link Referred Client Order</h2>
              <button onClick={() => setIsOrderModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReferredOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Referral Partner *</label>
                <select
                  value={targetPartnerId}
                  onChange={e => {
                    const pid = e.target.value
                    setTargetPartnerId(pid)
                    const partner = referrals.find(p => p.id === pid)
                    if (partner && orderForm.orderAmount) {
                      const comm = Math.round(parseFloat(orderForm.orderAmount) * (partner.commissionValue / 100))
                      setOrderForm({ ...orderForm, commissionAmount: comm })
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500"
                  required
                >
                  {referrals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category} - {p.commissionValue}%)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Client / Order Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Constructions"
                  value={orderForm.clientName}
                  onChange={e => setOrderForm({ ...orderForm, clientName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Order Value (₹) *</label>
                  <input
                    type="number"
                    placeholder="480000"
                    value={orderForm.orderAmount}
                    onChange={e => {
                      const val = e.target.value
                      const partner = referrals.find(p => p.id === targetPartnerId)
                      const commVal = partner ? partner.commissionValue : 3
                      const comm = val ? Math.round(parseFloat(val) * (commVal / 100)) : ''
                      setOrderForm({ ...orderForm, orderAmount: val, commissionAmount: comm })
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-extrabold text-slate-900 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Calculated Comm. (₹)</label>
                  <input
                    type="number"
                    placeholder="14400"
                    value={orderForm.commissionAmount}
                    onChange={e => setOrderForm({ ...orderForm, commissionAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-extrabold text-emerald-600 outline-none transition focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  Link Order & Credit Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD COMMISSION PAYOUT */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Record Commission Payout</h2>
              <button onClick={() => setIsPayoutModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayout} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Referral Partner *</label>
                <select
                  value={targetPartnerId}
                  onChange={e => {
                    const pid = e.target.value
                    setTargetPartnerId(pid)
                    const p = enrichedPartners.find(x => x.id === pid)
                    if (p) setPayoutForm({ ...payoutForm, amount: p.pendingPayout || '' })
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500"
                  required
                >
                  {enrichedPartners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Pending: ₹{p.pendingPayout.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Payout Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="6500"
                    value={payoutForm.amount}
                    onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-black text-violet-700 outline-none transition focus:border-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Payment Mode</label>
                  <select
                    value={payoutForm.mode}
                    onChange={e => setPayoutForm({ ...payoutForm, mode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Notes / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. July commission settlement via PhonePe"
                  value={payoutForm.notes}
                  onChange={e => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 shadow-sm transition"
                >
                  Record Settlement Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
