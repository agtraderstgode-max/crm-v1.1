import { useState, useEffect } from 'react'
import { Search, ShoppingBag, Phone, MapPin, User, FileText, Printer, ChevronRight, Plus, Minus, Trash2, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Quotation item row ────────────────────────────────────────
function QuotationRow({ item, idx, onChange, onRemove }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 px-3 text-sm text-slate-600">{idx + 1}</td>
      <td className="py-2 px-3">
        <input
          type="text"
          value={item.description}
          onChange={e => onChange(idx, 'description', e.target.value)}
          placeholder="Tile description / size / brand..."
          className="w-full text-sm text-slate-700 outline-none border-b border-slate-200 focus:border-blue-400 bg-transparent py-1"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          value={item.qty}
          onChange={e => onChange(idx, 'qty', e.target.value)}
          placeholder="0"
          className="w-20 text-sm text-center text-slate-700 outline-none border-b border-slate-200 focus:border-blue-400 bg-transparent py-1"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="text"
          value={item.unit}
          onChange={e => onChange(idx, 'unit', e.target.value)}
          placeholder="sqft"
          className="w-16 text-sm text-slate-600 outline-none border-b border-slate-200 focus:border-blue-400 bg-transparent py-1"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          value={item.rate}
          onChange={e => onChange(idx, 'rate', e.target.value)}
          placeholder="0"
          className="w-24 text-sm text-right text-slate-700 outline-none border-b border-slate-200 focus:border-blue-400 bg-transparent py-1"
        />
      </td>
      <td className="py-2 px-3 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">
        ₹{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString('en-IN')}
      </td>
      <td className="py-2 px-3">
        <button onClick={() => onRemove(idx)} className="text-slate-300 hover:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ─── Buying Now Page ───────────────────────────────────────────
export function BuyingNowPage() {
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [quotationItems, setQuotationItems] = useState([
    { description: '', qty: '', unit: 'sqft', rate: '' }
  ])
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(data => setLeads(data))
      .catch(err => console.error(err))
  }, [])

  // Filter: show all active leads (not lost)
  const filtered = leads
    .filter(l => l.status !== 'Lost Customer')
    .filter(l => {
      const q = search.toLowerCase()
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.location || '').toLowerCase().includes(q)
      )
    })

  const subtotal = quotationItems.reduce((sum, item) => {
    return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)
  }, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = subtotal - discountAmt

  const handleItemChange = (idx, field, val) => {
    setQuotationItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: val }
      return updated
    })
  }

  const addRow = () => {
    setQuotationItems(prev => [...prev, { description: '', qty: '', unit: 'sqft', rate: '' }])
  }

  const removeRow = (idx) => {
    setQuotationItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSelectLead = (lead) => {
    setSelectedLead(lead)
    setSaved(false)
    setQuotationItems([{ description: '', qty: '', unit: 'sqft', rate: '' }])
    setDiscount('')
    setNotes(lead.remarks || '')
  }

  const handleSaveQuotation = () => {
    if (!selectedLead) return
    // Mark lead as Customer Bought
    const updated = {
      ...selectedLead,
      status: 'Customer Bought',
      expectedAmt: `₹${total.toLocaleString('en-IN')}`,
      remarks: notes,
    }
    fetch(`/api/leads/${selectedLead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(() => {
        setSaved(true)
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l))
        setSelectedLead(updated)
      })
      .catch(err => console.error(err))
  }

  const handlePrint = () => {
    window.print()
  }

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const quoteNo = selectedLead ? `QT-${selectedLead.id}-${Date.now().toString().slice(-4)}` : ''

  return (
    <div className="flex gap-6 h-full min-h-[80vh]">

      {/* ── LEFT: Customer picker ─────────────────────────────── */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Buying Now</h2>
          <p className="text-xs text-slate-500 mt-0.5">Select customer to create quotation</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search name, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-xs outline-none text-slate-600 placeholder:text-slate-400"
          />
        </div>

        {/* Lead list */}
        <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-6">No matching leads</p>
          )}
          {filtered.map(lead => (
            <button
              key={lead.id}
              onClick={() => handleSelectLead(lead)}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition-all',
                selectedLead?.id === lead.id
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  {lead.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{lead.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5" />{lead.phone}
                  </p>
                  {lead.location && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{lead.location}
                    </p>
                  )}
                  <span className={cn(
                    'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    lead.status === 'Customer Bought' ? 'bg-emerald-100 text-emerald-700' :
                    lead.status === 'New Entry' ? 'bg-slate-100 text-slate-500' :
                    'bg-violet-100 text-violet-600'
                  )}>
                    {lead.status}
                  </span>
                </div>
                {selectedLead?.id === lead.id && (
                  <ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Quotation builder ──────────────────────────── */}
      <div className="flex-1 min-w-0">
        {!selectedLead ? (
          <div className="flex h-full items-center justify-center text-slate-300">
            <div className="text-center space-y-3">
              <ShoppingBag className="h-16 w-16 mx-auto opacity-30" />
              <p className="text-base font-medium text-slate-400">Select a customer to begin</p>
              <p className="text-xs text-slate-400">Quotation will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 print:p-0" id="quotation-area">

            {/* Quotation Header */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 print:shadow-none print:border-none">
              <div className="flex items-start justify-between gap-4">
                {/* Company info */}
                <div>
                  <h1 className="text-xl font-bold text-slate-900">AG TRADERS</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Kallupalayam, Tiruchengode — 637209</p>
                  <p className="text-xs text-slate-500">Ph: 9876543210 | GSTIN: XXXXXXXXXXXXXXX</p>
                </div>

                {/* Quotation details */}
                <div className="text-right space-y-1">
                  <p className="text-lg font-bold text-blue-600">QUOTATION</p>
                  <p className="text-xs text-slate-500">No: <span className="font-semibold text-slate-700">{quoteNo}</span></p>
                  <p className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-700">{today}</span></p>
                  {saved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle className="h-3 w-3" /> Marked as Bought
                    </span>
                  )}
                </div>
              </div>

              {/* Customer info bar */}
              <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold">{selectedLead.name}</span>
                    <span className="text-slate-400 text-xs">({selectedLead.custType})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                    <Phone className="h-3 w-3 text-slate-400" /> {selectedLead.phone}
                  </div>
                  {selectedLead.location && (
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs col-span-2">
                      <MapPin className="h-3 w-3 text-slate-400" /> {selectedLead.location}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-3 text-[10px] text-slate-400">
                  <span>Lead ID: <strong className="text-slate-600">{selectedLead.id}</strong></span>
                  {selectedLead.size && <span>Area: <strong className="text-slate-600">{selectedLead.size} sqft</strong></span>}
                  {selectedLead.budget && <span>Budget: <strong className="text-slate-600">{selectedLead.budget}</strong></span>}
                </div>
              </div>
            </div>

            {/* Quotation Items Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide w-8">#</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide w-20">Qty</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide w-16">Unit</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide w-24 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide w-28 text-right">Amount</th>
                    <th className="py-2.5 px-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotationItems.map((item, idx) => (
                    <QuotationRow
                      key={idx}
                      item={item}
                      idx={idx}
                      onChange={handleItemChange}
                      onRemove={removeRow}
                    />
                  ))}
                </tbody>
              </table>

              {/* Add row */}
              <div className="px-4 py-2 border-t border-dashed border-slate-200">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="ml-auto w-64 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 gap-3">
                    <span className="flex-shrink-0">Discount (₹)</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-24 text-right text-sm text-slate-700 outline-none border-b border-slate-300 focus:border-blue-400 bg-transparent py-0.5"
                    />
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-300 pt-2">
                    <span>Total</span>
                    <span className="text-blue-600">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes / Terms</p>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes or terms for this quotation..."
                className="w-full text-sm text-slate-600 outline-none resize-none border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 print:hidden">
              <button
                onClick={handleSaveQuotation}
                disabled={saved}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                {saved ? 'Marked as Bought' : 'Save & Mark as Bought'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
              >
                <Printer className="h-4 w-4" /> Print Quotation
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
