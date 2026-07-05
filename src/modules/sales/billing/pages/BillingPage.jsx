import { Receipt, Plus } from 'lucide-react'
import { fmtDate } from '@/lib/utils'
const INVOICES = [
  { id:'INV-001', customer:'Suresh Constructions', date:'2026-07-02', total:'₹4,80,000', paid:'₹2,40,000', balance:'₹2,40,000', status:'Partial' },
  { id:'INV-002', customer:'Karthik Builders',    date:'2026-07-01', total:'₹2,10,000', paid:'₹2,10,000', balance:'₹0',       status:'Paid'    },
  { id:'INV-003', customer:'Aravind Kumar',        date:'2026-06-30', total:'₹1,24,500', paid:'₹0',        balance:'₹1,24,500', status:'Unpaid'  },
  { id:'INV-004', customer:'Ibrahim Tiles',        date:'2026-06-28', total:'₹68,000',   paid:'₹68,000',   balance:'₹0',       status:'Paid'    },
]
const STATUS_STYLE = { Paid:'bg-emerald-100 text-emerald-700', Partial:'bg-amber-100 text-amber-700', Unpaid:'bg-red-100 text-red-600', Cancelled:'bg-slate-100 text-slate-500' }
export function BillingPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Billing & Invoices</h1><p className="text-sm text-slate-500">GST invoices and payment tracking</p></div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"><Plus className="h-4 w-4"/>New Invoice</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Invoice #','Customer','Date','Total Amount','Paid','Balance','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {INVOICES.map(inv=>(
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{inv.id}</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{inv.customer}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{fmtDate(inv.date)}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{inv.total}</td>
                <td className="px-5 py-3.5 text-emerald-700 font-medium">{inv.paid}</td>
                <td className="px-5 py-3.5 text-red-600 font-medium">{inv.balance}</td>
                <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status}</span></td>
                <td className="px-5 py-3.5 flex gap-2">
                  <button className="text-xs text-blue-600 hover:underline font-medium">PDF</button>
                  <button className="text-xs text-violet-600 hover:underline font-medium">Pay</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
