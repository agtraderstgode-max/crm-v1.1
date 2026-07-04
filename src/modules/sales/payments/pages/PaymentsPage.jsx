import { useState, useEffect } from 'react'
import { Plus, Search, DollarSign, CreditCard, ArrowDownRight, User, Phone, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    const payments = order.payments || []
    const paid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const balance = total - paid
    let status = 'Unpaid'
    if (paid > 0) {
      status = balance <= 0 ? 'Fully Paid' : 'Partial'
    }
    return { total, paid, balance, status }
  }

  const handleOpenRecord = (order) => {
    setSelectedOrder(order)
    setPayAmount('')
    setPayMode('UPI')
    setPayRef('')
    setPayNotes('')
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
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      mode: payMode,
      ref: payRef,
      notes: payNotes
    }

    const updatedPayments = [...(selectedOrder.payments || []), newPayment]
    const updatedOrder = {
      ...selectedOrder,
      payments: updatedPayments
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

  // Filter orders by search query
  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase()
    return o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || (o.phone || '').includes(q)
  })

  // Global calculations
  let totalOutstanding = 0
  let totalCollected = 0
  let allPaymentsList = []

  orders.forEach(o => {
    const { paid, balance } = getOrderPaymentInfo(o)
    totalOutstanding += balance
    totalCollected += paid
    
    if (o.payments) {
      o.payments.forEach(p => {
        allPaymentsList.push({
          ...p,
          orderId: o.id,
          customer: o.customer
        })
      })
    }
  })

  // Sort transactions by date descending
  allPaymentsList.sort((a, b) => b.id.localeCompare(a.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Payments &amp; Collections</h1>
        <p className="text-sm text-slate-500">Track collections, record payments and manage outstanding balances</p>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Widget 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">₹{totalCollected.toLocaleString('en-IN')}</h3>
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
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Order #', 'Customer', 'Order Total', 'Paid Amount', 'Balance', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => {
                    const { total, paid, balance, status } = getOrderPaymentInfo(o)
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{o.id}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {o.customer}
                          {o.phone && <p className="text-[10px] text-slate-400 font-normal mt-0.5">{o.phone}</p>}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">₹{total.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600">₹{paid.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', STATUS_STYLE[status])}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {balance <= 0 ? (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5"><Check className="h-3 w-3" /> Fully Paid</span>
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
            )}
          </div>
        </div>

        {/* Right 1 col: Recent Payments feed */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">Recent Collections</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {allPaymentsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-10">No collections recorded yet</p>
            ) : (
              allPaymentsList.map(p => (
                <div key={p.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{p.customer}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Order Ref: <span className="font-mono text-slate-600">{p.orderId}</span></p>
                    <p className="text-[10px] text-slate-400">Mode: <strong className="text-slate-600">{p.mode}</strong> · Ref: <span className="text-slate-600 font-mono">{p.ref || '—'}</span></p>
                    {p.notes && <p className="text-[10px] text-slate-500 italic mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{p.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600 block">+ ₹{p.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">{p.date}</span>
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Customer: <strong className="text-slate-700">{selectedOrder.customer}</strong></p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              {/* Order total balance display */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                <div>
                  Order Ref: <strong className="font-mono text-slate-800">{selectedOrder.id}</strong>
                </div>
                <div>
                  Order Total: <strong className="text-slate-800">{selectedOrder.total}</strong>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1 flex justify-between text-sm">
                  <span>Remaining Balance:</span>
                  <span className="font-bold text-red-600">₹{getOrderPaymentInfo(selectedOrder).balance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Amount to Pay */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount to Record (₹) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all font-bold text-emerald-600"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {['UPI', 'Cash', 'Card', 'Bank'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={cn(
                        'rounded-lg border py-2 text-xs font-semibold transition-all',
                        payMode === mode
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Bank Tx ID / Cheque #"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks / Payment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced payment / Part payment"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
