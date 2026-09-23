import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Calendar, Truck, User, Phone, MapPin, X, CheckCircle, Package, RotateCcw, Ban, AlertTriangle } from 'lucide-react'
import { cn, fmtDate, fmtTimestamp } from '@/lib/utils'

const STATUS_STYLE = {
  Confirmed:  'bg-blue-100 text-blue-700 border border-blue-200',
  Processing: 'bg-amber-100 text-amber-700 border border-amber-200',
  Dispatched: 'bg-violet-100 text-violet-700 border border-violet-200',
  Delivered:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Cancelled:  'bg-red-100 text-red-600 border border-red-200'
}

const CANCEL_REASONS = [
  'Customer Changed Mind',
  'Price / Budget Issue',
  'Delayed Delivery / Timing Issue',
  'Wrong Item / Specification',
  'Site Work Postponed',
  'Found Alternate Supplier',
  'Duplicate / Test Order',
  'Other Reason'
]

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [selectedReason, setSelectedReason] = useState('')
  const [customReasonText, setCustomReasonText] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  
  // Drawer Form State
  const [deliveryType, setDeliveryType] = useState('Today')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [transport, setTransport] = useState('Company')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [handleBy, setHandleBy] = useState('Staff 1')

  // Payment States — split payments
  const [splitPayments, setSplitPayments] = useState([{ amount: '', mode: '' }])
  const [balanceMode, setBalanceMode] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const parseAmount = (amtStr) => {
    if (!amtStr) return 0
    const clean = String(amtStr).replace(/[^\d]/g, '')
    return parseInt(clean) || 0
  }

  const addSplitRow = () => setSplitPayments(prev => [...prev, { amount: '', mode: '' }])

  const removeSplitRow = (idx) => setSplitPayments(prev => prev.filter((_, i) => i !== idx))

  const updateSplitRow = (idx, field, value) => {
    setSplitPayments(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const totalSplitPaid = () =>
    splitPayments.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

  const fetchOrders = () => {
    setLoading(true)
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching orders:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Open drawer and populate form state
  const handleOpenDrawer = (order) => {
    setSelectedOrder(order)
    setDeliveryType(order.deliveryType || 'Today')
    setDeliveryDate(order.delivery || '')
    setTransport(order.transport || 'Company')
    setVehicleInfo(order.vehicleInfo || '')
    setHandleBy(order.handleBy || 'Staff 1')

    // Payment init
    setSplitPayments(order.splitPayments && order.splitPayments.length > 0
      ? order.splitPayments
      : [{ amount: '', mode: '' }]
    )
    setBalanceMode(order.balanceMode || '')
    setPaymentNotes(order.paymentNotes || '')
  }

  const handleConfirmOrder = () => {
    if (!selectedOrder) return

    const totalVal = parseAmount(selectedOrder.total)
    const paidTotal = totalSplitPaid()
    const balanceAmt = totalVal - paidTotal

    // Validate: each split row that has amount must have mode
    for (let i = 0; i < splitPayments.length; i++) {
      const row = splitPayments[i]
      const amt = parseFloat(row.amount) || 0
      if (amt > 0 && !row.mode) {
        alert(`Row ${i + 1}: Please select a payment mode for the entered amount.`)
        return
      }
    }

    // Balance mode is optional now, no validation alert required.


    let finalDeliveryDate = ''
    const todayStr = new Date().toISOString().split('T')[0]
    if (deliveryType === 'Today') {
      finalDeliveryDate = todayStr
    } else if (deliveryType === 'Tomorrow') {
      finalDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    } else {
      finalDeliveryDate = deliveryDate || todayStr
    }

    // Build payment records from split rows
    const newPayments = splitPayments
      .filter(r => parseFloat(r.amount) > 0 && r.mode)
      .map((r, i) => ({
        id: r.id || `PAY-${Date.now().toString().slice(-5)}${i}`,
        date: r.date || new Date().toISOString(),
        amount: parseFloat(r.amount),
        mode: r.mode,
        ref: r.ref || 'Order Confirmation',
        notes: paymentNotes || r.notes || ''
      }))

    // Separate any non-confirmation payments (e.g. payments recorded later via Payments page)
    const existingPayments = Array.isArray(selectedOrder.payments) ? selectedOrder.payments : []
    const laterRecordedPayments = existingPayments.filter(p => p.ref !== 'Order Confirmation')
    const finalPayments = [...newPayments, ...laterRecordedPayments]

    const updatedOrder = {
      ...selectedOrder,
      status: 'Confirmed',
      deliveryType,
      delivery: finalDeliveryDate,
      transport,
      vehicleInfo,
      handleBy,
      splitPayments: finalPayments,
      paidAmount: finalPayments.reduce((s, p) => s + (p.mode !== 'Write Off' ? (parseFloat(p.amount) || 0) : 0), 0),
      balanceMode,
      paymentNotes,
      payments: finalPayments,
      confirmedAt: selectedOrder.confirmedAt || new Date().toISOString()
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
      .catch(err => console.error('Error updating order:', err))
  }

  const handleMarkDispatched = (order) => {
    const ok = window.confirm(`Confirm Dispatch\n\nMark order ${order.id} for "${order.customer}" as DISPATCHED now?\n\nClick OK to confirm.`)
    if (!ok) return
    const updated = { ...order, status: 'Dispatched', dispatchedAt: new Date().toISOString() }
    fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(data => setOrders(prev => prev.map(o => o.id === order.id ? data : o)))
      .catch(err => console.error('Error dispatching order:', err))
  }

  const handleMarkDelivered = (order) => {
    const ok = window.confirm(`Confirm Delivery\n\nMark order ${order.id} for "${order.customer}" as DELIVERED now?\n\nClick OK to confirm.`)
    if (!ok) return
    const updated = { ...order, status: 'Delivered', deliveredAt: new Date().toISOString() }
    fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(data => setOrders(prev => prev.map(o => o.id === order.id ? data : o)))
      .catch(err => console.error('Error delivering order:', err))
  }

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order)
    setSelectedReason('')
    setCustomReasonText('')
    setCancelError('')
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return

    let finalReason = selectedReason
    if (selectedReason === 'Other Reason') {
      finalReason = customReasonText.trim()
    } else if (customReasonText.trim()) {
      finalReason = selectedReason ? `${selectedReason} - ${customReasonText.trim()}` : customReasonText.trim()
    }

    if (!finalReason) {
      setCancelError('Please select or enter a reason for cancellation.')
      return
    }

    setIsSubmittingCancel(true)
    setCancelError('')

    const updated = {
      ...cancellingOrder,
      status: 'Cancelled',
      cancelReason: finalReason,
      cancelledAt: new Date().toISOString()
    }

    try {
      const res = await fetch(`/api/orders/${cancellingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      const data = await res.json()
      setOrders(prev => prev.map(o => o.id === cancellingOrder.id ? { ...o, ...updated } : o))
      if (selectedOrder && selectedOrder.id === cancellingOrder.id) {
        setSelectedOrder(prev => ({ ...prev, ...updated }))
      }
      setCancelModalOpen(false)
      setCancellingOrder(null)
    } catch (err) {
      console.error('Error cancelling order:', err)
      setCancelError('Failed to cancel order. Please try again.')
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  return (
    <div className="space-y-5 relative min-h-[80vh]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Sales Orders</h1>
          <p className="text-sm text-slate-500">Confirmed orders and dispatch tracking</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading Orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No orders yet. Mark a quotation as confirmed to add here.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                 {['Order #','Customer','Date','Items','Expected Delivery','Confirmed','Dispatched','Delivered','Status','Action'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o=>(
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{o.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800">{o.customer}</p>
                    {o.phone && <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5"><Phone className="h-2.5 w-2.5" />{o.phone}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{fmtDate(o.date)}</td>
                  <td className="px-5 py-3.5 text-slate-600">{o.items} items</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {o.status === 'Processing' ? (
                      <span className="text-slate-400 font-normal italic">Not planned yet</span>
                    ) : o.delivery ? (
                      fmtDate(o.delivery)
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Confirmed At */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {(() => {
                      const ts = fmtTimestamp(o.confirmedAt)
                      return ts ? (
                        <div>
                          <p className="text-[11px] font-semibold text-blue-700">{ts.date}</p>
                          <p className="text-[10px] text-blue-400">{ts.time}</p>
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>
                    })()}
                  </td>

                  {/* Dispatched At */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {(() => {
                      const ts = fmtTimestamp(o.dispatchedAt)
                      if (ts) return (
                        <div>
                          <p className="text-[11px] font-semibold text-violet-700">{ts.date}</p>
                          <p className="text-[10px] text-violet-400">{ts.time}</p>
                        </div>
                      )
                      // Only show Waiting if order is Confirmed (ready to dispatch)
                      if (o.status === 'Confirmed') return (
                        <button
                          onClick={() => handleMarkDispatched(o)}
                          className="text-[11px] font-semibold text-violet-400 border border-violet-200 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 rounded-full px-2.5 py-0.5 transition-all cursor-pointer animate-pulse"
                        >
                          ⏳ Waiting
                        </button>
                      )
                      return <span className="text-slate-200 text-xs">—</span>
                    })()}
                  </td>

                  {/* Delivered At */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {(() => {
                      const ts = fmtTimestamp(o.deliveredAt)
                      if (ts) return (
                        <div>
                          <p className="text-[11px] font-semibold text-emerald-700">{ts.date}</p>
                          <p className="text-[10px] text-emerald-400">{ts.time}</p>
                        </div>
                      )
                      // Only show Waiting if order has been dispatched
                      if (o.status === 'Dispatched') return (
                        <button
                          onClick={() => handleMarkDelivered(o)}
                          className="text-[11px] font-semibold text-emerald-400 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-full px-2.5 py-0.5 transition-all cursor-pointer animate-pulse"
                        >
                          ⏳ Waiting
                        </button>
                      )
                      return <span className="text-slate-200 text-xs">—</span>
                    })()}
                  </td>

                  <td className="px-4 py-3.5">
                    {o.status === 'Cancelled' ? (
                      <div className="space-y-1">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE.Cancelled)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          Cancelled
                        </span>
                        {o.cancelReason && (
                          <p className="text-[11px] text-red-600 font-medium max-w-[170px] truncate" title={o.cancelReason}>
                            🚫 {o.cancelReason}
                          </p>
                        )}
                        {o.cancelledAt && (
                          <p className="text-[10px] text-slate-400">
                            {fmtTimestamp(o.cancelledAt)?.date}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600')}>
                        {o.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDrawer(o)}
                        className={cn(
                          "text-xs font-semibold hover:underline transition-all whitespace-nowrap",
                          o.status === 'Processing' ? "text-amber-600 hover:text-amber-700" :
                          o.status === 'Cancelled' ? "text-slate-500 hover:text-slate-700" : "text-blue-600 hover:text-blue-700"
                        )}
                      >
                        {o.status === 'Processing' ? '📝 Plan Dispatch' : '🔍 View Details'}
                      </button>
                      {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                        <button
                          onClick={() => handleOpenCancelModal(o)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 whitespace-nowrap"
                          title="Cancel this order"
                        >
                          <Ban className="h-3 w-3" /> Cancel
                        </button>
                      )}
                      {(o.status === 'Delivered' || o.status === 'Dispatched') && (
                        <button
                          onClick={() => navigate(`/returns?billNo=${o.id}`)}
                          className="text-[11px] font-bold text-violet-600 hover:text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 whitespace-nowrap"
                          title="Process Sales Return for this order"
                        >
                          <RotateCcw className="h-3 w-3" /> Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Drawer Component ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Dispatch Planning &amp; Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Order Ref: <span className="font-mono font-bold text-slate-700">{selectedOrder.id}</span></p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Cancelled Banner if applicable */}
              {selectedOrder.status === 'Cancelled' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>This Order Has Been Cancelled</span>
                  </div>
                  {selectedOrder.cancelReason && (
                    <p className="text-xs text-red-800 font-medium">
                      <span className="font-semibold text-red-900">Reason: </span>
                      {selectedOrder.cancelReason}
                    </p>
                  )}
                  {selectedOrder.cancelledAt && (
                    <p className="text-[11px] text-red-600">
                      Cancelled on: {fmtTimestamp(selectedOrder.cancelledAt)?.date} at {fmtTimestamp(selectedOrder.cancelledAt)?.time}
                    </p>
                  )}
                </div>
              )}

              {/* Order Info Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{selectedOrder.customer}</h4>
                    {selectedOrder.phone && (
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500" /> {selectedOrder.phone}
                      </p>
                    )}
                    {selectedOrder.location && (
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" /> {selectedOrder.location}
                      </p>
                    )}
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[selectedOrder.status] || 'bg-slate-100 text-slate-600')}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-2 flex justify-between text-xs text-slate-600">
                  <span>Enquiry/Quotation ID: <strong className="font-mono">{selectedOrder.id}</strong></span>
                  <span>Date: <strong>{fmtDate(selectedOrder.date)}</strong></span>
                </div>
              </div>

              {/* Items List (if available from quotationItems) */}
              {selectedOrder.itemsList && selectedOrder.itemsList.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ordered Tiles / Products</label>
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Item Description</th>
                          <th className="py-2 px-3 text-center w-16">Qty</th>
                          <th className="py-2 px-3 text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.itemsList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">{item.description}</td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-semibold">{item.quantity} {item.unit || 'Boxes'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-800 font-bold">₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-sm font-bold text-blue-600 pr-3 mt-1">
                    Total Amt: {selectedOrder.total}
                  </div>
                </div>
              )}

              {/* Payment Planning Section — Split Payments */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Planning</h4>
                  <span className="text-xs font-bold text-slate-600">Order Total: {selectedOrder.total}</span>
                </div>

                {/* Split rows */}
                <div className="space-y-2">
                  {splitPayments.map((row, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16">Payment {idx + 1}</span>
                        {splitPayments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSplitRow(idx)}
                            className="ml-auto text-[10px] text-red-400 hover:text-red-600 font-semibold transition-colors"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      {/* Amount */}
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={row.amount}
                        onChange={e => updateSplitRow(idx, 'amount', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                      />

                      {/* Mode buttons */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Cash', 'UPI', 'Account Transfer', 'Cheque', 'EMI'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => updateSplitRow(idx, 'mode', mode)}
                            className={cn(
                              'rounded-lg border py-1.5 text-[11px] font-semibold transition-all',
                              row.mode === mode
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add split row button */}
                <button
                  type="button"
                  onClick={addSplitRow}
                  className="w-full rounded-lg border border-dashed border-blue-300 py-2 text-xs font-semibold text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  + Add Another Payment Method
                </button>

                {/* Live summary */}
                {(() => {
                  const total = parseAmount(selectedOrder.total)
                  const paid = totalSplitPaid()
                  const balance = total - paid
                  return (
                    <div className="rounded-xl overflow-hidden border border-slate-200 text-xs">
                      <div className="flex justify-between items-center px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                          Total Paid
                        </span>
                        <span className="font-extrabold text-emerald-700 text-sm">₹{paid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={cn(
                        'flex justify-between items-center px-4 py-3',
                        balance > 0 ? 'bg-red-50 border-l-4 border-red-500' : 'bg-emerald-50'
                      )}>
                        <span className={cn('font-bold text-sm', balance > 0 ? 'text-red-700' : 'text-emerald-700')}>
                          {balance > 0 ? '⚠ Remaining Balance' : '✓ Fully Paid'}
                        </span>
                        <span className={cn('font-black text-lg', balance > 0 ? 'text-red-600' : 'text-emerald-600')}>
                          ₹{balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Balance handling mode — only if balance exists */}
                {(() => {
                  const total = parseAmount(selectedOrder.total)
                  const balance = total - totalSplitPaid()
                  if (balance <= 0) return null
                  return (
                    <div className="rounded-xl border-2 border-red-200 bg-red-50/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-red-700">
                          Balance ₹{balance.toLocaleString('en-IN')} — How will it be paid? <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Cash', 'UPI', 'Account Transfer', 'Cheque', 'EMI', 'Credit'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setBalanceMode(mode)}
                            className={cn(
                              'rounded-lg border py-2 text-xs font-semibold transition-all',
                              balanceMode === mode
                                ? 'bg-red-600 border-red-600 text-white shadow-sm font-bold'
                                : 'border-red-200 bg-white text-red-700 hover:border-red-400 hover:bg-red-50'
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Payment Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Remarks / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. GPay Ref, Cheque No, notes..."
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Dispatch form fields — only editable if in Processing or updating */}
              <div className="space-y-4">
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Delivery Planning</h4>
                </div>

                {/* When to Deliver */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">When to Deliver</label>
                  <div className="flex gap-2">
                    {['Today', 'Tomorrow', 'Specific Date'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeliveryType(type)}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-sm font-semibold transition-all',
                          deliveryType === type
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Date input */}
                {deliveryType === 'Specific Date' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Choose Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all"
                    />
                  </div>
                )}

                {/* Transport Arrangement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Transport Arrangement</label>
                  <div className="flex gap-2">
                    {['Company', 'Customer'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTransport(t)}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-sm font-semibold transition-all',
                          transport === t
                            ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                        )}
                      >
                        {t === 'Company' ? '🚚 Company Arrange' : '👤 Customer Arrange'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Vehicle Details</label>
                  <input
                    type="text"
                    placeholder="e.g. TN-34-AB-1234 (Tata Ace)"
                    value={vehicleInfo}
                    onChange={e => setVehicleInfo(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Who gonna handle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Who Gonna Handle (Staff)</label>
                  <select
                    value={handleBy}
                    onChange={e => setHandleBy(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all"
                  >
                    {['Manager', 'Staff 1', 'Staff 2', 'Staff 3'].map(staff => (
                      <option key={staff} value={staff}>{staff}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>

              {selectedOrder.status !== 'Cancelled' && (
                <>
                  {selectedOrder.status !== 'Delivered' && (
                    <button
                      onClick={() => handleOpenCancelModal(selectedOrder)}
                      className="px-4 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 py-2.5 text-sm font-semibold text-red-600 transition-colors"
                    >
                      <Ban className="h-4 w-4" /> Cancel Order
                    </button>
                  )}
                  <button
                    onClick={handleConfirmOrder}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" /> Confirm Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Order Modal ── */}
      {cancelModalOpen && cancellingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Cancel Order</h3>
                  <p className="text-xs text-slate-500 font-mono">{cancellingOrder.id} • {cancellingOrder.customer}</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-red-100/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Reason <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CANCEL_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason)
                          setCancelError('')
                        }}
                        className={cn(
                          "text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                          isSelected
                            ? "bg-red-600 text-white border-red-600 shadow-xs font-semibold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {reason}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {selectedReason === 'Other Reason' ? 'Specify Reason *' : 'Additional Remarks / Reason Note'}
                </label>
                <textarea
                  rows={3}
                  value={customReasonText}
                  onChange={(e) => {
                    setCustomReasonText(e.target.value)
                    setCancelError('')
                  }}
                  placeholder={selectedReason === 'Other Reason' ? "Explain why this order is being cancelled..." : "Enter additional details or remarks (optional)..."}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
              >
                {isSubmittingCancel ? (
                  <>Cancelling...</>
                ) : (
                  <>
                    <Ban className="h-3.5 w-3.5" /> Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
