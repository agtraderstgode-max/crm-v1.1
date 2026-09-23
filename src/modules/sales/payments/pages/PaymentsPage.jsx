import { useState, useEffect } from 'react'
import { Search, IndianRupee, CreditCard, ArrowDownRight, Phone, MapPin, X, Check, Calendar } from 'lucide-react'
import { cn, fmtDate, fmtTimestamp } from '@/lib/utils'

const STATUS_STYLE = {
  'Fully Paid': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Partial':    'bg-amber-100 text-amber-700 border border-amber-200',
  'Unpaid':     'bg-red-100 text-red-600 border border-red-200',
}

export function PaymentsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // Record Payment Form State
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState('UPI')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

  // Write Off State
  const [modalTab, setModalTab] = useState('payment') // 'payment' | 'writeoff'
  const [writeOffAmount, setWriteOffAmount] = useState('')
  const [writeOffReason, setWriteOffReason] = useState('')

  // Collections Tab View (Today vs Yesterday vs Custom vs All)
  const [collectionTab, setCollectionTab] = useState('today') // 'today' | 'yesterday' | 'custom' | 'all'
  const [customFilterDate, setCustomFilterDate] = useState(() => {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    return new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
  })

  const fetchOrders = () => {
    setLoading(true)
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching orders in payments:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Helper to parse currency string (e.g. "₹4,80,000" -> 480000)
  const parseAmount = (amtStr) => {
    if (!amtStr) return 0
    const clean = amtStr.replace(/[^\d]/g, '')
    return parseInt(clean) || 0
  }

  // Calculate order payments details
  const getOrderPaymentInfo = (order) => {
    const total = parseAmount(order.total)
    let payments = Array.isArray(order.payments) && order.payments.length > 0
      ? order.payments
      : (Array.isArray(order.splitPayments) ? order.splitPayments : [])
    const paid = payments.reduce((sum, p) => sum + (p.mode !== 'Write Off' ? (parseFloat(p.amount) || 0) : 0), 0)
    const writeOff = payments.reduce((sum, p) => sum + (p.mode === 'Write Off' ? (parseFloat(p.amount) || 0) : 0), 0)
    const balance = Math.max(0, total - paid - writeOff)
    let status = 'Unpaid'
    if (paid > 0 || writeOff > 0) {
      status = balance <= 0 ? 'Fully Paid' : 'Partial'
    }
    return { total, paid, balance, status, writeOff }
  }

  // Days from delivery → fully paid date (frozen) OR delivery → today (live)
  const getPendingDays = (order, balance, total) => {
    if (!order.deliveredAt) return null

    const delivered = new Date(order.deliveredAt)
    delivered.setHours(0, 0, 0, 0)

    let endDate
    let isSettled = false

    if (balance <= 0) {
      // Find the payment that completed full payment
      const rawPayments = Array.isArray(order.payments) && order.payments.length > 0
        ? order.payments
        : (Array.isArray(order.splitPayments) ? order.splitPayments : [])
      const payments = [...rawPayments]
        .filter(p => p.mode !== 'Write Off')
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      let cumulative = 0
      let paidDate = null
      for (const p of payments) {
        cumulative += parseFloat(p.amount) || 0
        if (cumulative >= total) {
          paidDate = new Date(p.date || 0)
          paidDate.setHours(0, 0, 0, 0)
          break
        }
      }
      endDate = paidDate || new Date()
      isSettled = true
    } else {
      endDate = new Date()
      endDate.setHours(0, 0, 0, 0)
    }

    const days = Math.max(0, Math.round((endDate - delivered) / (1000 * 60 * 60 * 24)))
    return { days, isSettled }
  }

  const handleOpenRecord = (order) => {
    setSelectedOrder(order)
    setModalTab('payment')
    setPayAmount('')
    setPayMode('UPI')
    setPayRef('')
    setPayNotes('')
    setWriteOffAmount('')
    setWriteOffReason('')
  }

  const handleSavePayment = (e) => {
    e.preventDefault()
    if (!selectedOrder || !payAmount) return

    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount!")
      return
    }

    const { balance } = getOrderPaymentInfo(selectedOrder)
    if (amt > balance) {
      const confirmOverpay = confirm(`Entering ₹${amt.toLocaleString('en-IN')} which is more than outstanding balance of ₹${balance.toLocaleString('en-IN')}. Proceed anyway?`)
      if (!confirmOverpay) return
    }

    const newPayment = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      amount: amt,
      mode: payMode,
      ref: payRef,
      notes: payNotes
    }

    const currentPayments = Array.isArray(selectedOrder.payments) && selectedOrder.payments.length > 0
      ? selectedOrder.payments
      : (Array.isArray(selectedOrder.splitPayments) ? selectedOrder.splitPayments.map((p, i) => ({
          id: p.id || `PAY-${selectedOrder.id}-${i+1}`,
          date: p.date || selectedOrder.confirmedAt || new Date().toISOString(),
          amount: parseFloat(p.amount) || 0,
          mode: p.mode || 'Cash',
          ref: p.ref || 'Order Confirmation',
          notes: p.notes || ''
        })).filter(p => p.amount > 0) : [])

    const updatedPayments = [...currentPayments, newPayment]
    const updatedOrder = {
      ...selectedOrder,
      payments: updatedPayments,
      splitPayments: updatedPayments
    }

    fetch(`/api/orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    })
      .then(res => res.json())
      .then(data => {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? data : o))
        setSelectedOrder(null)
      })
      .catch(err => console.error("Error saving payment:", err))
  }

  const handleWriteOff = () => {
    if (!selectedOrder) return
    const amt = parseFloat(writeOffAmount)
    const { balance } = getOrderPaymentInfo(selectedOrder)
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid write-off amount.')
      return
    }
    if (amt > balance) {
      alert(`Write-off amount ₹${amt.toLocaleString('en-IN')} cannot exceed remaining balance ₹${balance.toLocaleString('en-IN')}.`)
      return
    }
    const ok = window.confirm(
      `Write Off Confirmation\n\nAre you sure you want to write off ₹${amt.toLocaleString('en-IN')} for order ${selectedOrder.id} (${selectedOrder.customer})?\n\nThis amount will be treated as a business loss and closed.\n\nClick OK to confirm.`
    )
    if (!ok) return

    const writeOffEntry = {
      id: `WO-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      amount: amt,
      mode: 'Write Off',
      ref: '',
      notes: writeOffReason || 'Amount written off'
    }

    const currentPayments = Array.isArray(selectedOrder.payments) && selectedOrder.payments.length > 0
      ? selectedOrder.payments
      : (Array.isArray(selectedOrder.splitPayments) ? selectedOrder.splitPayments.map((p, i) => ({
          id: p.id || `PAY-${selectedOrder.id}-${i+1}`,
          date: p.date || selectedOrder.confirmedAt || new Date().toISOString(),
          amount: parseFloat(p.amount) || 0,
          mode: p.mode || 'Cash',
          ref: p.ref || 'Order Confirmation',
          notes: p.notes || ''
        })).filter(p => p.amount > 0) : [])

    const updatedPayments = [...currentPayments, writeOffEntry]
    const updatedOrder = {
      ...selectedOrder,
      payments: updatedPayments,
      splitPayments: updatedPayments,
      writeOffAmount: (selectedOrder.writeOffAmount || 0) + amt,
      writeOffAt: new Date().toISOString()
    }
    fetch(`/api/orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    })
      .then(res => res.json())
      .then(data => {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? data : o))
        setSelectedOrder(null)
      })
      .catch(err => console.error('Error writing off:', err))
  }

  // Sort orders: delivered ones first (sorted by deliveredAt descending, newest first), then undelivered ones (sorted by ID descending)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.deliveredAt && b.deliveredAt) {
      return new Date(b.deliveredAt) - new Date(a.deliveredAt)
    }
    if (a.deliveredAt) return -1
    if (b.deliveredAt) return 1
    return b.id.localeCompare(a.id)
  })

  // Filter orders by search query
  const filteredOrders = sortedOrders.filter(o => {
    const q = search.toLowerCase()
    return o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || (o.phone || '').includes(q)
  })

  // Global calculations
  let totalOutstanding = 0
  let totalCollected = 0
  let todayCollected = 0
  let allPaymentsList = []

  // Helper to check if date matches today's local date
  const isToday = (dateStr) => {
    if (!dateStr) return false
    try {
      if (dateStr.length === 10 && !dateStr.includes('T') && !dateStr.includes(':')) {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        return dateStr === `${y}-${m}-${d}`
      }
      const d = new Date(dateStr)
      const today = new Date()
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear()
    } catch {
      return false
    }
  }

  // Helper to check if date matches yesterday's local date
  const isYesterday = (dateStr) => {
    if (!dateStr) return false
    try {
      if (dateStr.length === 10 && !dateStr.includes('T') && !dateStr.includes(':')) {
        const yes = new Date()
        yes.setDate(yes.getDate() - 1)
        const y = yes.getFullYear()
        const m = String(yes.getMonth() + 1).padStart(2, '0')
        const d = String(yes.getDate()).padStart(2, '0')
        return dateStr === `${y}-${m}-${d}`
      }
      const d = new Date(dateStr)
      const yes = new Date()
      yes.setDate(yes.getDate() - 1)
      return d.getDate() === yes.getDate() &&
             d.getMonth() === yes.getMonth() &&
             d.getFullYear() === yes.getFullYear()
    } catch {
      return false
    }
  }

  // Helper to check if date matches a custom local date string (YYYY-MM-DD)
  const isSpecificDate = (dateStr, targetDateStr) => {
    if (!dateStr || !targetDateStr) return false
    try {
      const [ty, tm, td] = targetDateStr.split('-').map(Number)
      if (dateStr.length === 10 && !dateStr.includes('T') && !dateStr.includes(':')) {
        return dateStr === targetDateStr
      }
      const d = new Date(dateStr)
      return d.getDate() === td &&
             d.getMonth() === (tm - 1) &&
             d.getFullYear() === ty
    } catch {
      return false
    }
  }

  orders.forEach(o => {
    const { paid, balance } = getOrderPaymentInfo(o)
    totalOutstanding += balance
    totalCollected += paid
    
    const pList = (Array.isArray(o.payments) && o.payments.length > 0)
      ? o.payments
      : (Array.isArray(o.splitPayments) ? o.splitPayments : [])

    pList.forEach((p, idx) => {
      const amt = parseFloat(p.amount) || 0
      if (amt <= 0 && !p.mode) return
      const paymentItem = {
        id: p.id || `PAY-${o.id}-${idx + 1}`,
        date: p.date || o.confirmedAt || o.date || new Date().toISOString(),
        amount: amt,
        mode: p.mode || 'Cash',
        ref: p.ref || 'Order Confirmation',
        notes: p.notes || '',
        orderId: o.id,
        customer: o.customer
      }
      allPaymentsList.push(paymentItem)

      if (paymentItem.mode !== 'Write Off') {
        if (isToday(paymentItem.date)) {
          todayCollected += amt
        }
      }
    })
  })

  // Sort transactions by date and time descending (newest on top)
  allPaymentsList.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0
    const timeB = b.date ? new Date(b.date).getTime() : 0
    if (timeA === timeB) {
      return b.id.localeCompare(a.id)
    }
    return timeB - timeA
  })

  // Calculate values for yesterday and custom date
  let yesterdayCollected = 0
  let customCollected = 0
  allPaymentsList.forEach(p => {
    if (p.mode !== 'Write Off') {
      const amt = parseFloat(p.amount) || 0
      if (isYesterday(p.date)) yesterdayCollected += amt
      if (isSpecificDate(p.date, customFilterDate)) customCollected += amt
    }
  })

  let displayedPaymentsList = []
  if (collectionTab === 'today') {
    displayedPaymentsList = allPaymentsList.filter(p => isToday(p.date))
  } else if (collectionTab === 'yesterday') {
    displayedPaymentsList = allPaymentsList.filter(p => isYesterday(p.date))
  } else if (collectionTab === 'custom') {
    displayedPaymentsList = allPaymentsList.filter(p => isSpecificDate(p.date, customFilterDate))
  } else {
    displayedPaymentsList = allPaymentsList
  }

  return (
    <div className="space-y-6">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Payments &amp; Collections</h1>
          <p className="text-sm text-slate-500">Track collections, record payments and manage outstanding balances</p>
        </div>
        <div className="flex flex-wrap items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5 self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setCollectionTab('today')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              collectionTab === 'today'
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Today
          </button>
          <button
            onClick={() => setCollectionTab('yesterday')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
              collectionTab === 'yesterday'
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Yesterday
          </button>
          <div className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all border",
            collectionTab === 'custom'
              ? "bg-white border-slate-200 text-slate-800 shadow-xs"
              : "border-transparent text-slate-500"
          )}>
            <button onClick={() => setCollectionTab('custom')} className="cursor-pointer hover:text-slate-800">
              📅 Custom
            </button>
            {collectionTab === 'custom' && (
              <input
                type="date"
                value={customFilterDate}
                onChange={(e) => setCustomFilterDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-700 outline-none focus:border-blue-400"
              />
            )}
          </div>
          <button
            onClick={() => setCollectionTab('all')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
              collectionTab === 'all'
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            All Collections
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Widget 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {collectionTab === 'today' ? "Today's Collection" :
               collectionTab === 'yesterday' ? "Yesterday's Collection" :
               collectionTab === 'custom' ? `Collection (${fmtDate(customFilterDate)})` :
               "Total Collected"}
            </p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              ₹{(collectionTab === 'today' ? todayCollected :
                 collectionTab === 'yesterday' ? yesterdayCollected :
                 collectionTab === 'custom' ? customCollected :
                 totalCollected).toLocaleString('en-IN')}
            </h3>

          </div>
        </div>

        {/* Widget 2 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-red-50 p-3 text-red-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Widget 3 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">{orders.length} Active Orders</h3>
          </div>
        </div>
      </div>

      {/* Grid: Payments Table & Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left 2 cols: Orders Payment Status Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Order Balances &amp; Payments</h2>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm w-64">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, order no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-xs outline-none text-slate-600 bg-transparent placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">Loading payments...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm">No orders matching search filter.</div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Order #', 'Customer', 'Total', 'Paid', 'Balance', 'Delivered', 'Delayed', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => {
                    const { total, paid, balance, status } = getOrderPaymentInfo(o)
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{o.id}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800 text-xs">{o.customer}</p>
                          {o.phone && <p className="text-[10px] text-slate-400 font-normal mt-0.5">{o.phone}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-medium text-slate-700 whitespace-nowrap">₹{total.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-emerald-600 whitespace-nowrap">₹{paid.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-red-600 whitespace-nowrap">₹{balance.toLocaleString('en-IN')}</td>

                        {/* Delivered Date */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {o.deliveredAt ? (() => {
                            const ts = fmtTimestamp(o.deliveredAt)
                            const date = ts?.date
                            const time = ts?.time
                            return (
                              <div>
                                <p className="text-[10px] font-semibold text-emerald-700">{date}</p>
                                <p className="text-[10px] text-emerald-400">{time}</p>
                              </div>
                            )
                          })() : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        {/* Pending Days since delivery */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {(() => {
                            const result = getPendingDays(o, balance, total)
                            if (result === null) return <span className="text-slate-300 text-xs">—</span>

                            const { days, isSettled } = result

                            if (isSettled) {
                              // Frozen — paid in X days
                              const color = days <= 1
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : days <= 3
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : days <= 7
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                              return (
                                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold', color)}>
                                  ✓ {days} day{days !== 1 ? 's' : ''}
                                </span>
                              )
                            }

                            // Live — still pending
                            const color = days === 0
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : days <= 3
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : days <= 7
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                            const label = days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''}`
                            return (
                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold', color)}>
                                {days > 7 ? '🔴' : days > 3 ? '🟠' : days > 0 ? '🟡' : '🟢'} {label}
                              </span>
                            )
                          })()}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', STATUS_STYLE[status])}>
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {balance <= 0 ? (
                            <button
                              onClick={() => handleOpenRecord(o)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 whitespace-nowrap transition-colors"
                            >
                              <Check className="h-3 w-3" /> View Details
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRecord(o)}
                              className="text-xs font-semibold text-blue-600 hover:underline hover:text-blue-700 whitespace-nowrap"
                            >
                              💵 Record Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 col: Recent Payments feed */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            {collectionTab === 'today' ? "Today's Collections" :
             collectionTab === 'yesterday' ? "Yesterday's Collections" :
             collectionTab === 'custom' ? `Collections (${fmtDate(customFilterDate)})` :
             "Recent Collections"}
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {displayedPaymentsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-10">
                {collectionTab === 'today' ? "No collections recorded today" :
                 collectionTab === 'yesterday' ? "No collections recorded yesterday" :
                 collectionTab === 'custom' ? "No collections on this date" :
                 "No collections recorded yet"}
              </p>
            ) : (
              displayedPaymentsList.map(p => (
                <div key={p.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{p.customer}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Order Ref: <span className="font-mono text-slate-600">{p.orderId}</span></p>
                    <p className="text-[10px] text-slate-400">Mode: <strong className="text-slate-600">{p.mode}</strong> · Ref: <span className="text-slate-600 font-mono">{p.ref || '—'}</span></p>
                    {p.notes && <p className="text-[10px] text-slate-500 italic mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{p.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600 block">+ ₹{p.amount.toLocaleString('en-IN')}</span>
                    {(() => {
                      if (p.date && (p.date.includes('T') || p.date.includes(':'))) {
                        const ts = fmtTimestamp(p.date)
                        if (ts) {
                          return (
                            <div className="text-[9px] text-slate-400 mt-0.5 leading-none">
                              <span className="font-semibold text-slate-600">{ts.date}</span>
                              <span className="block text-[8px] mt-0.5">{ts.time}</span>
                            </div>
                          )
                        }
                      }
                      return <span className="text-[9px] text-slate-400 mt-1 block">{fmtDate(p.date)}</span>
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header — Customer Info Card */}
            <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Record Payment</h3>
                  <p className="text-lg font-extrabold text-blue-700 mt-0.5">{selectedOrder.customer}</p>
                  <div className="flex flex-col gap-1 mt-1.5">
                    {selectedOrder.phone && (
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {selectedOrder.phone}
                      </p>
                    )}
                    {selectedOrder.location && (
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> {selectedOrder.location}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors mt-0.5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tab Switcher — only for unpaid/partial orders */}
            {getOrderPaymentInfo(selectedOrder).balance > 0 ? (
              <div className="flex border-b border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setModalTab('payment')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold tracking-wide uppercase transition-all',
                    modalTab === 'payment'
                      ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  💳 Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('writeoff')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold tracking-wide uppercase transition-all',
                    modalTab === 'writeoff'
                      ? 'text-orange-700 border-b-2 border-orange-500 bg-orange-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                ✂️ Write Off
              </button>
            </div>
            ) : (
              /* Fully Paid — view-only banner */
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white flex-shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Payment Complete</p>
                  <p className="text-[10px] text-emerald-600">All payments settled. View full history below.</p>
                </div>
              </div>
            )}

            {/* Form Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Order Summary + Payment History */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden text-xs">
                {/* Order ref row */}
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-200">
                  <span className="text-slate-500">Order Ref</span>
                  <span className="font-mono font-bold text-slate-800">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-200">
                  <span className="text-slate-500">Order Total</span>
                  <span className="font-bold text-slate-800">{selectedOrder.total}</span>
                </div>

                {/* Previous payments */}
                {(() => {
                  const prevList = (Array.isArray(selectedOrder.payments) && selectedOrder.payments.length > 0
                    ? selectedOrder.payments
                    : (Array.isArray(selectedOrder.splitPayments) ? selectedOrder.splitPayments : [])
                  ).filter(p => (parseFloat(p.amount) || 0) > 0)

                  if (prevList.length === 0) return null

                  return (
                    <div className="border-b border-slate-200">
                      <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100">Previous Payments</p>
                      {prevList.map((p, i) => (
                        <div key={p.id || i} className="flex justify-between items-center px-4 py-2 border-b border-slate-100 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            {(() => {
                              const dateVal = p.date || selectedOrder.confirmedAt || selectedOrder.date
                              if (dateVal && (dateVal.includes('T') || dateVal.includes(':'))) {
                                const ts = fmtTimestamp(dateVal)
                                if (ts) {
                                  return (
                                    <div className="flex flex-col text-[11px] leading-tight">
                                      <span className="text-slate-700 font-semibold">{ts.date}</span>
                                      <span className="text-[9px] text-slate-400">{ts.time}</span>
                                    </div>
                                  )
                                }
                              }
                              return <span className="text-slate-500">{fmtDate(dateVal)}</span>
                            })()}
                            <span className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold',
                              p.mode === 'Write Off' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            )}>{p.mode || 'Cash'}</span>
                            {p.ref && <span className="text-[10px] text-slate-400 font-normal">({p.ref})</span>}
                          </div>
                          <span className={cn('font-bold', p.mode === 'Write Off' ? 'text-orange-600' : 'text-emerald-600')}>
                            {p.mode === 'Write Off' ? '✂ ' : '+ '}₹{(parseFloat(p.amount) || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="font-semibold text-slate-600">Remaining Balance</span>
                  <span className="text-base font-extrabold text-red-600">₹{getOrderPaymentInfo(selectedOrder).balance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* ── PAYMENT TAB ── */}
              {modalTab === 'payment' && (
                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount to Record (₹) <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['UPI', 'Cash', 'Card', 'Bank'].map(mode => (
                        <button key={mode} type="button" onClick={() => setPayMode(mode)}
                          className={cn('rounded-lg border py-2 text-xs font-semibold transition-all',
                            payMode === mode ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                          )}>{mode}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Transaction Ref / Cheque No.</label>
                    <input type="text" placeholder="e.g. UPI Ref / Bank Tx ID / Cheque #"
                      value={payRef} onChange={e => setPayRef(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks / Payment Notes</label>
                    <input type="text" placeholder="e.g. Advanced payment / Part payment"
                      value={payNotes} onChange={e => setPayNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="flex gap-3 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => setSelectedOrder(null)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                    <button type="submit"
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm">Save Payment</button>
                  </div>
                </form>
              )}

              {/* ── WRITE OFF TAB ── */}
              {modalTab === 'writeoff' && (
                <div className="space-y-4">
                  {/* Warning banner */}
                  <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex gap-3 items-start">
                    <span className="text-orange-500 text-lg mt-0.5">⚠️</span>
                    <div>
                      <p className="text-xs font-bold text-orange-800">Write Off — Bad Debt</p>
                      <p className="text-[11px] text-orange-600 mt-0.5 leading-relaxed">
                        Use this when the customer will not pay the remaining balance. The amount will be recorded as a business loss.
                      </p>
                    </div>
                  </div>

                  {/* Write-off amount */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-500">Write-Off Amount (₹) <span className="text-red-400">*</span></label>
                      <button type="button"
                        onClick={() => setWriteOffAmount(String(getOrderPaymentInfo(selectedOrder).balance))}
                        className="text-[10px] font-bold text-orange-600 hover:underline">
                        Use full balance ₹{getOrderPaymentInfo(selectedOrder).balance.toLocaleString('en-IN')}
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Max ₹${getOrderPaymentInfo(selectedOrder).balance.toLocaleString('en-IN')}`}
                      value={writeOffAmount}
                      onChange={e => setWriteOffAmount(e.target.value)}
                      className="w-full rounded-lg border-2 border-orange-200 bg-orange-50/40 px-3 py-2.5 text-sm font-bold text-orange-700 outline-none focus:border-orange-400 transition-all placeholder:text-orange-300"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason for Write-Off</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Customer went bankrupt, small amount waived for goodwill, uncontactable customer..."
                      value={writeOffReason}
                      onChange={e => setWriteOffReason(e.target.value)}
                      className="w-full rounded-lg border border-orange-200 bg-orange-50/30 px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 transition-all placeholder:text-orange-300 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 border-t border-orange-100 pt-4">
                    <button type="button" onClick={() => setSelectedOrder(null)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                    <button type="button" onClick={handleWriteOff}
                      className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 py-2.5 text-sm font-bold text-white transition-colors shadow-sm">
                      ✂️ Confirm Write Off
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
