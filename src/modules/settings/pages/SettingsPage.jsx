import { useState } from 'react'
import { Settings, Save } from 'lucide-react'

export function SettingsPage() {
  const [form, setForm] = useState({
    name: 'AG TRADERS',
    gst: '33AABCT1332L1ZT',
    phone: '9876543210',
    address: '6/1C1, RING ROAD, KALLUPALAYAM, TIRUCHENGODE, NAMAKKAL - 637 209, TAMILNADU',
    lat: '11.3477',
    lng: '77.9037'
  })

  const handleSave = () => {
    alert('Settings saved successfully for ' + form.name)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Showroom configuration and system settings</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Showroom Details</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Showroom Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">GST Number</label>
          <input
            type="text"
            value={form.gst}
            onChange={e => setForm({ ...form, gst: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Showroom Latitude (for map analysis)</label>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={e => setForm({ ...form, lat: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Showroom Longitude</label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={e => setForm({ ...form, lng: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>
    </div>
  )
}
