import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X, Layers, Save } from 'lucide-react'

export function getDefaultQuotationSqft(cat) {
  if (cat.sqft_per_box_quotation != null && !isNaN(cat.sqft_per_box_quotation)) {
    return parseFloat(cat.sqft_per_box_quotation);
  }
  const size = (cat.size || '').toUpperCase().trim();
  const pcs = parseInt(cat.pcs_per_box || 0);
  const dimMatch = size.match(/(\d+)\s*[X*x]\s*(\d+)/);
  if (dimMatch && pcs > 0) {
    const w = parseFloat(dimMatch[1]);
    const h = parseFloat(dimMatch[2]);
    return Number(((w * h * pcs) / 144).toFixed(2));
  }
  if (size.includes('4 FEET') || size.includes('4FEET')) {
    if (size.includes('RISER') || (cat.name || '').toUpperCase().includes('RISER')) return 10.67;
    return 16.0;
  }
  if (size.includes('3 FEET') || size.includes('3FEET')) {
    if (size.includes('RISER') || (cat.name || '').toUpperCase().includes('RISER')) return 8.0;
    return 12.0;
  }
  return parseFloat(cat.sqft_per_box || 15.5);
}

export function PriceCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL' | 'WALL' | 'FLOOR'

  // Pricing rules state
  const [discountPct, setDiscountPct] = useState(15)
  const [applying, setApplying] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [form, setForm] = useState({
    id: '',
    size: '',
    name: '',
    type: 'FLOOR',
    sqft_per_box: 15.5,
    sqft_per_box_quotation: 16,
    pcs_per_box: 4,
    weight_per_box: 26,
    mrp: 1000,
    discount_pct: 15
  })

  // Fetch categories, settings & products
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const [catRes, setRes, prodRes] = await Promise.all([
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/pricing-settings').then(res => res.json()),
        fetch('/api/products').then(res => res.json()).catch(() => [])
      ])
      setCategories(catRes || [])
      setProducts(prodRes || [])
      if (setRes && setRes.discount_percentage !== undefined) {
        setDiscountPct(setRes.discount_percentage)
      }
    } catch (err) {
      console.error("Error loading categories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Discount Action
  const handleApplyDiscount = async () => {
    if (!confirm(`Are you sure you want to change the global discount to ${discountPct}%? This will instantly recalculate the Online Price and Sqft Price for all ${categories.length} classifications.`)) return
    setApplying(true)
    try {
      const res = await fetch('/api/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_percentage: parseFloat(discountPct) })
      })
      if (res.ok) {
        alert(`🎉 Global discount updated to ${discountPct}% successfully! All prices updated.`)
        fetchCategories()
      } else {
        alert('Failed to update discount.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setApplying(false)
    }
  }

  // Modal Actions
  const handleOpenAdd = () => {
    setSelectedCategory(null)
    setForm({
      id: '',
      size: '',
      name: '',
      type: 'FLOOR',
      sqft_per_box: 15.5,
      sqft_per_box_quotation: 16,
      pcs_per_box: 4,
      weight_per_box: 26,
      mrp: 1000,
      discount_pct: discountPct
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat)
    setForm({
      id: cat.id,
      size: cat.size,
      name: cat.name,
      type: cat.type || 'FLOOR',
      sqft_per_box: cat.sqft_per_box || 15.5,
      sqft_per_box_quotation: cat.sqft_per_box_quotation != null ? cat.sqft_per_box_quotation : getDefaultQuotationSqft(cat),
      pcs_per_box: cat.pcs_per_box || 4,
      weight_per_box: cat.weight_per_box || 0,
      mrp: cat.mrp || 1000,
      discount_pct: cat.discount_pct !== undefined ? cat.discount_pct : discountPct
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const method = selectedCategory ? 'PUT' : 'POST'
    const url = selectedCategory ? `/api/categories/${form.id}` : '/api/categories'
    
    // Compute current discount value
    const finalDiscount = form.discount_pct !== undefined ? parseFloat(form.discount_pct) : discountPct;
    const finalForm = {
      ...form,
      discount_pct: finalDiscount
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm)
      })
      if (res.ok) {
        setIsModalOpen(false)
        fetchCategories()
      } else {
        alert('Failed to save category.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this price category? Mapped products will lose their category pricing links.')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCategories()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filter lists
  const filtered = categories.filter(c => {
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false
    const term = searchQuery.toLowerCase()
    return (
      c.name?.toLowerCase().includes(term) ||
      c.size?.toLowerCase().includes(term) ||
      c.id?.toLowerCase().includes(term)
    )
  })

  // Map products count by category
  const productCountByCat = {}
  products.forEach(p => {
    if (p.category_id) {
      productCountByCat[p.category_id] = (productCountByCat[p.category_id] || 0) + 1
    }
  })

  const currentMrp = parseFloat(form.mrp || 0)
  const currentSqft = parseFloat(form.sqft_per_box || 1)
  const currentDiscount = form.discount_pct !== undefined ? parseFloat(form.discount_pct) : discountPct
  
  const calculatedOnlinePrice = Math.round(currentMrp * (1 - currentDiscount / 100))
  const calculatedSqftPrice = Math.round(calculatedOnlinePrice / (currentSqft || 1))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Price Categories</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <span>Configure master price sheets, packaging weights, and auto-computed rates</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              ✓ {products.length} Products Linked (100% Synced)
            </span>
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Classification
        </button>
      </div>

      {/* Global Discount Settings Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
            %
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Global Category Discount</h3>
            <p className="text-xs text-slate-500">Applies a flat percentage discount from MRP to calculate the Online Price</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative rounded-lg border border-slate-200 bg-white px-3 py-1.5 flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="100"
              value={discountPct}
              onChange={e => setDiscountPct(e.target.value)}
              className="w-12 text-center text-sm font-bold text-slate-800 bg-transparent outline-none"
            />
            <span className="text-sm font-bold text-slate-400">%</span>
          </div>
          <button
            onClick={handleApplyDiscount}
            disabled={applying}
            className="rounded-lg bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 text-xs font-bold shadow-sm transition disabled:bg-slate-300 cursor-pointer"
          >
            {applying ? 'Applying...' : 'Apply Discount'}
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search classification name, size, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {['ALL', 'WALL', 'FLOOR'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                typeFilter === type
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Grid Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm font-medium">
            <span className="inline-block animate-pulse">Loading price categories...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No price categories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Classification Name / Description</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Sq.Ft / Box</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center font-bold text-indigo-700 bg-indigo-50/60 border-x border-indigo-100">
                    Sq.Ft / Box for Quotation
                  </th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Pcs / Box</th>
                  <th className="px-5 py-3.5 text-orange-600 font-semibold">Wt / Box (kg)</th>
                  <th className="px-5 py-3.5 text-slate-900 font-bold">MRP (₹)</th>
                  <th className="px-5 py-3.5">Online Price (₹)</th>
                  <th className="px-5 py-3.5 text-center">Linked Products</th>
                  <th className="px-5 py-3.5 font-semibold text-blue-600">Sq.Ft Rate (₹)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{c.id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{c.size}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{c.name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.type === 'WALL' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">{c.sqft_per_box}</td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-indigo-700 text-center bg-indigo-50/30 border-x border-indigo-100/60">
                      {c.sqft_per_box_quotation != null ? c.sqft_per_box_quotation : getDefaultQuotationSqft(c)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">{c.pcs_per_box}</td>
                    <td className="px-5 py-4 text-xs font-mono font-semibold text-orange-600">{c.weight_per_box || '—'}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">₹{c.mrp}</td>
                    <td className="px-5 py-4 text-slate-500 font-medium">₹{c.online_price}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                        <Layers className="h-3 w-3" />
                        {productCountByCat[c.id] || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-blue-600 font-semibold bg-blue-50/30">₹{c.sqft_price}/sqft</td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="inline-flex items-center gap-0.5 text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 font-semibold">
                {selectedCategory ? 'Edit Price Classification' : 'Add Price Classification'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category Code / ID</label>
                  <input
                    type="text"
                    disabled={!!selectedCategory}
                    placeholder="e.g. CAT-037"
                    value={form.id}
                    onChange={e => setForm({ ...form, id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FLOOR">FLOOR TILE</option>
                    <option value="WALL">WALL TILE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tile Size</label>
                <input
                  type="text"
                  placeholder="e.g. 48*24 or 24*24 GVT"
                  value={form.size}
                  onChange={e => setForm({ ...form, size: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Classification Name / Description</label>
                <input
                  type="text"
                  placeholder="e.g. PGVT - High Glossy HG CARVING"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Sq.Ft / Box</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15.5"
                    value={form.sqft_per_box}
                    onChange={e => setForm({ ...form, sqft_per_box: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Sq.Ft / Box for Quotation</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 16, 9, 8"
                    value={form.sqft_per_box_quotation !== undefined ? form.sqft_per_box_quotation : ''}
                    onChange={e => setForm({ ...form, sqft_per_box_quotation: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-indigo-200 bg-indigo-50/30 px-3 py-2 text-sm font-bold text-indigo-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Pcs per Box</label>
                  <input
                    type="number"
                    placeholder="e.g. 4"
                    value={form.pcs_per_box}
                    onChange={e => setForm({ ...form, pcs_per_box: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Weight per Box (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 26"
                  value={form.weight_per_box}
                  onChange={e => setForm({ ...form, weight_per_box: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-orange-700 bg-orange-50/30 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">MRP Price (₹ per box)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1520"
                    value={form.mrp}
                    onChange={e => setForm({ ...form, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 bg-amber-50/30 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 15"
                    value={form.discount_pct !== undefined ? form.discount_pct : discountPct}
                    onChange={e => setForm({ ...form, discount_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 bg-amber-50/30 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Calculated Online Price (₹)</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${calculatedOnlinePrice}`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Calculated Sq.Ft Rate (₹)</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${calculatedSqftPrice}/sqft`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Save Classification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
