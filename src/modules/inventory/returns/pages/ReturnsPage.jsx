import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  RotateCcw, Search, AlertTriangle, CheckCircle2, Package, Receipt,
  User, Calendar, IndianRupee, ShieldAlert, ArrowRight, Trash2, Eye, X,
  Check, FileText, ShoppingCart
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

const REASONS = [
  { id: 'Over Bought',           label: 'Over Bought',           color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Broken',                label: 'Broken',                color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'Batch Variant',         label: 'Batch Variant',         color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'Wrong Item Delivered',  label: 'Wrong Item Delivered',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Quality Issue',         label: 'Quality Issue',         color: 'bg-orange-50 text-orange-700 border-orange-200' },
]

export function ReturnsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [returnsList, setReturnsList] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Load Bill Input State
  const [billNoInput, setBillNoInput] = useState('')
  const [loadedOrder, setLoadedOrder] = useState(null)
  const [loadError, setLoadError] = useState('')

  // Form State for Return Items
  const [selectedItems, setSelectedItems] = useState({}) // { [itemIndex/id]: { selected: boolean, boxes: number, reason: string } }
  const [globalReason, setGlobalReason] = useState('Over Bought')
  const [returnNotes, setReturnNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Details Modal
  const [selectedReturnDetails, setSelectedReturnDetails] = useState(null)
  const [tableSearch, setTableSearch] = useState('')

  // Fetch all data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resRet, resOrd, resProd] = await Promise.all([
        fetch('/api/returns'),
        fetch('/api/orders'),
        fetch('/api/products')
      ])
      const dataRet = await resRet.json()
      const dataOrd = await resOrd.json()
      const dataProd = await resProd.json()

      const retArr = Array.isArray(dataRet) ? dataRet : []
      const ordArr = Array.isArray(dataOrd) ? dataOrd : []
      const prodArr = Array.isArray(dataProd) ? dataProd : []

      setReturnsList(retArr)
      setOrders(ordArr)
      setProducts(prodArr)

      // Check URL search params for billNo (e.g. /returns?billNo=ORD-026)
      const urlBillNo = searchParams.get('billNo')
      if (urlBillNo) {
        setBillNoInput(urlBillNo)
        autoLoadBill(urlBillNo, ordArr)
      }
    } catch (err) {
      console.error("Failed to load return data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Function to load a bill by Order ID or Bill No
  const autoLoadBill = (billId, ordersArray = orders) => {
    setLoadError('')
    if (!billId || !billId.trim()) return

    const targetId = billId.trim().toUpperCase()
    const found = ordersArray.find(o => o.id?.toUpperCase() === targetId || o.billNo?.toUpperCase() === targetId)

    if (found) {
      setLoadedOrder(found)
      // Initialize selected items state
      const initSelected = {}
      const orderItems = found.itemsList || found.itemsDetails || []
      
      // If order items list is present
      if (Array.isArray(orderItems) && orderItems.length > 0) {
        orderItems.forEach((it, idx) => {
          initSelected[idx] = {
            selected: true,
            boxes: it.boxes || it.quantity || 1,
            reason: globalReason,
            productName: it.productName || it.name || `Tile Item ${idx + 1}`,
            size: it.size || '',
            boxRate: it.boxRate || it.rate || (it.total ? Math.round(it.total / (it.boxes || 1)) : 1000),
            productId: it.productId || it.id || ''
          }
        })
      } else {
        // Fallback for simple order object
        initSelected[0] = {
          selected: true,
          boxes: typeof found.items === 'number' ? found.items : 1,
          reason: globalReason,
          productName: `Order ${found.id} Items`,
          size: 'Standard',
          boxRate: found.total ? Math.round(parseInt(String(found.total).replace(/[^\d]/g, '')) / (found.items || 1)) : 1000,
          productId: 'TL-001'
        }
      }
      setSelectedItems(initSelected)
    } else {
      setLoadedOrder(null)
      setLoadError(`Order/Bill "${billId}" not found. Please select from delivered orders below.`)
    }
  }

  const handleLoadBillClick = (e) => {
    e.preventDefault()
    autoLoadBill(billNoInput)
  }

  // Handle global reason change
  const handleGlobalReasonChange = (reason) => {
    setGlobalReason(reason)
    setSelectedItems(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(k => {
        updated[k] = { ...updated[k], reason }
      })
      return updated
    })
  }

  // Toggle item selection
  const toggleItemSelect = (idx) => {
    setSelectedItems(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        selected: !prev[idx]?.selected
      }
    }))
  }

  // Change quantity of selected item
  const handleItemBoxesChange = (idx, boxes) => {
    const num = Math.max(1, parseInt(boxes) || 1)
    setSelectedItems(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        boxes: num
      }
    }))
  }

  // Change item reason
  const handleItemReasonChange = (idx, reason) => {
    setSelectedItems(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        reason
      }
    }))
  }

  // Calculate totals for active selection
  const activeSelectedEntries = Object.values(selectedItems).filter(i => i.selected)
  const selectedLinesCount = activeSelectedEntries.length
  const totalBoxesToReturn = activeSelectedEntries.reduce((sum, i) => sum + (parseInt(i.boxes) || 0), 0)
  const estimatedRefund = activeSelectedEntries.reduce((sum, i) => sum + ((parseInt(i.boxes) || 0) * (parseFloat(i.boxRate) || 0)), 0)

  // Submit Save Return
  const handleSaveReturn = async () => {
    if (!loadedOrder) {
      alert("Please load a valid Customer Order / Bill first!")
      return
    }
    if (selectedLinesCount === 0) {
      alert("Please select at least one item from the loaded bill to return!")
      return
    }

    setSaving(true)
    try {
      const returnPayload = {
        billNo: loadedOrder.id,
        customerName: loadedOrder.customer || 'Customer',
        date: new Date().toISOString().split('T')[0],
        returnReason: globalReason,
        items: activeSelectedEntries.map(i => ({
          productId: i.productId || 'TL-001',
          productName: i.productName,
          size: i.size,
          boxes: i.boxes,
          boxRate: i.boxRate,
          amount: i.boxes * i.boxRate,
          reason: i.reason || globalReason
        })),
        notes: returnNotes,
        totalRefund: estimatedRefund
      }

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnPayload)
      })

      if (res.ok) {
        setLoadedOrder(null)
        setBillNoInput('')
        setSelectedItems({})
        setReturnNotes('')
        fetchData()
        alert(`✅ Sales Return successfully recorded! Refund ₹${estimatedRefund.toLocaleString('en-IN')}`)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to save sales return.")
      }
    } catch (err) {
      console.error(err)
      alert("Server error when saving return.")
    } finally {
      setSaving(false)
    }
  }

  // Delete Return
  const handleDeleteReturn = async (id) => {
    if (!confirm(`Delete sales return voucher ${id}?`)) return
    try {
      const res = await fetch(`/api/returns/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  // Analytics calculation for top section
  const totalRefundSum = returnsList.reduce((sum, r) => sum + (r.totalRefund || 0), 0)
  const totalReturnCount = returnsList.length
  const totalBoxesSum = returnsList.reduce((sum, r) => sum + (r.items || []).reduce((s, i) => s + (parseInt(i.boxes) || 0), 0), 0)

  // Restocked vs No Restock
  const restockedReturns = returnsList.filter(r => r.stockRestocked)
  const restockedRefundSum = restockedReturns.reduce((sum, r) => sum + (r.totalRefund || 0), 0)
  const restockedBoxesSum = restockedReturns.reduce((sum, r) => sum + (r.items || []).reduce((s, i) => s + (parseInt(i.boxes) || 0), 0), 0)

  const noRestockReturns = returnsList.filter(r => !r.stockRestocked)
  const noRestockRefundSum = noRestockReturns.reduce((sum, r) => sum + (r.totalRefund || 0), 0)
  const noRestockBoxesSum = noRestockReturns.reduce((sum, r) => sum + (r.items || []).reduce((s, i) => s + (parseInt(i.boxes) || 0), 0), 0)

  // Reason breakdown
  const reasonBreakdown = REASONS.map(rObj => {
    const list = returnsList.filter(r => r.returnReason?.toLowerCase() === rObj.id.toLowerCase())
    const sumAmt = list.reduce((sum, r) => sum + (r.totalRefund || 0), 0)
    const sumBoxes = list.reduce((sum, r) => sum + (r.items || []).reduce((s, i) => s + (parseInt(i.boxes) || 0), 0), 0)
    const percent = totalRefundSum > 0 ? Math.round((sumAmt / totalRefundSum) * 100) : 0
    return {
      ...rObj,
      count: list.length,
      amount: sumAmt,
      boxes: sumBoxes,
      percent
    }
  })

  // Top reason
  const topReasonObj = [...reasonBreakdown].sort((a, b) => b.amount - a.amount)[0] || reasonBreakdown[0]

  // Filtered returns table
  const filteredHistory = returnsList.filter(r => {
    const term = tableSearch.toLowerCase()
    return (
      r.billNo?.toLowerCase().includes(term) ||
      r.customerName?.toLowerCase().includes(term) ||
      r.id?.toLowerCase().includes(term) ||
      r.returnReason?.toLowerCase().includes(term)
    )
  })

  // Delivered Orders for easy load buttons
  const deliveredOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Confirmed' || o.status === 'Dispatched')

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Returns</h1>
            <button onClick={fetchData} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition" title="Refresh">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Return only items from an existing customer bill or order</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Broken returns skip stock update</span>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL REFUND AMOUNT</span>
          <p className="mt-2 text-2xl font-black text-blue-600">₹{totalRefundSum.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{totalReturnCount} returns · {totalBoxesSum} boxes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STOCK ADDED BACK</span>
          <p className="mt-2 text-2xl font-black text-emerald-600">₹{restockedRefundSum.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{restockedReturns.length} returns · {restockedBoxesSum} boxes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NO RESTOCK</span>
          <p className="mt-2 text-2xl font-black text-rose-600">₹{noRestockRefundSum.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{noRestockReturns.length} returns · {noRestockBoxesSum} boxes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOP RETURN REASON</span>
          <p className="mt-2 text-xl font-black text-slate-900 truncate">{topReasonObj?.label || 'Over Bought'}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">₹{topReasonObj?.amount.toLocaleString('en-IN')} · {topReasonObj?.count} returns</p>
        </div>
      </div>

      {/* Reason-wise Analysis Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Reason-wise Analysis</h3>
          <p className="text-xs text-slate-400">Refund amount, return count, and boxes by category</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {reasonBreakdown.map(r => (
            <button
              key={r.id}
              onClick={() => handleGlobalReasonChange(r.id)}
              className={cn(
                "rounded-xl border p-3.5 text-left transition relative flex flex-col justify-between",
                globalReason === r.id ? "ring-2 ring-blue-500 bg-blue-50/20 border-blue-300" : "bg-slate-50/50 border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-full border", r.color)}>
                  {r.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{r.percent}%</span>
              </div>
              <div className="mt-3">
                <p className="text-lg font-black text-slate-900">₹{r.amount.toLocaleString('en-IN')}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{r.count} returns · {r.boxes} boxes</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Load Bill Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Load Bill & Items Selection */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">BILL / ORDER NO</label>
            <form onSubmit={handleLoadBillClick} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Example: ORD-026 or ORD-027"
                  value={billNoInput}
                  onChange={e => setBillNoInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Search className="h-4 w-4" /> Load Bill
              </button>
            </form>

            {/* Quick Pick Delivered Orders Badges */}
            {deliveredOrders.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">Quick Load:</span>
                {deliveredOrders.slice(0, 5).map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setBillNoInput(o.id)
                      autoLoadBill(o.id)
                    }}
                    className={cn(
                      "text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition",
                      loadedOrder?.id === o.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    )}
                  >
                    {o.id} ({o.customer})
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
              {loadError}
            </div>
          )}

          {/* Loaded Order Items Selection Container */}
          {loadedOrder ? (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Loaded Bill / Order</span>
                  <h4 className="text-base font-black text-slate-900 font-mono">{loadedOrder.id}</h4>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">{loadedOrder.customer} · {fmtDate(loadedOrder.date)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Order Status</span>
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-0.5 border border-emerald-200">
                    {loadedOrder.status || 'Delivered'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select items to return from this bill:</p>

                {Object.entries(selectedItems).map(([idx, item]) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-4 transition space-y-3",
                      item.selected ? "border-blue-500 bg-white shadow-sm ring-1 ring-blue-500" : "border-slate-200 bg-slate-50/50 opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!item.selected}
                          onChange={() => toggleItemSelect(idx)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.productName}</p>
                          <p className="text-xs text-slate-400">{item.size} · Box Rate: ₹{item.boxRate.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">₹{(item.boxes * item.boxRate).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {item.selected && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Return Qty (Boxes)</label>
                          <input
                            type="number"
                            min="1"
                            value={item.boxes}
                            onChange={e => handleItemBoxesChange(idx, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Reason</label>
                          <select
                            value={item.reason || globalReason}
                            onChange={e => handleItemReasonChange(idx, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                          >
                            {REASONS.map(r => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Receipt className="h-10 w-10 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-600">No Bill / Order Loaded</p>
              <p className="text-xs text-slate-400 max-w-sm">Enter an Order # above or click a quick-load order to select return items</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: RETURN SUMMARY Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">RETURN SUMMARY</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Selected lines</span>
              <span className="font-bold text-slate-900 text-sm">{selectedLinesCount}</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-semibold">Reason</span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Required</span>
              </div>
              <select
                value={globalReason}
                onChange={e => handleGlobalReasonChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              >
                {REASONS.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Return Notes / Remarks</label>
              <input
                type="text"
                placeholder="Optional comments..."
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Estimated Refund</span>
              <span className="text-2xl font-black text-blue-600">₹{estimatedRefund.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleSaveReturn}
              disabled={saving || !loadedOrder || selectedLinesCount === 0}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm",
                loadedOrder && selectedLinesCount > 0
                  ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              {saving ? 'Saving Return...' : '🔄 Save Return'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Past Sales Returns History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sales Return History Log</h3>
            <p className="text-xs text-slate-500">Past customer returns and refund settlements</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by Bill No or Customer..."
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No return records in history.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Return ID & Date</th>
                  <th className="px-4 py-3">Bill / Order No</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-center">Stock Status</th>
                  <th className="px-4 py-3 text-right">Total Refund (₹)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredHistory.map(ret => {
                  const isBroken = ret.returnReason?.toLowerCase().includes('broken')
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-blue-600">{ret.id}</span>
                        <p className="text-[10px] text-slate-400">{fmtDate(ret.date)}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{ret.billNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{ret.customerName}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full font-bold text-[10px] border",
                          isBroken ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {ret.returnReason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ret.stockRestocked ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            🟢 Stock Added
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            🔴 No Restock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                        ₹{(ret.totalRefund || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedReturnDetails(ret)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReturn(ret.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Return"
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

      {/* Details View Modal */}
      {selectedReturnDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Return Voucher Details</h3>
                <p className="font-mono text-xs text-blue-600 font-bold">{selectedReturnDetails.id}</p>
              </div>
              <button onClick={() => setSelectedReturnDetails(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Bill No</span>
                  <p className="font-mono font-black text-slate-900 text-sm">{selectedReturnDetails.billNo}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Customer</span>
                  <p className="font-bold text-slate-800">{selectedReturnDetails.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Return Date</span>
                  <p className="font-semibold text-slate-700">{fmtDate(selectedReturnDetails.date)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Reason</span>
                  <p className="font-bold text-blue-600">{selectedReturnDetails.returnReason}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] mb-1 block">Returned Items</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 text-center">Boxes</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReturnDetails.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-800">{it.productName || it.productId}</td>
                          <td className="p-2 text-center font-semibold">{it.boxes}</td>
                          <td className="p-2 text-right font-bold">₹{(it.amount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-4">
                <span className="font-bold uppercase text-[10px]">Total Refund Issued:</span>
                <span className="text-xl font-black text-emerald-400">₹{(selectedReturnDetails.totalRefund || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setSelectedReturnDetails(null)} className="px-4 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
