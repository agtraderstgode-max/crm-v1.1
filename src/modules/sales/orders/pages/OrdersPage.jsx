import { ShoppingCart, Plus } from 'lucide-react'
const ORDERS = [
  { id:'ORD-001', customer:'Suresh Constructions', date:'2026-07-02', items:28, total:'₹4,80,000', status:'Processing', delivery:'2026-07-08' },
  { id:'ORD-002', customer:'Karthik Builders',    date:'2026-07-01', items:15, total:'₹2,10,000', status:'Dispatched', delivery:'2026-07-05' },
  { id:'ORD-003', customer:'Aravind Kumar',        date:'2026-06-30', items:12, total:'₹1,24,500', status:'Delivered',  delivery:'2026-07-03' },
  { id:'ORD-004', customer:'Ibrahim Tiles',        date:'2026-06-28', items:8,  total:'₹68,000',   status:'Confirmed',  delivery:'2026-07-10' },
]
const STATUS_STYLE = { Confirmed:'bg-blue-100 text-blue-700', Processing:'bg-amber-100 text-amber-700', Dispatched:'bg-violet-100 text-violet-700', Delivered:'bg-emerald-100 text-emerald-700', Cancelled:'bg-red-100 text-red-600' }
export function OrdersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Sales Orders</h1><p className="text-sm text-slate-500">Confirmed orders and dispatch tracking</p></div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"><Plus className="h-4 w-4"/>New Order</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Order #','Customer','Date','Items','Total','Expected Delivery','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ORDERS.map(o=>(
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{o.id}</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{o.customer}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{o.date}</td>
                <td className="px-5 py-3.5 text-slate-600">{o.items}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{o.total}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{o.delivery}</td>
                <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status]}`}>{o.status}</span></td>
                <td className="px-5 py-3.5"><button className="text-xs text-blue-600 hover:underline font-medium">Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
