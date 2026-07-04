import { useState, useEffect } from 'react'
import { ShoppingCart, Calendar, Truck, User, Phone, MapPin, X, CheckCircle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_STYLE = {
  Confirmed:  'bg-blue-100 text-blue-700 border border-blue-200',
  Processing: 'bg-amber-100 text-amber-700 border border-amber-200',
  Dispatched: 'bg-violet-100 text-violet-700 border border-violet-200',
  Delivered:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Cancelled:  'bg-red-100 text-red-600 border border-red-200'
}

function formatDeliveryDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    if (dateStr === todayStr) return 'Today'
    if (dateStr === tomorrowStr) return 'Tomorrow'

    const dateObj = new Date(dateStr)
    if (isNaN(dateObj.getTime())) return dateStr
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[dateObj.getDay()]
    const parts = dateStr.split('-')
    let formattedDate = dateStr
    if (parts.length === 3) {
      formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}` // Format as DD-MM-YYYY
    }
    return `${formattedDate} (${dayName})`
  } catch (e) {
    return dateStr
  }
}

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // Drawer Form State
  const [deliveryType, setDeliveryType] = useState('Today')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [transport, setTransport] = useState('Company')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [handleBy, setHandleBy] = useState('Staff 1')

  // Payment States
  const [paidAmount, setPaidAmount] = useState('')
  const [paidMode, setPaidMode] = useState('')
  const [balanceMode, setBalanceMode] = useState('')

  const parseAmount = (amtStr) => {
    if (!amtStr) return 0
    const clean = amtStr.replace(/[^\d]/g, '')
    return parseInt(clean) || 0
  }

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
    setPaidAmount(order.paidAmount !== undefined ? order.paidAmount : '')
    setPaidMode(order.paidMode || '')
    setBalanceMode(order.balanceMode || '')
  }

  const handleConfirmOrder = () => {
    if (!selectedOrder) return

    const totalVal = parseAmount(selectedOrder.total)
    const paidAmtVal = parseFloat(paidAmount) || 0
    const balanceAmtVal = totalVal - paidAmtVal

    // Validation
    if (paidAmtVal > 0 && !paidMode) {
      alert("Mandatory: Please select payment mode for the paid amount!")
      return
    }
    if (balanceAmtVal > 0 && !balanceMode) {
      alert("Mandatory: Please select payment mode for the remaining balance!")
      return
    }

    let finalDeliveryDate = ''
    const todayStr = new Date().toISOString().split('T')[0]
    if (deliveryType === 'Today') {
      finalDeliveryDate = todayStr
    } else if (deliveryType === 'Tomorrow') {
      finalDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    } else {
      finalDeliveryDate = deliveryDate || todayStr
    }

    // Payment record for collections feed
    const newPayments = []
    if (paidAmtVal > 0) {
      newPayments.push({
        id: `PAY-${Date.now().toString().slice(-6)}`,
        date: todayStr,
        amount: paidAmtVal,
        mode: paidMode,
        ref: 'Order Confirmation',
        notes: 'Recorded during order dispatch planning'
      })
    }

    const updatedOrder = {
      ...selectedOrder,
      status: 'Confirmed',
      deliveryType,
      delivery: finalDeliveryDate,
      transport,
      vehicleInfo,
      handleBy,
      paidAmount: paidAmtVal,
      paidMode,
      balanceMode,
      payments: [...(selectedOrder.payments || []), ...newPayments]
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
      .catch(err => console.error("Error updating order:", err))
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
                 {['Order #','Customer','Date','Items','Expected Delivery','Status','Action'].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
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
                  <td className="px-5 py-3.5 text-xs text-slate-500">{o.date}</td>
                  <td className="px-5 py-3.5 text-slate-600">{o.items} items</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {o.status === 'Processing' ? (
                      <span className="text-slate-400 font-normal italic">Not planned yet</span>
                    ) : o.delivery ? (
                      formatDeliveryDate(o.delivery)
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600')}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleOpenDrawer(o)}
                      className={cn(
                        "text-xs font-semibold hover:underline transition-all whitespace-nowrap",
                        o.status === 'Processing' ? "text-amber-600 hover:text-amber-700" : "text-blue-600 hover:text-blue-700"
                      )}
                    >
                      {o.status === 'Processing' ? '📝 Plan Dispatch' : '🔍 View Details'}
                    </button>
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
                  <span>Date: <strong>{selectedOrder.date}</strong></span>
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

              {/* Payment Planning Section */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Payment Planning</h4>
                </div>

                {/* Paid Amount Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-500">Advance Paid Amount (₹)</label>
                    <span className="text-xs font-bold text-slate-600">Order Total: {selectedOrder.total}</span>
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 4000"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Paid Mode (Only mandatory if paidAmount > 0) */}
                {(parseFloat(paidAmount) || 0) > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Paid Via Mode <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'UPI', 'Account Transfer', 'Cheque', 'EMI', 'Credit'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaidMode(mode)}
                          className={cn(
                            'rounded-lg border py-2 text-xs font-semibold transition-all',
                            paidMode === mode
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining Balance display & mode selection */}
                {(() => {
                  const total = parseAmount(selectedOrder.total)
                  const paid = parseFloat(paidAmount) || 0
                  const balance = total - paid
                  if (balance <= 0) return null

                  return (
                    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Remaining Balance:</span>
                        <span className="font-extrabold text-red-600 text-base">₹{balance.toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          Select Balance Handling Mode <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Cash', 'UPI', 'Account Transfer', 'Cheque', 'EMI', 'Credit'].map(mode => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setBalanceMode(mode)}
                              className={cn(
                                'rounded-lg border py-2 text-xs font-semibold transition-all',
                                balanceMode === mode
                                  ? 'bg-amber-600 border-amber-600 text-white shadow-sm font-bold'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                              )}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
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
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                <CheckCircle className="h-4 w-4" /> Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
