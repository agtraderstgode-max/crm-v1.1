import { CalendarCheck, Phone, Clock, AlertCircle } from 'lucide-react'

const FOLLOWUPS = [
  { id:1, name:'Aravind Kumar',      phone:'9876543210', location:'Gandhipuram', dueDate:'2026-07-03', status:'Keep Tracking 2x', priority:'High',   overdue:false, remarks:'Wants wood finish quote.' },
  { id:2, name:'Suresh Constructions',phone:'9845612307',location:'Peelamedu',  dueDate:'2026-07-03', status:'Keep Tracking 3x', priority:'High',   overdue:false, remarks:'Follow up on marble samples.' },
  { id:3, name:'Ibrahim Kutty',       phone:'9894002233', location:'Karumathampatti',dueDate:'2026-07-02',status:'Keep Tracking 4x',priority:'High',overdue:true,  remarks:'Waiting for discount approval.' },
  { id:4, name:'Rajesh Tiles',        phone:'9003887711', location:'Tiruppur',   dueDate:'2026-07-01', status:'Keep Tracking 2x', priority:'Medium', overdue:true,  remarks:'No response to last 2 calls.' },
  { id:5, name:'Devi Architects',     phone:'9988776655', location:'Saravanampatti',dueDate:'2026-07-06',status:'Keep Tracking 3x',priority:'Medium',overdue:false, remarks:'Schedule showroom visit.' },
]

export function FollowupsPage() {
  const overdue = FOLLOWUPS.filter(f=>f.overdue)
  const today   = FOLLOWUPS.filter(f=>!f.overdue)

  const Section = ({ title, items, color }) => (
    <div>
      <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${color}`}>
        <AlertCircle className="h-4 w-4"/> {title} ({items.length})
      </h2>
      <div className="space-y-3">
        {items.map(f => (
          <div key={f.id} className={`rounded-xl border p-4 bg-white shadow-sm flex items-start gap-4 ${f.overdue ? 'border-red-200' : 'border-slate-200'}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${f.overdue ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'}`}>
              {f.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{f.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.location} · {f.status}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${f.priority==='High'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                    {f.priority}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 italic">"{f.remarks}"</p>
              <div className="mt-2 flex items-center gap-3">
                <span className={`flex items-center gap-1 text-xs font-medium ${f.overdue ? 'text-red-600' : 'text-slate-500'}`}>
                  <Clock className="h-3 w-3" /> {f.dueDate} {f.overdue && '(OVERDUE)'}
                </span>
                <a href={`tel:${f.phone}`} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                  <Phone className="h-3 w-3"/> Call {f.phone}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Follow-ups</h1>
        <p className="text-sm text-slate-500">Manage all scheduled reminders and tracking tasks</p>
      </div>
      {overdue.length > 0 && <Section title="Overdue" items={overdue} color="text-red-600"/>}
      <Section title="Due Today / Upcoming" items={today} color="text-slate-700"/>
    </div>
  )
}
