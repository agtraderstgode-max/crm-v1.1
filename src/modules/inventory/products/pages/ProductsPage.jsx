import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit, X } from 'lucide-react'

export function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    brand: 'Custom',
    category_id: '',
    size: '',
    finish: '',
    stock: 0,
    unit: 'boxes',
    price: '₹0/sqft'
  })

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products').then(res => res.json()),
        fetch('/api/categories').then(res => res.json())
      ])
      setProducts(prodRes)
      setCategories(catRes)
    } catch (err) {
      console.error("Error loading products/categories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Product Actions
  const handleOpenAddProduct = () => {
    setSelectedProduct(null)
    setProductForm({
      id: `SKU-${Date.now().toString().slice(-6)}`,
      name: '',
      brand: 'Varmora',
      category_id: '',
      size: '',
      finish: '',
      stock: 0,
      unit: 'boxes',
      price: '₹0/sqft'
    })
    setIsProductModalOpen(true)
  }

  const handleOpenEditProduct = (prod) => {
    setSelectedProduct(prod)
    setProductForm({
      id: prod.id,
      name: prod.name,
      brand: prod.brand || 'Custom',
      category_id: prod.category_id || '',
      size: prod.size || '',
      finish: prod.finish || '',
      stock: prod.stock || 0,
      unit: prod.unit || 'boxes',
      price: prod.price || '₹0/sqft'
    })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/products/${productForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      })
      if (res.ok) {
        setIsProductModalOpen(false)
        fetchData()
      } else {
        alert('Failed to save product.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filters & Search
  const filteredProducts = products.filter(p => {
    const term = searchQuery.toLowerCase()
    return (
      p.id?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.size?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header section with page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products Catalog</h1>
          <p className="text-sm text-slate-500">Manage catalog tiles, custom items, and view their linked category prices</p>
        </div>
        <button
          onClick={handleOpenAddProduct}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search SKU, Name, Brand, Size..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm font-medium">
            <span className="inline-block animate-pulse">Loading catalog items...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No products matched the search query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">Brand</th>
                  <th className="px-5 py-3.5">Linked Price Category</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Finish</th>
                  <th className="px-5 py-3.5">Pricing</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map(p => {
                  const isLinked = !!p.category_id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 font-semibold">{p.id}</td>
                      <td className="px-5 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-5 py-4 text-slate-600">{p.brand}</td>
                      <td className="px-5 py-4">
                        {isLinked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {p.category}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            Custom Pricing
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 font-medium">{p.size}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{p.finish}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{p.price}</div>
                        {isLinked && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            MRP: ₹{p.mrp} | Box: ₹{p.online_price}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.stock < 20 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.stock} {p.unit || 'boxes'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <Edit className="h-3 w-3" /> Edit
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

      {/* PRODUCT ADD/EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">SKU / Product ID</label>
                <input
                  type="text"
                  disabled={!!selectedProduct}
                  value={productForm.id}
                  onChange={e => setProductForm({ ...productForm, id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. HG CARVING BEIGE TILE"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Finish</label>
                  <input
                    type="text"
                    placeholder="e.g. Glossy / Matt"
                    value={productForm.finish}
                    onChange={e => setProductForm({ ...productForm, finish: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Price list category dropdown link */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Link to Company Price List Category</label>
                <select
                  value={productForm.category_id}
                  onChange={e => {
                    const catId = e.target.value;
                    const cat = categories.find(c => c.id === catId);
                    setProductForm({
                      ...productForm,
                      category_id: catId,
                      // Pre-fill size if mapping category
                      size: cat ? cat.size : productForm.size,
                      price: cat ? `₹${cat.sqft_price}/sqft` : productForm.price
                    });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">None (Custom Pricing / Manual Entry)</option>
                  <option value="NO_CAT">🚫 No Category (Unclassified)</option>
                  <optgroup label="WALL CLASSIFICATIONS">
                    {categories.filter(c => c.type === 'WALL').map(c => (
                      <option key={c.id} value={c.id}>[{c.size}] {c.name} (MRP: ₹{c.mrp})</option>
                    ))}
                  </optgroup>
                  <optgroup label="FLOOR CLASSIFICATIONS">
                    {categories.filter(c => c.type === 'FLOOR').map(c => (
                      <option key={c.id} value={c.id}>[{c.size}] {c.name} (MRP: ₹{c.mrp})</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mapping to a category links this product's selling price, sq.ft, and packaging directly to the master company list.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 48*24"
                    disabled={productForm.category_id && productForm.category_id !== 'NO_CAT'}
                    value={productForm.size}
                    onChange={e => setProductForm({ ...productForm, size: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Selling Price (Custom)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹83/sqft"
                    disabled={productForm.category_id && productForm.category_id !== 'NO_CAT'}
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Stock Level</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Stock Unit</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
