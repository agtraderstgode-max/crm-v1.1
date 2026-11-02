import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, X, Layers, Save, Building2, Tag, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL' | 'WALL' | 'FLOOR' | 'SANITARY' | 'ADHESIVE'
  const [selectedBrand, setSelectedBrand] = useState('ALL') // 'ALL' | 'KAG' | 'PUPA' | 'ROFF' | ...

  // Pricing rules state
  const [discountPct, setDiscountPct] = useState(10)
  const [brandDiscounts, setBrandDiscounts] = useState({ KAG: 10, PUPA: 20, ROFF: 15 })
  const [targetDiscountBrand, setTargetDiscountBrand] = useState('ALL')
  const [brandDiscountInput, setBrandDiscountInput] = useState(10)
  const [applying, setApplying] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [customBrandInput, setCustomBrandInput] = useState(false)
  const [form, setForm] = useState({
    id: '',
    brand: 'KAG',
    size: '',
    name: '',
    type: 'FLOOR',
    sqft_per_box: 15.5,
    sqft_per_box_quotation: 16,
    pcs_per_box: 4,
    weight_per_box: 26,
    mrp: 1000,
    discount_pct: 10
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
      if (setRes) {
        if (setRes.discount_percentage !== undefined) setDiscountPct(setRes.discount_percentage)
        if (setRes.brand_discounts) setBrandDiscounts(setRes.brand_discounts)
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

  // Dynamic available brands list
  const availableBrands = useMemo(() => {
    const brandSet = new Set(['KAG', 'PUPA', 'ROFF'])
    categories.forEach(c => {
      if (c.brand) brandSet.add(c.brand.toUpperCase().trim())
    })
    return ['ALL', ...Array.from(brandSet).sort()]
  }, [categories])

  // Update discount input when target brand changes
  useEffect(() => {
    if (targetDiscountBrand === 'ALL') {
      setBrandDiscountInput(discountPct)
    } else {
      setBrandDiscountInput(brandDiscounts[targetDiscountBrand] !== undefined ? brandDiscounts[targetDiscountBrand] : discountPct)
    }
  }, [targetDiscountBrand, brandDiscounts, discountPct])

  // Discount Action (Brand-specific or Global)
  const handleApplyDiscount = async () => {
    const isGlobal = targetDiscountBrand === 'ALL'
    const targetMsg = isGlobal ? `all ${categories.length} classifications globally` : `all ${targetDiscountBrand} classifications`
    if (!confirm(`Are you sure you want to set ${brandDiscountInput}% discount for ${targetMsg}? This will recalculate the Online Price and Sqft Price.`)) return
    
    setApplying(true)
    try {
      const res = await fetch('/api/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brand: targetDiscountBrand,
          discount_percentage: parseFloat(brandDiscountInput) 
        })
      })
      if (res.ok) {
        alert(`🎉 Discount updated for ${targetDiscountBrand} (${brandDiscountInput}%) successfully!`)
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
    const initialBrand = selectedBrand !== 'ALL' ? selectedBrand : 'KAG'
    setCustomBrandInput(false)
    setForm({
      id: '',
      brand: initialBrand,
      size: '',
      name: '',
      type: initialBrand === 'PUPA' ? 'SANITARY' : initialBrand === 'ROFF' ? 'ADHESIVE' : 'FLOOR',
      sqft_per_box: initialBrand === 'PUPA' || initialBrand === 'ROFF' ? 1 : 15.5,
      sqft_per_box_quotation: initialBrand === 'PUPA' || initialBrand === 'ROFF' ? 1 : 16,
      pcs_per_box: initialBrand === 'PUPA' ? 1 : 4,
      weight_per_box: 0,
      mrp: 1000,
      discount_pct: brandDiscounts[initialBrand] !== undefined ? brandDiscounts[initialBrand] : discountPct
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat)
    const catBrand = (cat.brand || 'KAG').toUpperCase()
    setCustomBrandInput(!['KAG', 'PUPA', 'ROFF'].includes(catBrand))
    setForm({
      id: cat.id,
      brand: catBrand,
      size: cat.size || '',
      name: cat.name || '',
      type: cat.type || 'FLOOR',
      sqft_per_box: cat.sqft_per_box || 1,
      sqft_per_box_quotation: cat.sqft_per_box_quotation != null ? cat.sqft_per_box_quotation : getDefaultQuotationSqft(cat),
      pcs_per_box: cat.pcs_per_box || 1,
      weight_per_box: cat.weight_per_box || 0,
      mrp: cat.mrp || 1000,
      discount_pct: cat.discount_pct !== undefined ? cat.discount_pct : (brandDiscounts[catBrand] || discountPct)
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const method = selectedCategory ? 'PUT' : 'POST'
    const url = selectedCategory ? `/api/categories/${form.id}` : '/api/categories'
    
    const finalDiscount = form.discount_pct !== undefined ? parseFloat(form.discount_pct) : discountPct
    const finalForm = {
      ...form,
      brand: (form.brand || 'KAG').toUpperCase().trim(),
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
    const cBrand = (c.brand || 'KAG').toUpperCase()
    if (selectedBrand !== 'ALL' && cBrand !== selectedBrand) return false
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false
    const term = searchQuery.toLowerCase()
    return (
      c.name?.toLowerCase().includes(term) ||
      c.size?.toLowerCase().includes(term) ||
      c.id?.toLowerCase().includes(term) ||
      cBrand.toLowerCase().includes(term)
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

  const isSanitaryOrAdhesive = form.type === 'SANITARY' || form.type === 'ADHESIVE'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Price Categories & Brands</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <span>Configure multi-brand price sheets, packaging weights, and auto-computed rates</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              ✓ {products.length} Products Linked ({categories.length} Categories)
            </span>
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Classification
        </button>
      </div>

      {/* Brand Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1 flex-shrink-0">
          <Building2 className="h-4 w-4 text-blue-600" /> Brand:
        </span>
        {availableBrands.map(b => {
          const count = b === 'ALL' 
            ? categories.length 
            : categories.filter(c => (c.brand || 'KAG').toUpperCase() === b).length
          return (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border flex-shrink-0",
                selectedBrand === b
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span>{b}</span>
              <span className={cn(
                "rounded-full text-[10px] px-1.5 py-0.2 font-semibold",
                selectedBrand === b ? "bg-blue-700/60 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Brand-Wise & Global Discount Settings Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
            %
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Brand-Wise Category Discounts</span>
              {targetDiscountBrand !== 'ALL' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Target: {targetDiscountBrand}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Apply customized flat discounts per company (e.g. PUPA Sanitary: 20%, KAG Tiles: 10%, ROFF: 15%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target Brand Selector */}
          <select
            value={targetDiscountBrand}
            onChange={e => setTargetDiscountBrand(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">🌐 All Brands Globally</option>
            <option value="KAG">KAG (Tiles)</option>
            <option value="PUPA">PUPA (Sanitaryware)</option>
            <option value="ROFF">ROFF (Adhesives)</option>
            {availableBrands.filter(b => !['ALL', 'KAG', 'PUPA', 'ROFF'].includes(b)).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <div className="relative rounded-lg border border-slate-200 bg-white px-3 py-1.5 flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="100"
              value={brandDiscountInput}
              onChange={e => setBrandDiscountInput(e.target.value)}
              className="w-12 text-center text-sm font-bold text-slate-800 bg-transparent outline-none"
            />
            <span className="text-sm font-bold text-slate-400">%</span>
          </div>

          <button
            onClick={handleApplyDiscount}
            disabled={applying}
            className="rounded-lg bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 text-xs font-bold shadow-sm transition disabled:bg-slate-300 cursor-pointer"
          >
            {applying ? 'Applying...' : `Apply to ${targetDiscountBrand}`}
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search classification name, size, brand, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 flex-wrap">
          {['ALL', 'WALL', 'FLOOR', 'SANITARY', 'ADHESIVE'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition cursor-pointer ${
                typeFilter === type
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {type === 'ALL' ? 'ALL TYPES' : type}
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
          <div className="py-20 text-center text-slate-400 text-sm">
            No price categories found for brand: <span className="font-bold text-slate-700">{selectedBrand}</span>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Brand</th>
                  <th className="px-5 py-3.5">Size / Unit</th>
                  <th className="px-5 py-3.5">Classification Name / Description</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Sq.Ft / Box</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center font-bold text-indigo-700 bg-indigo-50/60 border-x border-indigo-100">
                    Quotation Unit
                  </th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Pcs / Box</th>
                  <th className="px-5 py-3.5 text-orange-600 font-semibold">Wt (kg)</th>
                  <th className="px-5 py-3.5 text-slate-900 font-bold">MRP (₹)</th>
                  <th className="px-5 py-3.5">Online Price (₹)</th>
                  <th className="px-5 py-3.5 text-center">Linked Products</th>
                  <th className="px-5 py-3.5 font-semibold text-blue-600">Unit Rate (₹)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(c => {
                  const b = (c.brand || 'KAG').toUpperCase()
                  const isPupa = b === 'PUPA'
                  const isRoff = b === 'ROFF'

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">
                        {c.id}
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
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {c.size || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 font-medium max-w-xs truncate" title={c.name}>
                        {c.name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          c.type === 'WALL' ? "bg-amber-50 text-amber-600" :
                          c.type === 'SANITARY' ? "bg-purple-50 text-purple-600" :
                          c.type === 'ADHESIVE' ? "bg-blue-50 text-blue-600" :
                          "bg-emerald-50 text-emerald-600"
                        )}>
                          {c.type || 'FLOOR'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {c.sqft_per_box ? `${c.sqft_per_box} sq.ft` : '1 unit'}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-50">
                        {c.sqft_per_box_quotation != null ? `${c.sqft_per_box_quotation} sq.ft` : `${getDefaultQuotationSqft(c)} sq.ft`}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-500">
                        {c.pcs_per_box || 1}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-orange-600">
                        {c.weight_per_box ? `${c.weight_per_box} kg` : '-'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{c.mrp}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600">
                        ₹{c.online_price}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          <Layers className="h-3 w-3" />
                          {productCountByCat[c.id] || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-blue-600">
                        {c.type === 'SANITARY' 
                          ? `₹${c.online_price}/pc`
                          : c.type === 'ADHESIVE'
                            ? `₹${c.online_price}/bag`
                            : `₹${c.sqft_price || Math.round((c.online_price || 0) / (c.sqft_per_box || 1))}/sqft`}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Edit Classification"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                            title="Delete Classification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Classification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                {selectedCategory ? 'Edit Price Classification' : 'Add New Price Classification'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Company / Brand</label>
                <div className="flex gap-2">
                  <select
                    value={!customBrandInput ? form.brand : 'CUSTOM'}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setCustomBrandInput(true)
                      } else {
                        setCustomBrandInput(false)
                        const b = e.target.value
                        setForm({
                          ...form,
                          brand: b,
                          type: b === 'PUPA' ? 'SANITARY' : b === 'ROFF' ? 'ADHESIVE' : form.type
                        })
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="KAG">KAG (Tiles)</option>
                    <option value="PUPA">PUPA (Sanitaryware & Bath)</option>
                    <option value="ROFF">ROFF (Tile Adhesives & Grouts)</option>
                    <option value="CUSTOM">➕ Custom Brand Name...</option>
                  </select>

                  {customBrandInput && (
                    <input
                      type="text"
                      placeholder="e.g. SOMANY, JAQUAR"
                      value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value.toUpperCase() })}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold uppercase outline-none focus:border-blue-500"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Classification ID</label>
                  <input
                    type="text"
                    disabled={!!selectedCategory}
                    placeholder="e.g. CAT087 or PUPA_01"
                    value={form.id}
                    onChange={e => setForm({ ...form, id: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase outline-none transition disabled:bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to auto-generate</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Product Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FLOOR">FLOOR TILES</option>
                    <option value="WALL">WALL TILES</option>
                    <option value="SANITARY">SANITARYWARE & FITTINGS</option>
                    <option value="ADHESIVE">ADHESIVES & GROUTS</option>
                    <option value="HARDWARE">GENERAL HARDWARE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                  {isSanitaryOrAdhesive ? 'Model Size / Packaging Spec' : 'Tile Size'}
                </label>
                <input
                  type="text"
                  placeholder={isSanitaryOrAdhesive ? "e.g. Standard, 20kg Bag, 500x400" : "e.g. 48*24 or 24*24 GVT"}
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
                  placeholder={isSanitaryOrAdhesive ? "e.g. One Piece Closet S-Trap 300mm Soft Close" : "e.g. PGVT - High Glossy HG CARVING"}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    {isSanitaryOrAdhesive ? 'Units / Box or Bag' : 'Sq.Ft / Box'}
                  </label>
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
                  <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
                    {isSanitaryOrAdhesive ? 'Quotation Multiplier' : 'Sq.Ft / Box (Quotation)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1"
                    value={form.sqft_per_box_quotation !== undefined ? form.sqft_per_box_quotation : ''}
                    onChange={e => setForm({ ...form, sqft_per_box_quotation: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-indigo-200 bg-indigo-50/30 px-3 py-2 text-sm font-bold text-indigo-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Pieces per Box / Unit</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={form.pcs_per_box}
                    onChange={e => setForm({ ...form, pcs_per_box: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 26"
                  value={form.weight_per_box}
                  onChange={e => setForm({ ...form, weight_per_box: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-orange-700 bg-orange-50/30 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    {isSanitaryOrAdhesive ? 'MRP Price (₹ per piece / unit)' : 'MRP Price (₹ per box)'}
                  </label>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Discount (%) for {form.brand || 'KAG'}
                  </label>
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isSanitaryOrAdhesive ? 'Net Unit Selling Rate (₹)' : 'Calculated Sq.Ft Rate (₹)'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={isSanitaryOrAdhesive ? `₹${calculatedOnlinePrice}/unit` : `₹${calculatedSqftPrice}/sqft`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save Classification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
