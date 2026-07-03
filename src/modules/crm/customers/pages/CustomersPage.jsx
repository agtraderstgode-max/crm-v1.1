import { Users, Search, Plus, Phone, MapPin } from 'lucide-react'

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Aravind Kumar',      phone: '9876543210', area: 'Gandhipuram',    type: 'Owner',       total: '₹1,24,000' },
  { id: 2, name: 'Suresh Constructions',phone: '9845612307', area: 'Peelamedu',    type: 'Builder',     total: '₹4,80,000' },
  { id: 3, name: 'Meena Rajan',        phone: '9003344556', area: 'RS Puram',      type: 'Owner',       total: '₹68,500'   },
  { id: 4, name: 'Ibrahim Tiles',      phone: '9894002233', area: 'Singanallur',   type: 'Contractor',  total: '₹2,10,000' },
  { id: 5, name: 'Karthik Builders',   phone: '9444123456', area: 'Thudiyalur',    type: 'Builder',     total: '₹5,62,000' },
  { id: 6, name: 'Priya Constructions',phone: '9677334411', area: 'Saravanampatti',type: 'Contractor',  total: '₹89,000'   },
]

const TYPE_COLOR = {
  Owner:      'bg-blue-100 text-blue-700',
  Builder:    'bg-violet-100 text-violet-700',
  Contractor: 'bg-amber-100 text-amber-700',
  Architect:  'bg-emerald-100 text-emerald-700',
}

export function CustomersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500">Master list of all showroom customers</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex-1 max-w-sm shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by name or phone..." className="flex-1 text-sm outline-none text-slate-600 placeholder:text-slate-400" />
        </div>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none">
          <option>All Types</option>
          <option>Owner</option>
          <option>Builder</option>
          <option>Contractor</option>
          <option>Architect</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Area</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Purchases</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_CUSTOMERS.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {c.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{c.phone}</td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />{c.area}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLOR[c.type] || ''}`}>
                    {c.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{c.total}</td>
                <td className="px-5 py-3.5">
                  <button className="text-xs font-medium text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
