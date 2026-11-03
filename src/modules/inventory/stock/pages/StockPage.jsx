import { useState, useEffect, useMemo } from 'react'
import { 
  Warehouse, AlertTriangle, Search, Filter, Layers, 
  Tag, FileText, CheckCircle2, TrendingUp, IndianRupee, 
  Building2, PackageCheck, Edit3, X, Save, RefreshCw, Box
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  PRELOADED_UNITS, 
  normalizeUnit, 
  formatUnitQty, 
  getUnitMeta, 
  getUnitBadgeStyle 
} from '@/lib/unitsConfig'

export function StockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [selectedHsn, setSelectedHsn] = useState('ALL')
  const [selectedUnit, setSelectedUnit] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'IN_STOCK' | 'LOW' | 'CRITICAL'

  // Quick Edit Modal
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({
    stock: 0,
    available: 0,
    min: 20,
    purchase_rate: 0,
    hsn_code: '69072300',
    gst_percent: 18,
    unit: 'boxes'
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchStock = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data || [])
    } catch (err) {
      console.error("Error loading products stock:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [])

  const getStockStatus = (stock, min) => {
    const s = parseFloat(stock || 0)
    const m = parseFloat(min || 20)
    if (s <= 0) return 'Critical'
    if (s <= m / 2) return 'Critical'
    if (s <= m) return 'Low'
    return 'In Stock'
  }

  // Extract available brands
  const availableBrands = useMemo(() => {
    const set = new Set(['KAG', 'PUPA', 'ROFF'])
    products.forEach(p => {
      if (p.brand) set.add(p.brand.trim().toUpperCase())
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [products])

  // Extract available HSN codes
  const availableHsns = useMemo(() => {
    const set = new Set(['69072300', '69101000', '32141000'])
    products.forEach(p => {
      if (p.hsn_code) set.add(p.hsn_code.trim())
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [products])

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const brand = (p.brand || 'KAG').toUpperCase().trim()
      const hsn = (p.hsn_code || '69072300').trim()
      const stat = getStockStatus(p.stock, p.min)
      const stockVal = parseFloat(p.stock || 0)

      // Brand Filter
      if (selectedBrand !== 'ALL' && brand !== selectedBrand) return false

      // HSN Filter
      if (selectedHsn !== 'ALL' && hsn !== selectedHsn) return false

      // Unit Filter
      if (selectedUnit !== 'ALL' && normalizeUnit(p.unit) !== selectedUnit) return false

      // Status Filter
      if (statusFilter === 'IN_STOCK' && stockVal <= 0) return false
      if (statusFilter === 'LOW' && stat !== 'Low') return false
      if (statusFilter === 'CRITICAL' && stat !== 'Critical') return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (p.name || '').toLowerCase().includes(q)
        const matchSku = (p.id || '').toLowerCase().includes(q)
        const matchBrand = brand.toLowerCase().includes(q)
        const matchHsn = hsn.toLowerCase().includes(q)
        const matchCat = (p.category || '').toLowerCase().includes(q)
        const matchSize = (p.size || '').toLowerCase().includes(q)
        const matchUnit = normalizeUnit(p.unit).includes(q)
        return matchName || matchSku || matchBrand || matchHsn || matchCat || matchSize || matchUnit
      }

      return true
    })
  }, [products, selectedBrand, selectedHsn, selectedUnit, statusFilter, searchQuery])

  // Compute Metrics across the currently filtered items (or overall)
  const metrics = useMemo(() => {
    let totalQty = 0
    let totalCostVal = 0
    let totalTaxVal = 0
    let totalRetailVal = 0
    let criticalCount = 0
    let lowCount = 0

    const unitTotals = {
      boxes: 0,
      pcs: 0,
      bags: 0,
      sqft: 0,
      nos: 0,
      sets: 0,
      kg: 0,
      ltr: 0
    }

    filteredProducts.forEach(p => {
      const stock = parseFloat(p.stock || 0)
      const uKey = normalizeUnit(p.unit)
      totalQty += stock
      unitTotals[uKey] = (unitTotals[uKey] || 0) + stock

      const pRate = parseFloat(p.purchase_rate || 0)
      const gstPct = parseFloat(p.gst_percent || p.tax_percent || 18)
      const rawSellPrice = String(p.price || p.online_price || '').replace(/[^\d.]/g, '')
      const sRate = parseFloat(rawSellPrice) || 0

      const cost = stock * pRate
      const tax = cost * (gstPct / 100)
      const retail = stock * sRate

      totalCostVal += cost
      totalTaxVal += tax
      totalRetailVal += retail

      const st = getStockStatus(p.stock, p.min)
      if (st === 'Critical') criticalCount++
      else if (st === 'Low') lowCount++
    })

    return {
      totalQty,
      unitTotals,
      totalBoxes: unitTotals.boxes || 0,
      totalPcs: unitTotals.pcs || 0,
      totalBags: unitTotals.bags || 0,
      totalCostVal: Math.round(totalCostVal),
      totalTaxVal: Math.round(totalTaxVal),
      totalRetailVal: Math.round(totalRetailVal),
      potentialMargin: Math.round(totalRetailVal - totalCostVal),
      criticalCount,
      lowCount,
      totalCount: filteredProducts.length
    }
  }, [filteredProducts])

  // Brand-Specific stats
  const activeBrandStats = useMemo(() => {
    if (selectedBrand === 'ALL') return null
    return metrics
  }, [selectedBrand, metrics])

  // HSN-Specific stats
  const activeHsnStats = useMemo(() => {
    if (selectedHsn === 'ALL') return null
    return metrics
  }, [selectedHsn, metrics])

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    setEditingProduct(p)
    setEditForm({
      stock: p.stock || 0,
      available: p.available != null ? p.available : (p.stock || 0),
      min: p.min || 20,
      purchase_rate: p.purchase_rate || 0,
      hsn_code: p.hsn_code || '69072300',
      gst_percent: p.gst_percent || p.tax_percent || 18,
      unit: p.unit || 'boxes'
    })
  }

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingProduct) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingProduct,
          stock: parseFloat(editForm.stock) || 0,
          available: parseFloat(editForm.available) || 0,
          min: parseInt(editForm.min) || 20,
          purchase_rate: parseFloat(editForm.purchase_rate) || 0,
          hsn_code: editForm.hsn_code,
          tax_percent: parseFloat(editForm.gst_percent) || 18,
          gst_percent: parseFloat(editForm.gst_percent) || 18,
          unit: editForm.unit
        })
      })
      if (res.ok) {
        setEditingProduct(null)
        fetchStock()
      } else {
        alert('Failed to update product details.')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating product: ' + err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Stock & Inventory Valuation <Warehouse className="h-6 w-6 text-blue-600" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time showroom stock quantities, brand-wise segregation, HSN codes, and locked GST tax value
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStock}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", loading && "animate-spin")} />
            Refresh
          </button>
          {metrics.criticalCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs animate-pulse">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              {metrics.criticalCount} Critical Stock Alerts
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Qty */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Stock Qty</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 border border-blue-100">
              <PackageCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            {selectedBrand === 'PUPA' ? (
              <div className="text-2xl font-black text-purple-900">
                {metrics.totalPcs.toLocaleString('en-IN')} <span className="text-xs font-semibold text-purple-600">Pcs</span>
              </div>
            ) : selectedBrand === 'ROFF' ? (
              <div className="text-2xl font-black text-amber-900">
                {metrics.totalBags.toLocaleString('en-IN')} <span className="text-xs font-semibold text-amber-600">Bags</span>
              </div>
            ) : selectedBrand === 'KAG' ? (
              <div className="text-2xl font-black text-blue-900">
                {metrics.totalBoxes.toLocaleString('en-IN')} <span className="text-xs font-semibold text-blue-600">Boxes</span>
              </div>
            ) : selectedUnit !== 'ALL' ? (
              <div className="text-2xl font-black text-slate-900">
                {metrics.totalQty.toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">{getUnitMeta(selectedUnit).shortLabel}</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-slate-900">
                {metrics.totalQty.toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-400">total units</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs">
              <span 
                onClick={() => setSelectedUnit(selectedUnit === 'boxes' ? 'ALL' : 'boxes')}
                className={cn(
                  "rounded-md px-2 py-0.5 font-bold cursor-pointer transition border",
                  selectedUnit === 'boxes' 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                )}
                title="Filter to Boxes (Tiles)"
              >
                {metrics.totalBoxes} Boxes
              </span>
              <span 
                onClick={() => setSelectedUnit(selectedUnit === 'pcs' ? 'ALL' : 'pcs')}
                className={cn(
                  "rounded-md px-2 py-0.5 font-bold cursor-pointer transition border",
                  selectedUnit === 'pcs' 
                    ? "bg-purple-600 text-white border-purple-600" 
                    : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                )}
                title="Filter to Pieces (Sanitaryware)"
              >
                {metrics.totalPcs} Pcs
              </span>
              <span 
                onClick={() => setSelectedUnit(selectedUnit === 'bags' ? 'ALL' : 'bags')}
                className={cn(
                  "rounded-md px-2 py-0.5 font-bold cursor-pointer transition border",
                  selectedUnit === 'bags' 
                    ? "bg-amber-600 text-white border-amber-600" 
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                )}
                title="Filter to Bags (Adhesives)"
              >
                {metrics.totalBags} Bags
              </span>
            </div>
          </div>
        </div>

        {/* Total Stock Purchase Value (Cost) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock Cost Value</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
              <IndianRupee className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">
              ₹{metrics.totalCostVal.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total capital invested in inventory
            </p>
          </div>
        </div>

        {/* GST Tax Value in Stock */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">GST Tax Locked</span>
            <span className="rounded-lg bg-purple-100 p-2 text-purple-700 border border-purple-200">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-900">
              ₹{metrics.totalTaxVal.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-purple-700 font-medium mt-1">
              Input GST credit tied in stock (18%)
            </p>
          </div>
        </div>

        {/* Retail Value & Potential Margin */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Retail Selling Value</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-100">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{metrics.totalRetailVal.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1">
              Margin: +₹{metrics.potentialMargin.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Selection Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-600" /> Filter by Company Brand
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
          {availableBrands.map(b => {
            const isSelected = selectedBrand === b
            const isKag = b === 'KAG'
            const isPupa = b === 'PUPA'
            const isRoff = b === 'ROFF'

            return (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer border",
                  isSelected
                    ? isPupa 
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : isRoff
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span>{b === 'ALL' ? '🌐 ALL BRANDS' : b}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Brand Highlight Banner (when a specific brand is clicked) */}
      {selectedBrand !== 'ALL' && activeBrandStats && (
        <div className={cn(
          "rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs",
          selectedBrand === 'PUPA'
            ? "bg-purple-50/80 border-purple-200 text-purple-950"
            : selectedBrand === 'ROFF'
              ? "bg-amber-50/80 border-amber-200 text-amber-950"
              : "bg-sky-50/80 border-sky-200 text-sky-950"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm",
              selectedBrand === 'PUPA' ? "bg-purple-600 text-white" : selectedBrand === 'ROFF' ? "bg-amber-600 text-white" : "bg-sky-600 text-white"
            )}>
              {selectedBrand.slice(0, 3)}
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <span>{selectedBrand} Company Stock & Tax Overview</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                  {activeBrandStats.totalCount} Products
                </span>
              </h3>
              <p className="text-xs opacity-80 mt-0.5">
                Active inventory valuation for buying supplier {selectedBrand}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
            <div className="bg-white/80 rounded-lg px-3 py-1.5 border border-slate-200/50">
              <span className="text-[10px] text-slate-400 block uppercase">Stock Qty</span>
              <span className="text-sm font-black">
                {selectedBrand === 'PUPA' 
                  ? `${activeBrandStats.totalPcs || activeBrandStats.totalQty} Pcs (Sanitaryware)` 
                  : selectedBrand === 'ROFF' 
                    ? `${activeBrandStats.totalBags || activeBrandStats.totalQty} Bags (Adhesives)` 
                    : `${activeBrandStats.totalBoxes || activeBrandStats.totalQty} Boxes (Tiles)`}
              </span>
            </div>
            <div className="bg-white/80 rounded-lg px-3 py-1.5 border border-slate-200/50">
              <span className="text-[10px] text-slate-400 block uppercase">Stock Purchase Value</span>
              <span className="text-sm font-black text-emerald-700">₹{activeBrandStats.totalCostVal.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white/80 rounded-lg px-3 py-1.5 border border-slate-200/50">
              <span className="text-[10px] text-purple-600 block uppercase">GST Tax Value</span>
              <span className="text-sm font-black text-purple-700">₹{activeBrandStats.totalTaxVal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Unit Type Quick Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Product Measurement Units (Preloaded)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Filter by Unit:</span>
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">🌐 All Units</option>
              {PRELOADED_UNITS.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unit Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedUnit('ALL')}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer border",
              selectedUnit === 'ALL'
                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            ALL UNITS
          </button>
          {PRELOADED_UNITS.map(u => {
            const isSel = selectedUnit === u.id
            const qty = metrics.unitTotals[u.id] || 0
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUnit(u.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer border",
                  isSel
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <span>{u.shortLabel}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded text-[10px]",
                  isSel ? "bg-white/20 text-white font-extrabold" : "bg-slate-100 text-slate-600"
                )}>
                  {qty}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* HSN Code Quick Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              HSN Code Segregation & Tax Locked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Select specific HSN:</span>
            <select
              value={selectedHsn}
              onChange={e => setSelectedHsn(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">🌐 All HSN Codes</option>
              {availableHsns.filter(h => h !== 'ALL').map(h => (
                <option key={h} value={h}>
                  HSN {h} {h === '69072300' ? '(Tiles 18%)' : h === '69101000' ? '(Sanitaryware 18%)' : h === '32141000' ? '(Adhesives 18%)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* HSN Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {availableHsns.map(h => {
            const isSel = selectedHsn === h
            return (
              <button
                key={h}
                onClick={() => setSelectedHsn(h)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer border",
                  isSel
                    ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {h === 'ALL' ? 'ALL HSN' : `HSN ${h}`}
              </button>
            )
          })}
        </div>

        {/* HSN Callout details if active */}
        {selectedHsn !== 'ALL' && activeHsnStats && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
            <span className="font-semibold">
              🔍 Showing HSN <strong className="text-purple-700 font-bold">{selectedHsn}</strong>:
            </span>
            <div className="flex items-center gap-3 font-bold">
              <span>Qty: <strong className="text-slate-900">{activeHsnStats.totalQty} units</strong></span>
              <span>·</span>
              <span>Stock Cost: <strong className="text-emerald-700">₹{activeHsnStats.totalCostVal.toLocaleString('en-IN')}</strong></span>
              <span>·</span>
              <span>Input Tax (GST): <strong className="text-purple-700">₹{activeHsnStats.totalTaxVal.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name, SKU, HSN Code, Brand, Size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 flex-wrap">
          {[
            { id: 'ALL', label: 'ALL PRODUCTS' },
            { id: 'IN_STOCK', label: 'IN STOCK (>0)' },
            { id: 'LOW', label: 'LOW STOCK' },
            { id: 'CRITICAL', label: 'CRITICAL (0)' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer uppercase tracking-wider",
                statusFilter === s.id
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm font-medium">
            <span className="inline-block animate-pulse">Loading stock levels and tax valuations...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No products matched your search / filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Brand</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-center text-purple-700">HSN & Tax</th>
                  <th className="px-5 py-3.5">Current Qty</th>
                  <th className="px-5 py-3.5 text-emerald-700">Available</th>
                  <th className="px-5 py-3.5">Cost Rate (₹)</th>
                  <th className="px-5 py-3.5 font-bold text-emerald-700">Stock Value (₹)</th>
                  <th className="px-5 py-3.5 font-bold text-purple-800">GST Value (₹)</th>
                  <th className="px-5 py-3.5">Selling Rate (₹)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map(s => {
                  const stat = getStockStatus(s.stock, s.min)
                  const availableQty = (s.available != null ? s.available : s.stock) || 0
                  const b = (s.brand || 'KAG').toUpperCase().trim()
                  const isPupa = b === 'PUPA'
                  const isRoff = b === 'ROFF'

                  const stockNum = parseFloat(s.stock || 0)
                  const pRate = parseFloat(s.purchase_rate || 0)
                  const gstPct = parseFloat(s.gst_percent || s.tax_percent || 18)
                  const costVal = Math.round(stockNum * pRate)
                  const taxVal = Math.round(costVal * (gstPct / 100))

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          SKU: {s.id} · Size: {s.size || 'N/A'} · Finish: {s.finish || 'Matte'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border",
                          isPupa 
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : isRoff
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-sky-50 text-sky-700 border-sky-200"
                        )}>
                          {b}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium max-w-xs truncate" title={s.category}>
                        {s.category || 'Standard Product'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-mono font-bold text-purple-700 border border-purple-200">
                          {s.hsn_code || '69072300'} ({gstPct}%)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{s.stock}</span>
                          <span className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider border",
                            getUnitBadgeStyle(s.unit)
                          )}>
                            {getUnitMeta(s.unit).shortLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-emerald-700 font-bold">
                        <span>{availableQty}</span>
                        <span className="text-[11px] font-medium text-slate-400 ml-1">
                          {getUnitMeta(s.unit).singular}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-600">
                        ₹{pRate.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700">
                        ₹{costVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-purple-800">
                        ₹{taxVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-blue-600">
                        {s.price || '₹0'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-bold inline-block',
                          stat === 'In Stock'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : stat === 'Low'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                        )}>
                          {stat}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
                          title="Edit Stock & HSN"
                        >
                          <Edit3 className="h-4 w-4" />
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

      {/* QUICK EDIT STOCK & HSN MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Quick Stock & HSN Update
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  [{editingProduct.id}] {editingProduct.name} ({editingProduct.brand})
                </p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={e => setEditForm({ ...editForm, stock: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Available for Billing
                  </label>
                  <input
                    type="number"
                    value={editForm.available}
                    onChange={e => setEditForm({ ...editForm, available: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-emerald-700 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wide mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={editForm.hsn_code}
                    onChange={e => setEditForm({ ...editForm, hsn_code: e.target.value })}
                    className="w-full rounded-lg border border-purple-200 bg-purple-50/20 px-3 py-2 text-sm font-mono font-bold text-purple-900 outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    GST Tax %
                  </label>
                  <input
                    type="number"
                    value={editForm.gst_percent}
                    onChange={e => setEditForm({ ...editForm, gst_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Purchase Rate (₹ Cost)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.purchase_rate}
                    onChange={e => setEditForm({ ...editForm, purchase_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Measurement Unit (Preloaded)
                  </label>
                  <select
                    value={editForm.unit}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {PRELOADED_UNITS.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} — {u.category}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {getUnitMeta(editForm.unit).description}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  <Save className="h-4 w-4" />
                  {savingEdit ? 'Saving...' : 'Save Stock Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
