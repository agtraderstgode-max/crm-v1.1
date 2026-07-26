import { useState, useEffect } from 'react'
import {
  BarChart3, PieChart, TrendingUp, DollarSign, Activity,
  Users, ShoppingCart, Package, ArrowUpRight, ArrowDownRight,
  Filter, Calendar, Layers, CheckCircle2, AlertCircle, Percent,
  CreditCard, ShieldAlert, Award
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

// Helper to parse numerical currency string
function parseAmount(amtStr) {
  if (!amtStr) return 0
  const clean = String(amtStr).replace(/[^\d.]/g, '')
  return parseFloat(clean) || 0
}

export function AnalysisPage() {
  const [timeRange, setTimeRange] = useState('30d') // '7d' | '30d' | 'year' | 'all'
  const [loading, setLoading] = useState(true)

  const [customers, setCustomers] = useState([])
  const [leads, setLeads] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/customers').then(res => res.json()).catch(() => []),
      fetch('/api/leads').then(res => res.json()).catch(() => []),
      fetch('/api/orders').then(res => res.json()).catch(() => []),
      fetch('/api/products').then(res => res.json()).catch(() => []),
      fetch('/api/categories').then(res => res.json()).catch(() => [])
    ])
    .then(([custData, leadsData, ordersData, prodData, catData]) => {
      setCustomers(Array.isArray(custData) ? custData : [])
      setLeads(Array.isArray(leadsData) ? leadsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setProducts(Array.isArray(prodData) ? prodData : [])
      setCategories(Array.isArray(catData) ? catData : [])
      setLoading(false)
    })
    .catch(err => {
      console.error("Error fetching analysis metrics:", err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        <p className="text-sm font-medium animate-pulse">Analyzing CRM business data & intelligence...</p>
      </div>
    )
  }

  // --- Metrics Computation ---

  // 1. Revenue & Sales Analysis
  const totalRevenue = orders.reduce((sum, o) => sum + (parseAmount(o.amount || o.total) || 0), 0)
  const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length
  const processingOrders = orders.filter(o => o.status === 'Processing' || o.status === 'Pending').length
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

  // 2. Lead Conversion Analysis
  const totalLeadsCount = leads.length
  const convertedLeads = leads.filter(l => l.status === 'Customer Bought' || l.status === 'Closed' || l.status === 'Bought').length
  const lostLeads = leads.filter(l => l.status === 'Lost Customer' || l.status === 'Lost').length
  const activeLeads = totalLeadsCount - convertedLeads - lostLeads
  const conversionRate = totalLeadsCount > 0 ? ((convertedLeads / totalLeadsCount) * 100).toFixed(1) : '0.0'

  // Lead Sources Distribution
  const leadSourceCounts = {}
  leads.forEach(l => {
    const src = l.source || 'Direct Walk-in'
    leadSourceCounts[src] = (leadSourceCounts[src] || 0) + 1
  })

  // 3. Customer Payments & Outstanding Analysis
  const totalPendingAmount = customers.reduce((sum, c) => sum + (parseAmount(c.pendingAmount) || 0), 0)
  const totalCustomerBought = customers.reduce((sum, c) => sum + (parseAmount(c.expectedAmount || c.totalBought) || 0), 0)
  const totalReceivedAmount = customers.reduce((sum, c) => sum + (parseAmount(c.paidAmount) || 0), 0)
  const collectionEfficiency = (totalReceivedAmount + totalPendingAmount) > 0 
    ? ((totalReceivedAmount / (totalReceivedAmount + totalPendingAmount)) * 100).toFixed(1)
    : '100.0'

  // 4. Inventory Health & Stock Analysis
  const totalStockBoxes = products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0)
  const lowStockCount = products.filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.min) || 20)).length
  const totalProductsCount = products.length

  // Category Breakdown Metrics
  const categoryStock = {}
  products.forEach(p => {
    const catName = p.category || 'Unclassified'
    if (!categoryStock[catName]) categoryStock[catName] = { count: 0, boxes: 0 }
    categoryStock[catName].count += 1
    categoryStock[catName].boxes += (parseInt(p.stock) || 0)
  })

  const topCategories = Object.entries(categoryStock)
    .sort((a, b) => b[1].boxes - a[1].boxes)
    .slice(0, 5)

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business Analysis & Analytics</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-100">
              Live BI
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Real-time performance analytics, revenue conversion, and inventory health</p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                timeRange === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{orders.length} Total Orders</span>
            <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> Avg ₹{avgOrderValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Conversion Rate</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{conversionRate}%</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{convertedLeads} Won / {totalLeadsCount} Total</span>
            <span className="font-semibold text-slate-400">{activeLeads} Active Leads</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Receivables</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">₹{totalPendingAmount.toLocaleString('en-IN')}</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Collection Rate</span>
            <span className="font-bold text-amber-600">{collectionEfficiency}% Collected</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inventory Stock</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{totalStockBoxes.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-400">boxes</span></p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{totalProductsCount} SKUs Listed</span>
            {lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3" /> {lowStockCount} Low Stock
              </span>
            ) : (
              <span className="font-semibold text-emerald-600">Stock Healthy</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lead Conversion Funnel & Sources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversion Funnel Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lead Pipeline & Conversion Funnel</h3>
                <p className="text-xs text-slate-500 mt-0.5">Stage-by-stage progression from initial enquiry to closed order</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { stage: 'Total Enquiries / Leads Received', count: totalLeadsCount, pct: 100, color: 'bg-blue-500' },
                { stage: 'Active Pipeline (In Discussion / Follow-up)', count: activeLeads, pct: totalLeadsCount > 0 ? Math.round((activeLeads / totalLeadsCount) * 100) : 0, color: 'bg-indigo-500' },
                { stage: 'Closed Sales (Customer Bought)', count: convertedLeads, pct: totalLeadsCount > 0 ? Math.round((convertedLeads / totalLeadsCount) * 100) : 0, color: 'bg-emerald-500' },
                { stage: 'Lost Prospects', count: lostLeads, pct: totalLeadsCount > 0 ? Math.round((lostLeads / totalLeadsCount) * 100) : 0, color: 'bg-rose-400' },
              ].map(f => (
                <div key={f.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{f.stage}</span>
                    <span>{f.count} ({f.pct}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-500 rounded-full', f.color)}
                      style={{ width: `${Math.max(f.pct, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Sources Distribution Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lead Source Channel Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Where your tile customers & builders come from</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <PieChart className="h-4 w-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(leadSourceCounts).map(([source, count]) => {
                const percentage = totalLeadsCount > 0 ? Math.round((count / totalLeadsCount) * 100) : 0
                return (
                  <div key={source} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{source}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{count} enquiries</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Stock Categories & Order Status */}
        <div className="space-y-6">
          {/* Category Inventory Share */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Category Stock Volume</h3>
                <p className="text-xs text-slate-500 mt-0.5">Top stock classifications in showroom</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-4">
              {topCategories.map(([catName, stats]) => {
                const pct = totalStockBoxes > 0 ? Math.round((stats.boxes / totalStockBoxes) * 100) : 0
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">{catName}</span>
                      <span className="font-semibold text-slate-500">{stats.boxes} bxs ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Orders Fulfillment Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order Health</h3>
                <p className="text-xs text-slate-500 mt-0.5">Fulfillment status overview</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Delivered / Completed</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">{completedOrders} orders</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800">Processing / In Transit</span>
                </div>
                <span className="text-xs font-bold text-amber-700">{processingOrders} orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
