import { Plus, Search, FileText, Eye } from 'lucide-react'
const QUOTES = [
  { id:'Q-001', customer:'Aravind Kumar', date:'2026-07-02', items:12, total:'₹1,24,500', status:'Sent', valid:'2026-07-17' },
  { id:'Q-002', customer:'Suresh Constructions', date:'2026-07-01', items:28, total:'₹4,80,000', status:'Accepted', valid:'2026-07-16' },
  { id:'Q-003', customer:'Meena Rajan', date:'2026-06-30', items:6, total:'₹42,000', status:'Draft', valid:'2026-07-15' },
  { id:'Q-004', customer:'Karthik Builders', date:'2026-06-28', items:15, total:'₹2,10,000', status:'Converted', valid:'2026-07-13' },
  { id:'Q-005', customer:'Devi Architects', date:'2026-06-27', items:22, total:'₹3,68,000', status:'Rejected', valid:'2026-07-12' },
]
const STATUS_STYLE = { Sent:'bg-blue-100 text-blue-700', Accepted:'bg-emerald-100 text-emerald-700', Draft:'bg-slate-100 text-slate-600', Converted:'bg-violet-100 text-violet-700', Rejected:'bg-red-100 text-red-600' }
export function QuotationsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Quotations</h1><p className="text-sm text-slate-500">Create, send and track tile quotations</p></div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"><Plus className="h-4 w-4"/>New Quotation</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Quote #','Customer','Date','Items','Total Amount','Valid Until','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {QUOTES.map(q=>(
              <tr key={q.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{q.id}</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{q.customer}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{q.date}</td>
                <td className="px-5 py-3.5 text-slate-600">{q.items} items</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{q.total}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{q.valid}</td>
                <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[q.status]}`}>{q.status}</span></td>
                <td className="px-5 py-3.5 flex gap-2"><button className="text-xs text-blue-600 hover:underline font-medium">View PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
