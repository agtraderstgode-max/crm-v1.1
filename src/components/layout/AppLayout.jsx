import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Bell, Search } from 'lucide-react'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 w-72">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers, leads..."
              className="flex-1 bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white cursor-pointer">
              A
            </div>
          </div>
        </header>

        {/* Page content — each module's page renders here */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
