import { useEffect, useMemo, useState } from 'react'
import { 
  BadgeIndianRupee, CalendarDays, Megaphone, MonitorSmartphone, 
  Plus, Printer, Trash2, UserRound, Search, Edit2, X, 
  Filter, PieChart, UsersRound, MapPin, Phone, Mail,
  Target, TrendingUp, Clock, Download, Upload, Eye,
  Building2, Store, Calendar, DollarSign, CheckCircle
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

const STORAGE_KEY = 'tiles_crm_marketing'

const DEFAULT_DATA = {
  people: [
    { id: 'MKT-P-001', name: 'Ramesh Kumar', phone: '9876543210', area: 'Gandhipuram', role: 'Field Marketing', status: 'Active', email: 'ramesh@example.com', gender: 'Male', experience: '2 years', address: '123, Gandhipuram, Coimbatore' },
  ],
  flex: [
    { id: 'MKT-F-001', title: 'New Arrival Flex', location: 'Showroom Front', size: '8x4 ft', cost: 2500, date: '2026-08-02', status: 'Planned', vendor: 'Standard Flex', installDate: '2026-08-05', removeDate: '', remarks: 'First installation' },
  ],
  online: [
    { id: 'MKT-O-001', title: 'Instagram Tile Offer', platform: 'Instagram', budget: 3000, startDate: '2026-08-02', leads: 0, status: 'Draft', clicks: 0, impressions: 0, ctr: 0, postUrl: '' },
  ],
  campaigns: [
    { id: 'MKT-C-001', name: 'Festival Sale 2026', startDate: '2026-08-01', endDate: '2026-08-31', budget: 50000, spent: 15000, status: 'Running', objectives: 'Sales, Awareness', channels: ['Online', 'Flex'] },
  ],
  vendors: [
    { id: 'MKT-V-001', name: 'Standard Flex Works', contact: '9876512345', email: 'contact@standardflex.com', type: 'Flex Printing', address: '45, Industrial Estate, Coimbatore', rating: 4.5, services: ['Flex Printing', 'Installation', 'Removal'], notes: 'Reliable vendor, good quality' },
  ],
}

const TABS = [
  { id: 'people', label: 'Marketing Personnel', icon: UserRound },
  { id: 'flex', label: 'Flex Advertising', icon: Printer },
  { id: 'online', label: 'Online Promotion', icon: MonitorSmartphone },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'vendors', label: 'Marketing Vendors', icon: Building2 },
  { id: 'analytics', label: 'Analytics & ROI', icon: PieChart },
]

function loadMarketingData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return { ...DEFAULT_DATA, people: [...DEFAULT_DATA.people] }
    return {
      people: Array.isArray(saved?.people) ? saved.people : DEFAULT_DATA.people,
      flex: Array.isArray(saved?.flex) ? saved.flex : DEFAULT_DATA.flex,
      online: Array.isArray(saved?.online) ? saved.online : DEFAULT_DATA.online,
      campaigns: Array.isArray(saved?.campaigns) ? saved.campaigns : DEFAULT_DATA.campaigns,
      vendors: Array.isArray(saved?.vendors) ? saved.vendors : DEFAULT_DATA.vendors,
    }
  } catch {
    return DEFAULT_DATA
  }
}

function money(value) {
  return `₹${Math.round(parseFloat(value) || 0).toLocaleString('en-IN')}`
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────────────────────────
//  MODAL COMPONENT
// ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
  // MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function MarketingPage() {
  const [activeTab, setActiveTab] = useState('people')
  const [data, setData] = useState(loadMarketingData)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  // Form states
  const [personForm, setPersonForm] = useState({ name: '', phone: '', area: '', role: 'Field Marketing', status: 'Active', email: '', gender: 'Male', experience: '', address: '' })
  const [flexForm, setFlexForm] = useState({ title: '', location: '', size: '', cost: '', date: today(), status: 'Planned', vendor: '', installDate: '', removeDate: '', remarks: '' })
  const [onlineForm, setOnlineForm] = useState({ title: '', platform: 'Instagram', budget: '', startDate: today(), leads: '', status: 'Draft', clicks: 0, impressions: 0, ctr: 0, postUrl: '' })
  const [campaignForm, setCampaignForm] = useState({ name: '', startDate: today(), endDate: '', budget: '', spent: 0, status: 'Planning', objectives: '', channels: [] })
  const [vendorForm, setVendorForm] = useState({ name: '', contact: '', email: '', type: 'Flex Printing', address: '', rating: 0, services: [], notes: '' })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // ───────────── STATS ─────────────
  const stats = useMemo(() => {
    const flexSpend = data.flex.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0)
    const onlineSpend = data.online.reduce((sum, item) => sum + (parseFloat(item.budget) || 0), 0)
    const campaignSpend = data.campaigns.reduce((sum, item) => sum + (parseFloat(item.spent) || 0), 0)
    const totalSpend = flexSpend + onlineSpend + campaignSpend
    const leads = data.online.reduce((sum, item) => sum + (parseInt(item.leads) || 0), 0)
    const campaignLeads = data.campaigns.reduce((sum, item) => sum + (parseInt(item.leads) || 0), 0)
    return {
      people: data.people.length,
      flex: data.flex.length,
      online: data.online.length,
      campaigns: data.campaigns.length,
      vendors: data.vendors.length,
      totalSpend,
      leads: leads + campaignLeads,
      activeCampaigns: data.campaigns.filter(c => c.status === 'Running').length,
    }
  }, [data])

  // ───────────── FILTERED DATA ─────────────
  const filteredPeople = useMemo(() => {
    let filtered = data.people
    if (filter !== 'All') filtered = filtered.filter(p => p.status === filter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.phone.includes(q) || 
        p.area.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [data.people, filter, search])

  const filteredFlex = useMemo(() => {
    let filtered = data.flex
    if (filter !== 'All') filtered = filtered.filter(f => f.status === filter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(q) || 
        f.location.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [data.flex, filter, search])

  const filteredOnline = useMemo(() => {
    let filtered = data.online
    if (filter !== 'All') filtered = filtered.filter(o => o.status === filter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(o => o.title.toLowerCase().includes(q))
    }
    return filtered
  }, [data.online, filter, search])

  // ───────────── ACTIONS ─────────────
  const openNewModal = (tab) => {
    setActiveTab(tab)
    setEditingItem(null)
    setModalOpen(true)
  }

  const openEditModal = (tab, item) => {
    setActiveTab(tab)
    setEditingItem(item)
    setModalOpen(true)
    if (tab === 'people') setPersonForm({ ...item })
    if (tab === 'flex') setFlexForm({ ...item })
    if (tab === 'online') setOnlineForm({ ...item })
    if (tab === 'campaigns') setCampaignForm({ ...item })
    if (tab === 'vendors') setVendorForm({ ...item })
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!editingItem) {
      // Add new
      if (activeTab === 'people') {
        setData(prev => ({ ...prev, people: [{ ...personForm, id: `MKT-P-${Date.now().toString().slice(-5)}` }, ...prev.people] }))
      } else if (activeTab === 'flex') {
        setData(prev => ({ ...prev, flex: [{ ...flexForm, id: `MKT-F-${Date.now().toString().slice(-5)}` }, ...prev.flex] }))
      } else if (activeTab === 'online') {
        setData(prev => ({ ...prev, online: [{ ...onlineForm, id: `MKT-O-${Date.now().toString().slice(-5)}` }, ...prev.online] }))
      } else if (activeTab === 'campaigns') {
        setData(prev => ({ ...prev, campaigns: [{ ...campaignForm, id: `MKT-C-${Date.now().toString().slice(-5)}` }, ...prev.campaigns] }))
      } else if (activeTab === 'vendors') {
        setData(prev => ({ ...prev, vendors: [{ ...vendorForm, id: `MKT-V-${Date.now().toString().slice(-5)}` }, ...prev.vendors] }))
      }
    } else {
      // Edit existing
      if (activeTab === 'people') {
        setData(prev => ({ ...prev, people: prev.people.map(p => p.id === editingItem.id ? { ...personForm } : p) }))
      } else if (activeTab === 'flex') {
        setData(prev => ({ ...prev, flex: prev.flex.map(f => f.id === editingItem.id ? { ...flexForm } : f) }))
      } else if (activeTab === 'online') {
        setData(prev => ({ ...prev, online: prev.online.map(o => o.id === editingItem.id ? { ...onlineForm } : o) }))
      } else if (activeTab === 'campaigns') {
        setData(prev => ({ ...prev, campaigns: prev.campaigns.map(c => c.id === editingItem.id ? { ...campaignForm } : c) }))
      } else if (activeTab === 'vendors') {
        setData(prev => ({ ...prev, vendors: prev.vendors.map(v => v.id === editingItem.id ? { ...vendorForm } : v) }))
      }
    }
    setModalOpen(false)
    setEditingItem(null)
  }

  const confirmDelete = (bucket, id) => {
    setShowDeleteConfirm({ bucket, id })
  }

  const deleteItem = () => {
    if (showDeleteConfirm) {
      setData(prev => ({ ...prev, [showDeleteConfirm.bucket]: prev[showDeleteConfirm.bucket].filter(i => i.id !== showDeleteConfirm.id) }))
      setShowDeleteConfirm(null)
    }
  }

  const closeDeleteModal = () => setShowDeleteConfirm(null)

  // ───────────── CHANNELS TOGGLE ─────────────
  const toggleChannel = (channel) => {
    setCampaignForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channel) 
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }))
  }

  const CHANNELS = ['Online', 'Flex', 'Social Media', 'Walk In', 'Referral']

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            Marketing <Megaphone className="h-5 w-5 text-blue-600" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage marketing personnel, campaigns, flex advertising, and online promotions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Download className="h-4 w-4" /> Export
          </button>
          <button 
            type="button"
            onClick={() => openNewModal(activeTab)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> New {TABS.find(t => t.id === activeTab)?.label.split(' ')[0]}
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Marketing People" value={stats.people} tone="blue" icon={UserRound} />
        <SummaryCard label="Active Campaigns" value={stats.activeCampaigns} tone="violet" icon={Target} />
        <SummaryCard label="Total Spend" value={money(stats.totalSpend)} tone="amber" icon={DollarSign} />
        <SummaryCard label="Generated Leads" value={stats.leads} tone="emerald" icon={UsersRound} />
        <SummaryCard label="Vendors" value={stats.vendors} tone="cyan" icon={Building2} />
      </div>

      {/* TABS */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                  activeTab === tab.id
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/50'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-[400px] p-5">
          {activeTab === 'people' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search people by name, phone, or area..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <PeopleTable 
                rows={filteredPeople} 
                onEdit={item => openEditModal('people', item)}
                onDelete={id => confirmDelete('people', id)}
              />
            </div>
          )}

          {activeTab === 'flex' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search flex campaigns..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Planned">Planned</option>
                  <option value="Printing">Printing</option>
                  <option value="Installed">Installed</option>
                  <option value="Removed">Removed</option>
                </select>
              </div>
              <FlexTable 
                rows={filteredFlex} 
                onEdit={item => openEditModal('flex', item)}
                onDelete={id => confirmDelete('flex', id)}
              />
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search online promotions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
              <OnlineTable 
                rows={filteredOnline} 
                onEdit={item => openEditModal('online', item)}
                onDelete={id => confirmDelete('online', id)}
              />
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Planning">Planning</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <CampaignsTable 
                rows={data.campaigns} 
                onEdit={item => openEditModal('campaigns', item)}
                onDelete={id => confirmDelete('campaigns', id)}
              />
            </div>
          )}

          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="All">All Types</option>
                  <option value="Flex Printing">Flex Printing</option>
                  <option value="Digital Agency">Digital Agency</option>
                  <option value="Photography">Photography</option>
                  <option value="Content Creation">Content Creation</option>
                </select>
              </div>
              <VendorsTable 
                rows={data.vendors} 
                onEdit={item => openEditModal('vendors', item)}
                onDelete={id => confirmDelete('vendors', id)}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsDashboard data={data} stats={stats} />
            </div>
          )}
        </div>
      </div>

      {/* EDIT/NEW MODAL */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingItem ? `Edit ${TABS.find(t => t.id === activeTab)?.label}` : `Add ${TABS.find(t => t.id === activeTab)?.label}`}
      >
        <form onSubmit={handleSave} className="space-y-5">
          {activeTab === 'people' && <PersonForm form={personForm} setForm={setPersonForm} channels={CHANNELS} />}
          {activeTab === 'flex' && <FlexForm form={flexForm} setForm={setFlexForm} />}
          {activeTab === 'online' && <OnlineForm form={onlineForm} setForm={setOnlineForm} />}
          {activeTab === 'campaigns' && <CampaignForm form={campaignForm} setForm={setCampaignForm} channels={CHANNELS} toggleChannel={toggleChannel} />}
          {activeTab === 'vendors' && <VendorForm form={vendorForm} setForm={setVendorForm} />}
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm">
              {editingItem ? 'Update' : 'Save'} {TABS.find(t => t.id === activeTab)?.label}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <Modal open={true} onClose={closeDeleteModal} title="Confirm Deletion">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={closeDeleteModal} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={deleteItem} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition shadow-sm">
                Delete Permanently
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SUMMARY CARD COMPONENT
// ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, tone, icon: Icon }) {
  const toneClass = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  }[tone]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className={cn('mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xl font-black', toneClass)}>{value}</p>
        </div>
        {Icon && <Icon className="h-5 w-5 text-slate-300" />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  FORM LABEL & INPUT COMPONENTS
// ─────────────────────────────────────────────────────────────
function FieldLabel({ text, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
      {text} {required && <span className="text-red-400">*</span>}
    </label>
  )
}

function FieldInput({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
    />
  )
}

function FieldSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─────────────────────────────────────────────────────────────
//  PEOPLE FORM
// ─────────────────────────────────────────────────────────────
function PersonForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <FieldInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" required />
          <FieldInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number *" required />
          <FieldInput value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email Address" />
          <FieldInput value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Area / Location" />
        </div>
        <div className="mt-3">
          <FieldInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full Address" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Role Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel text="Role / Designation" />
            <FieldSelect 
              value={form.role} 
              onChange={e => setForm({ ...form, role: e.target.value })} 
              options={['Field Marketing', 'Digital Marketing', 'Campaign Manager', 'Marketing Executive', 'Sales Marketer']}
              placeholder="Select Role"
            />
          </div>
          <div>
            <FieldLabel text="Gender" />
            <FieldSelect 
              value={form.gender} 
              onChange={e => setForm({ ...form, gender: e.target.value })} 
              options={['Male', 'Female', 'Other']}
              placeholder="Select Gender"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <FieldInput 
            value={form.experience} 
            onChange={e => setForm({ ...form, experience: e.target.value })} 
            placeholder="Years of Experience" 
          />
          <div>
            <FieldLabel text="Status" />
            <FieldSelect 
              value={form.status} 
              onChange={e => setForm({ ...form, status: e.target.value })} 
              options={['Active', 'Paused', 'Inactive', 'On Leave']}
              placeholder="Select Status"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  FLEX FORM
// ─────────────────────────────────────────────────────────────
function FlexForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Campaign Details</h3>
        <div className="space-y-3">
          <FieldInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Campaign Title *" required />
          <FieldInput value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Installation Location *" required />
          <div className="grid grid-cols-2 gap-3">
            <FieldInput value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Size (e.g., 8x4 ft)" />
            <FieldInput 
              type="number" 
              value={form.cost} 
              onChange={e => setForm({ ...form, cost: e.target.value })} 
              placeholder="Cost in ₹" 
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Timeline & Status</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel text="Date" />
            <FieldInput 
              type="date" 
              value={form.date} 
              onChange={e => setForm({ ...form, date: e.target.value })} 
            />
          </div>
          <div>
            <FieldLabel text="Status" />
            <FieldSelect 
              value={form.status} 
              onChange={e => setForm({ ...form, status: e.target.value })} 
              options={['Planned', 'Printing', 'Installed', 'Removed', 'Maintenance']}
              placeholder="Select Status"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FieldInput 
            type="date" 
            value={form.installDate} 
            onChange={e => setForm({ ...form, installDate: e.target.value })} 
            placeholder="Install Date" 
          />
          <FieldInput 
            type="date" 
            value={form.removeDate} 
            onChange={e => setForm({ ...form, removeDate: e.target.value })} 
            placeholder="Remove Date" 
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vendor Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor Name" />
        </div>
        <div className="mt-3">
          <FieldLabel text="Remarks / Notes" />
          <textarea
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            rows={3}
            placeholder="Additional notes about this flex installation..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  ONLINE FORM
// ─────────────────────────────────────────────────────────────
function OnlineForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Promotion Details</h3>
        <div className="space-y-3">
          <FieldInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Promotion Title *" required />
          <FieldInput value={form.postUrl} onChange={e => setForm({ ...form, postUrl: e.target.value })} placeholder="Post URL / Link" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <FieldLabel text="Platform" />
            <FieldSelect 
              value={form.platform} 
              onChange={e => setForm({ ...form, platform: e.target.value })} 
              options={['Instagram', 'Facebook', 'Google Ads', 'WhatsApp', 'YouTube', 'LinkedIn', 'Twitter']}
              placeholder="Select Platform"
            />
          </div>
          <FieldInput 
            type="number" 
            value={form.budget} 
            onChange={e => setForm({ ...form, budget: e.target.value })} 
            placeholder="Budget in ₹" 
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Performance Metrics</h3>
        <div className="grid grid-cols-3 gap-3">
          <FieldInput 
            type="number" 
            value={form.leads} 
            onChange={e => setForm({ ...form, leads: e.target.value })} 
            placeholder="Leads Generated" 
          />
          <FieldInput 
            type="number" 
            value={form.clicks} 
            onChange={e => setForm({ ...form, clicks: e.target.value })} 
            placeholder="Clicks" 
          />
          <FieldInput 
            type="number" 
            value={form.impressions} 
            onChange={e => setForm({ ...form, impressions: e.target.value })} 
            placeholder="Impressions" 
          />
        </div>
        <div className="mt-3">
          <FieldLabel text="CTR (%)" />
          <FieldInput 
            type="number" 
            value={form.ctr} 
            onChange={e => setForm({ ...form, ctr: e.target.value })} 
            placeholder="Click-through rate" 
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Schedule & Status</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel text="Start Date" />
            <FieldInput 
              type="date" 
              value={form.startDate} 
              onChange={e => setForm({ ...form, startDate: e.target.value })} 
            />
          </div>
          <div>
            <FieldLabel text="Status" />
            <FieldSelect 
              value={form.status} 
              onChange={e => setForm({ ...form, status: e.target.value })} 
              options={['Draft', 'Running', 'Completed', 'Paused', 'Scheduled']}
              placeholder="Select Status"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  CAMPAIGN FORM
// ─────────────────────────────────────────────────────────────
function CampaignForm({ form, setForm, channels, toggleChannel }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Campaign Details</h3>
        <div className="space-y-3">
          <FieldInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Campaign Name *" required />
          <FieldInput 
            value={form.objectives} 
            onChange={e => setForm({ ...form, objectives: e.target.value })} 
            placeholder="Campaign Objectives (e.g., Sales, Awareness, Lead Generation)" 
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <FieldLabel text="Start Date" />
            <FieldInput 
              type="date" 
              value={form.startDate} 
              onChange={e => setForm({ ...form, startDate: e.target.value })} 
            />
          </div>
          <div>
            <FieldLabel text="End Date" />
            <FieldInput 
              type="date" 
              value={form.endDate} 
              onChange={e => setForm({ ...form, endDate: e.target.value })} 
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Budget & Status</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel text="Total Budget" />
            <FieldInput 
              type="number" 
              value={form.budget} 
              onChange={e => setForm({ ...form, budget: e.target.value })} 
              placeholder="Budget in ₹" 
            />
          </div>
          <div>
            <FieldLabel text="Spent Amount" />
            <FieldInput 
              type="number" 
              value={form.spent} 
              onChange={e => setForm({ ...form, spent: e.target.value })} 
              placeholder="Spent in ₹" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <FieldLabel text="Status" />
            <FieldSelect 
              value={form.status} 
              onChange={e => setForm({ ...form, status: e.target.value })} 
              options={['Planning', 'Running', 'Completed', 'Cancelled']}
              placeholder="Select Status"
            />
          </div>
          <div>
            <FieldLabel text="Leads Generated" />
            <FieldInput 
              type="number" 
              value={form.leads} 
              onChange={e => setForm({ ...form, leads: e.target.value })} 
              placeholder="Leads" 
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Marketing Channels</h3>
        <div className="flex flex-wrap gap-2">
          {channels.map(channel => (
            <button
              key={channel}
              type="button"
              onClick={() => toggleChannel(channel)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border',
                form.channels.includes(channel)
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
              )}
            >
              {channel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  VENDOR FORM
// ─────────────────────────────────────────────────────────────
function VendorForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vendor Information</h3>
        <div className="space-y-3">
          <FieldInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Vendor Name *" required />
          <FieldInput value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email Address" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FieldInput value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Contact Number *" required />
          <div>
            <FieldLabel text="Vendor Type" />
            <FieldSelect 
              value={form.type} 
              onChange={e => setForm({ ...form, type: e.target.value })} 
              options={['Flex Printing', 'Digital Agency', 'Photography', 'Content Creation', 'Influencer', 'Media Planning']}
              placeholder="Select Type"
            />
          </div>
        </div>
        <div className="mt-3">
          <FieldInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full Address" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Performance & Services</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel text="Rating (1-5)" />
            <select
              value={form.rating}
              onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} - {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][num - 1]}</option>)}
            </select>
          </div>
          <FieldInput 
            value={form.services.join(', ')} 
            onChange={e => setForm({ ...form, services: e.target.value.split(',').map(s => s.trim()) })} 
            placeholder="Services (comma separated)" 
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Notes</h3>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Any additional information about this vendor..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PEOPLE TABLE
// ─────────────────────────────────────────────────────────────
function PeopleTable({ rows, onEdit, onDelete }) {
  if (rows.length === 0) {
    return <EmptyState message="No marketing personnel added yet. Click 'Add' to create one." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Area</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Role</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {row.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{row.name}</p>
                    <p className="text-[10px] text-slate-400">{row.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.phone}</td>
              <td className="px-4 py-3 text-slate-600">{row.area || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{row.role}</td>
              <td className="px-4 py-3">
                <StatusPill value={row.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(row.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  FLEX TABLE
// ─────────────────────────────────────────────────────────────
function FlexTable({ rows, onEdit, onDelete }) {
  if (rows.length === 0) {
    return <EmptyState message="No flex advertising added yet. Click 'Add' to create one." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Campaign</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Location</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Size</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Date</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Cost</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-bold text-slate-800">{row.title}</p>
                  <p className="text-[10px] text-slate-400">{row.id}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.location}</td>
              <td className="px-4 py-3 text-slate-600">{row.size || '—'}</td>
              <td className="px-4 py-3 text-slate-600">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <CalendarDays className="h-3 w-3 text-slate-400" />
                  {fmtDate(row.date)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{money(row.cost)}</td>
              <td className="px-4 py-3">
                <StatusPill value={row.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(row.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  ONLINE TABLE
// ─────────────────────────────────────────────────────────────
function OnlineTable({ rows, onEdit, onDelete }) {
  if (rows.length === 0) {
    return <EmptyState message="No online promotions added yet. Click 'Add' to create one." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Promotion</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Platform</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Start Date</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Budget</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Leads</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-bold text-slate-800">{row.title}</p>
                  <p className="text-[10px] text-slate-400">{row.id}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  <MonitorSmartphone className="h-3 w-3" />
                  {row.platform}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{fmtDate(row.startDate)}</td>
              <td className="px-4 py-3 text-slate-600">{money(row.budget)}</td>
              <td className="px-4 py-3 font-bold text-emerald-600">{row.leads || 0}</td>
              <td className="px-4 py-3">
                <StatusPill value={row.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(row.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  CAMPAIGNS TABLE
// ─────────────────────────────────────────────────────────────
function CampaignsTable({ rows, onEdit, onDelete }) {
  if (rows.length === 0) {
    return <EmptyState message="No campaigns added yet. Click 'Add' to create one." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Campaign</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Dates</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Channels</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Budget</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-bold text-slate-800">{row.name}</p>
                  <p className="text-[10px] text-slate-400">{row.id}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <div className="flex flex-col text-xs">
                  <span>From: {fmtDate(row.startDate)}</span>
                  <span>To: {row.endDate ? fmtDate(row.endDate) : 'Ongoing'}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {row.channels.map((channel, idx) => (
                    <span key={idx} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {channel}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <div className="flex flex-col">
                  <span>{money(row.budget)}</span>
                  <span className="text-xs text-slate-400">Spent: {money(row.spent)}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusPill value={row.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(row.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  VENDORS TABLE
// ─────────────────────────────────────────────────────────────
function VendorsTable({ rows, onEdit, onDelete }) {
  if (rows.length === 0) {
    return <EmptyState message="No marketing vendors added yet. Click 'Add' to create one." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Vendor</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Type</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Rating</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Services</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {row.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{row.name}</p>
                    <p className="text-[10px] text-slate-400">{row.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" /> {row.contact}
                  </span>
                  {row.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400" /> {row.email}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.type}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-500">★</span>
                  <span className="text-sm font-semibold text-slate-700">{row.rating}/5</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {row.services.slice(0, 3).map((service, idx) => (
                    <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      {service}
                    </span>
                  ))}
                  {row.services.length > 3 && (
                    <span className="text-xs text-slate-400">+{row.services.length - 3} more</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(row.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <p className="text-sm font-semibold text-slate-400">{message}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  STATUS PILL COMPONENT
// ─────────────────────────────────────────────────────────────
function StatusPill({ value }) {
  const isGood = ['Active', 'Running', 'Installed', 'Completed', 'Available'].includes(value)
  const isWarn = ['Planned', 'Printing', 'Draft', 'Paused', 'Scheduled'].includes(value)
  const isDanger = ['Overdue', 'Removed', 'Cancelled', 'Inactive'].includes(value)

  let colorClass = 'border-slate-200 bg-slate-50 text-slate-600'
  if (isGood) colorClass = 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (isWarn) colorClass = 'border-amber-200 bg-amber-50 text-amber-700'
  if (isDanger) colorClass = 'border-red-200 bg-red-50 text-red-700'

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold',
      colorClass
    )}>
      {value}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
//  ANALYTICS DASHBOARD
// ─────────────────────────────────────────────────────────────
function AnalyticsDashboard({ data, stats }) {
  const totalRevenue = stats.totalSpend
  const totalLeads = stats.leads
  const conversionRate = totalLeads > 0 ? ((totalLeads / totalRevenue) * 100).toFixed(1) : 0
  
  // Get leads per platform
  const leadsByPlatform = data.online.reduce((acc, item) => {
    if (!acc[item.platform]) acc[item.platform] = 0
    acc[item.platform] += item.leads || 0
    return acc
  }, {})

  // Get spend by category
  const spendByCategory = {
    flex: data.flex.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0),
    online: data.online.reduce((sum, item) => sum + (parseFloat(item.budget) || 0), 0),
    campaigns: data.campaigns.reduce((sum, item) => sum + (parseFloat(item.spent) || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* KEY METRICS */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatBox label="Total Marketing Spend" value={money(totalRevenue)} sub="Across all channels" />
        <StatBox label="Total Leads Generated" value={totalLeads} sub="From campaigns & promotions" />
        <StatBox label="Conversion Rate" value={`${conversionRate}%`} sub="Leads per ₹ spent" />
        <StatBox label="Active Campaigns" value={stats.activeCampaigns} sub="Currently running" />
      </div>

      {/* PLATFORM PERFORMANCE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-blue-600" />
          Leads by Platform
        </h3>
        {Object.keys(leadsByPlatform).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No online promotion data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(leadsByPlatform).map(([platform, leads]) => (
              <div key={platform} className="flex items-center gap-4">
                <div className="w-24">
                  <p className="text-sm font-semibold text-slate-700">{platform}</p>
                  <p className="text-xs text-slate-400">{leads} leads</p>
                </div>
                <div className="flex-1 rounded-full bg-slate-100 h-2">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min((leads / Math.max(...Object.values(leadsByPlatform))) * 100, 100)}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-bold text-slate-800">{leads}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SPEND BREAKDOWN */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Spend by Category
          </h3>
          <div className="space-y-4">
            <SpendBar label="Flex Advertising" amount={spendByCategory.flex} total={totalRevenue} color="bg-violet-500" />
            <SpendBar label="Online Promotion" amount={spendByCategory.online} total={totalRevenue} color="bg-blue-500" />
            <SpendBar label="Campaigns" amount={spendByCategory.campaigns} total={totalRevenue} color="bg-emerald-500" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-600" />
            Campaign Status
          </h3>
          <div className="space-y-3">
            {data.campaigns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No campaigns added yet</p>
            ) : (
              data.campaigns.map(campaign => {
                const progress = campaign.budget > 0 ? Math.min((campaign.spent / campaign.budget) * 100, 100) : 0
                return (
                  <div key={campaign.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-800">{campaign.name}</p>
                      <StatusPill value={campaign.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>Budget: {money(campaign.budget)}</span>
                      <span>•</span>
                      <span>Spent: {money(campaign.spent)}</span>
                    </div>
                    <div className="w-full rounded-full bg-slate-200 h-1.5">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          campaign.status === 'Running' ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          Recent Marketing Activities
        </h3>
        <div className="space-y-3">
          {[...data.flex, ...data.online, ...data.campaigns].sort((a, b) => {
            const dateA = new Date(a.date || a.startDate || a.created)
            const dateB = new Date(b.date || b.startDate || b.created)
            return dateB - dateA
          }).slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className="mt-1">
                {item.location || item.platform ? (
                  <MonitorSmartphone className="h-4 w-4 text-blue-500" />
                ) : (
                  <Megaphone className="h-4 w-4 text-violet-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {item.title || item.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.location ? `Location: ${item.location}` : item.platform ? `Platform: ${item.platform}` : 'Campaign'} • {money(item.cost || item.budget || item.spent)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {fmtDate(item.date || item.startDate || today())}
                </p>
              </div>
            </div>
          ))}
          {data.flex.length + data.online.length + data.campaigns.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
    </div>
  )
}

function SpendBar({ label, amount, total, color }) {
  const percentage = total > 0 ? Math.min((amount / total) * 100, 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{money(amount)}</span>
      </div>
      <div className="w-full rounded-full bg-slate-100 h-2">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}