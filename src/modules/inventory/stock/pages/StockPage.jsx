import { useState, useEffect } from 'react'
import { Warehouse, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStock = () => {
    setLoading(true)
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading products stock:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchStock()
  }, [])

  const getStockStatus = (stock, min) => {
    if (stock <= min / 2) return 'Critical'
    if (stock <= min) return 'Low'
    return 'OK'
  }

  const lowCount = products.filter(p => getStockStatus(p.stock, p.min) !== 'OK').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Stock Overview <Warehouse className="h-5 w-5 text-blue-500" />
          </h1>
          <p className="text-sm text-slate-500">Current stock levels across all products</p>
        </div>
        {lowCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            {lowCount} low stock alerts
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Loading stock levels...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">No products in stock list.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Product','Brand','Category','Current Qty','Reserved','Available','Min Level','Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map(s => {
                const stat = getStockStatus(s.stock, s.min)
                const availableQty = (s.stock || 0) - (s.reserved || 0)
                
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">SKU: {s.id} · Size: {s.size || 'N/A'} · Finish: {s.finish || 'Matte'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{s.brand}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{s.category}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{s.stock} {s.unit || 'boxes'}</td>
                    <td className="px-5 py-3.5 text-amber-600 font-bold">{s.reserved || 0}</td>
                    <td className="px-5 py-3.5 text-emerald-700 font-bold">{availableQty}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{s.min}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        stat === 'OK'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : stat === 'Low'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                      )}>
                        {stat}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
