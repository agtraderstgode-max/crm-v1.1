import { useState, useEffect } from 'react'
import { Package, Plus, Search } from 'lucide-react'

export function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching products:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500">Tiles catalog, variants and pricing</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          <Plus className="h-4 w-4"/>Add Product
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Loading catalog items...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">No products in catalog.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['SKU','Product Name','Brand','Category','Size','Finish','Selling Price','Stock',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{p.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{p.brand}</td>
                  <td className="px-5 py-3.5 text-slate-600">{p.category}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{p.size}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{p.finish}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{p.price}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold ${p.stock < 20 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {p.stock} {p.unit || 'boxes'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
