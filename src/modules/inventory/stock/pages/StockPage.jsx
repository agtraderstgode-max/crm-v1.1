import { Warehouse, AlertTriangle } from 'lucide-react'
const STOCK = [
  { product:'Glossy White 600x600', brand:'RAK',    category:'Floor', current:280, reserved:40, available:240, min:50, status:'OK'       },
  { product:'Matte Grey 800x800',   brand:'Kajaria', category:'Floor', current:145, reserved:20, available:125, min:30, status:'OK'       },
  { product:'Marble Look 600x1200', brand:'Somany',  category:'Floor', current:68,  reserved:30, available:38,  min:50, status:'Low'      },
  { product:'Wood Finish Wall Tile',brand:'Johnson', category:'Wall',  current:12,  reserved:5,  available:7,   min:20, status:'Critical' },
  { product:'Anti-Skid 400x400',    brand:'Orient',  category:'Outdoor',current:320,reserved:0,  available:320, min:50, status:'OK'       },
]
export function StockPage() {
  const lowCount = STOCK.filter(s=>s.status!=='OK').length
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Stock Overview</h1><p className="text-sm text-slate-500">Current stock levels across all products</p></div>
        {lowCount > 0 && <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-medium text-red-700"><AlertTriangle className="h-4 w-4"/>{lowCount} low stock alerts</div>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Product','Brand','Category','Current Qty','Reserved','Available','Min Level','Status'].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {STOCK.map(s=>(
              <tr key={s.product} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-medium text-slate-800">{s.product}</td>
                <td className="px-5 py-3.5 text-slate-600">{s.brand}</td>
                <td className="px-5 py-3.5 text-slate-600">{s.category}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-700">{s.current} boxes</td>
                <td className="px-5 py-3.5 text-amber-600">{s.reserved}</td>
                <td className="px-5 py-3.5 text-emerald-700 font-semibold">{s.available}</td>
                <td className="px-5 py-3.5 text-slate-500">{s.min}</td>
                <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.status==='OK'?'bg-emerald-100 text-emerald-700':s.status==='Low'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
