import { useState, useEffect, useMemo } from 'react'
import { 
  Receipt, Plus, Search, FileText, CheckCircle2, Clock, 
  AlertCircle, X, Trash2, Printer, IndianRupee, Building2, Tag, 
  ArrowDownCircle, PackageMinus, ShieldCheck
} from 'lucide-react'
import { fmtDate, cn } from '@/lib/utils'

export function BillingPage() {
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // New Invoice Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingInvoice, setSavingInvoice] = useState(false)

  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_gstin: '',
    customer_address: '',
    date: new Date().toISOString().split('T')[0],
    supply_type: 'INTRA_STATE', // INTRA_STATE (CGST+SGST) | INTER_STATE (IGST)
    payment_mode: 'Cash',
    paid_amount: 0,
    payment_status: 'Paid',
    notes: ''
  })

  // Invoice Line Items
  const [lineItems, setLineItems] = useState([
    {
      product_id: '',
      product_name: '',
      brand: 'KAG',
      size: '',
      hsn_code: '69072300',
      gst_percent: 18,
      unit: 'boxes',
      quantity: 1,
      rate: 0,
      available_stock: 0
    }
  ])

  // View / Print Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Fetch Data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, prodRes, custRes] = await Promise.all([
        fetch('/api/billing/invoices').then(r => r.json()).catch(() => []),
        fetch('/api/products').then(r => r.json()).catch(() => []),
        fetch('/api/customers').then(r => r.json()).catch(() => [])
      ])
      setInvoices(invRes || [])
      setProducts(prodRes || [])
      setCustomers(custRes || [])
    } catch (err) {
      console.error('Error fetching billing data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Open New Invoice Modal
  const handleOpenNewInvoice = () => {
    const nextInvNo = `INV-${String(invoices.length + 1).padStart(4, '0')}`
    setInvoiceForm({
      id: nextInvNo,
      customer_name: '',
      customer_phone: '',
      customer_gstin: '',
      customer_address: '',
      date: new Date().toISOString().split('T')[0],
      supply_type: 'INTRA_STATE',
      payment_mode: 'Cash',
      paid_amount: 0,
      payment_status: 'Paid',
      notes: ''
    })
    setLineItems([
      {
        product_id: '',
        product_name: '',
        brand: 'KAG',
        size: '',
        hsn_code: '69072300',
        gst_percent: 18,
        unit: 'boxes',
        quantity: 1,
        rate: 0,
        available_stock: 0
      }
    ])
    setIsModalOpen(true)
  }

  // Handle item product change
  const handleItemProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === prodId)
    const updated = [...lineItems]

    if (prod) {
      const rawPrice = String(prod.price || prod.online_price || '').replace(/[^\d.]/g, '')
      const numRate = parseFloat(rawPrice) || 0
      const brand = (prod.brand || 'KAG').toUpperCase().trim()
      const isSan = (prod.category && prod.category.toUpperCase().includes('SANITARY')) || brand.includes('PUPA')
      const isAdh = (prod.category && prod.category.toUpperCase().includes('ADHESIVE')) || brand.includes('ROFF')
      const defaultHsn = isSan ? '69101000' : isAdh ? '32141000' : '69072300'

      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        product_name: prod.name,
        brand: prod.brand || 'KAG',
        size: prod.size || 'N/A',
        hsn_code: prod.hsn_code || defaultHsn,
        gst_percent: parseFloat(prod.gst_percent || prod.tax_percent) || 18,
        unit: prod.unit || (isSan ? 'pcs' : isAdh ? 'bags' : 'boxes'),
        rate: numRate,
        available_stock: parseFloat(prod.available != null ? prod.available : prod.stock) || 0
      }
    } else {
      updated[index] = {
        ...updated[index],
        product_id: '',
        product_name: '',
        rate: 0,
        available_stock: 0
      }
    }

    setLineItems(updated)
  }

  // Update item field
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  // Add Item Row
  const handleAddItemRow = () => {
    setLineItems([
      ...lineItems,
      {
        product_id: '',
        product_name: '',
        brand: 'KAG',
        size: '',
        hsn_code: '69072300',
        gst_percent: 18,
        unit: 'boxes',
        quantity: 1,
        rate: 0,
        available_stock: 0
      }
    ])
  }

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  // Calculate Totals & HSN Tax Summary for Form
  const formCalculations = useMemo(() => {
    let subtotalTaxable = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    let grandTotal = 0

    const hsnMap = {}

    lineItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0
      const rate = parseFloat(item.rate) || 0
      const taxable = qty * rate
      const gstPct = parseFloat(item.gst_percent) || 18

      let cgst = 0
      let sgst = 0
      let igst = 0

      if (invoiceForm.supply_type === 'INTRA_STATE') {
        cgst = taxable * ((gstPct / 2) / 100)
        sgst = taxable * ((gstPct / 2) / 100)
      } else {
        igst = taxable * (gstPct / 100)
      }

      const lineTotal = taxable + cgst + sgst + igst

      subtotalTaxable += taxable
      totalCgst += cgst
      totalSgst += sgst
      totalIgst += igst
      grandTotal += lineTotal

      const hsn = item.hsn_code || '69072300'
      if (!hsnMap[hsn]) {
        hsnMap[hsn] = { hsn, taxable: 0, taxRate: gstPct, cgst: 0, sgst: 0, igst: 0, totalTax: 0 }
      }
      hsnMap[hsn].taxable += taxable
      hsnMap[hsn].cgst += cgst
      hsnMap[hsn].sgst += sgst
      hsnMap[hsn].igst += igst
      hsnMap[hsn].totalTax += (cgst + sgst + igst)
    })

    const totalTax = totalCgst + totalSgst + totalIgst

    return {
      subtotalTaxable: Math.round(subtotalTaxable),
      totalCgst: Math.round(totalCgst),
      totalSgst: Math.round(totalSgst),
      totalIgst: Math.round(totalIgst),
      totalTax: Math.round(totalTax),
      grandTotal: Math.round(grandTotal),
      hsnSummary: Object.values(hsnMap)
    }
  }, [lineItems, invoiceForm.supply_type])

  // Save & Confirm GST Invoice
  const handleSaveInvoice = async (e) => {
    e.preventDefault()

    // Validate
    if (!invoiceForm.customer_name.trim()) {
      alert('Please enter a Customer Name.')
      return
    }

    for (let i = 0; i < lineItems.length; i++) {
      const it = lineItems[i]
      if (!it.product_name && !it.product_id) {
        alert(`Item #${i + 1}: Please select a product.`)
        return
      }
      if (parseFloat(it.quantity) <= 0) {
        alert(`Item #${i + 1}: Quantity must be greater than 0.`)
        return
      }
    }

    setSavingInvoice(true)
    try {
      const invoicePayload = {
        id: invoiceForm.id || `INV-${Date.now().toString().slice(-4)}`,
        customer_name: invoiceForm.customer_name,
        customer_phone: invoiceForm.customer_phone,
        customer_gstin: invoiceForm.customer_gstin,
        customer_address: invoiceForm.customer_address,
        date: invoiceForm.date,
        supply_type: invoiceForm.supply_type,
        items: lineItems.map(it => ({
          product_id: it.product_id,
          product_name: it.product_name,
          brand: it.brand,
          size: it.size,
          hsn_code: it.hsn_code,
          gst_percent: it.gst_percent,
          unit: it.unit,
          quantity: parseFloat(it.quantity),
          rate: parseFloat(it.rate),
          taxable_amount: Math.round(parseFloat(it.quantity) * parseFloat(it.rate)),
          tax_amount: Math.round((parseFloat(it.quantity) * parseFloat(it.rate)) * (parseFloat(it.gst_percent) / 100)),
          total_amount: Math.round((parseFloat(it.quantity) * parseFloat(it.rate)) * (1 + parseFloat(it.gst_percent) / 100))
        })),
        subtotal_taxable: formCalculations.subtotalTaxable,
        cgst_amount: formCalculations.totalCgst,
        sgst_amount: formCalculations.totalSgst,
        igst_amount: formCalculations.totalIgst,
        total_tax: formCalculations.totalTax,
        total_amount: formCalculations.grandTotal,
        payment_mode: invoiceForm.payment_mode,
        paid_amount: parseFloat(invoiceForm.paid_amount) || formCalculations.grandTotal,
        payment_status: (parseFloat(invoiceForm.paid_amount) || formCalculations.grandTotal) >= formCalculations.grandTotal ? 'Paid' : 'Partial',
        notes: invoiceForm.notes,
        hsn_breakdown: formCalculations.hsnSummary
      }

      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      })

      if (res.ok) {
        alert(`🎉 GST Invoice #${invoicePayload.id} generated successfully! Stock automatically reduced by billed quantity.`)
        setIsModalOpen(false)
        fetchData()
      } else {
        alert('Failed to save GST invoice.')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating invoice: ' + err.message)
    } finally {
      setSavingInvoice(false)
    }
  }

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        (inv.id || '').toLowerCase().includes(q) ||
        (inv.customer_name || '').toLowerCase().includes(q) ||
        (inv.customer_gstin || '').toLowerCase().includes(q) ||
        (inv.customer_phone || '').toLowerCase().includes(q)
      )
    })
  }, [invoices, searchQuery])

  // Summary Metrics of Invoices
  const invoiceMetrics = useMemo(() => {
    let totalSales = 0
    let totalTax = 0
    let paidTotal = 0
    invoices.forEach(inv => {
      totalSales += parseFloat(inv.total_amount || 0)
      totalTax += parseFloat(inv.total_tax || 0)
      paidTotal += parseFloat(inv.paid_amount || 0)
    })
    return {
      totalInvoices: invoices.length,
      totalSales: Math.round(totalSales),
      totalTax: Math.round(totalTax),
      balanceDue: Math.round(totalSales - paidTotal)
    }
  }, [invoices])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            GST Sales Billing & Invoices <Receipt className="h-6 w-6 text-blue-600" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate GST tax invoices, track HSN code tax segregation, and auto-reduce live inventory stock
          </p>
        </div>
        <button
          onClick={handleOpenNewInvoice}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Generate GST Invoice
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Sales Billed</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{invoiceMetrics.totalSales.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">{invoiceMetrics.totalInvoices} Invoices Generated</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs">
          <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Total GST Collected</span>
          <div className="text-2xl font-black text-purple-900 mt-2">
            ₹{invoiceMetrics.totalTax.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-purple-700 font-medium mt-1">Output GST (CGST + SGST / IGST)</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Stock Sync Engine</span>
          <div className="text-base font-extrabold text-emerald-900 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Auto Stock Reduction Active
          </div>
          <p className="text-xs text-emerald-700 mt-1">Products deducted live on invoice creation</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Balance Due</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ₹{invoiceMetrics.balanceDue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pending customer receivables</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search invoices by Invoice #, Customer name, GSTIN, or Phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Invoices List Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Loading sales invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No GST sales invoices found. Click "Generate GST Invoice" to bill items with auto stock reduction.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer & GSTIN</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Taxable (₹)</th>
                  <th className="px-5 py-3.5 text-purple-700">GST (₹)</th>
                  <th className="px-5 py-3.5 font-bold text-slate-900">Grand Total (₹)</th>
                  <th className="px-5 py-3.5 text-center">Payment</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-600">
                      {inv.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{inv.customer_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        GSTIN: {inv.customer_gstin || 'Unregistered / B2C'} {inv.customer_phone ? `· ${inv.customer_phone}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {fmtDate(inv.date)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {inv.items?.length || 0} items
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      ₹{parseFloat(inv.subtotal_taxable || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-purple-700">
                      ₹{parseFloat(inv.total_tax || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      ₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold inline-block",
                        inv.payment_status === 'Paid'
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}>
                        {inv.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-500" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE NEW GST SALE INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Generate New GST Sales Invoice
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products from inventory; stock will automatically reduce for billed quantities
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Customer & Invoice Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Builders or Walk-in"
                    value={invoiceForm.customer_name}
                    onChange={e => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Customer GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5 (Optional for B2C)"
                    value={invoiceForm.customer_gstin}
                    onChange={e => setInvoiceForm({ ...invoiceForm, customer_gstin: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={invoiceForm.customer_phone}
                    onChange={e => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.date}
                    onChange={e => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    GST Supply Type
                  </label>
                  <select
                    value={invoiceForm.supply_type}
                    onChange={e => setInvoiceForm({ ...invoiceForm, supply_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-purple-900 outline-none focus:border-blue-500"
                  >
                    <option value="INTRA_STATE">Intra-State (CGST 9% + SGST 9%)</option>
                    <option value="INTER_STATE">Inter-State (IGST 18%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={invoiceForm.payment_mode}
                    onChange={e => setInvoiceForm({ ...invoiceForm, payment_mode: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Credit / On Account">Credit / On Account (Partial)</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <PackageMinus className="h-4 w-4 text-emerald-600" />
                    Billed Products & Real-Time Stock Deduction
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Product
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Select Product</th>
                        <th className="px-3 py-2.5 text-center">HSN</th>
                        <th className="px-3 py-2.5 text-center text-emerald-700">In Stock</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-right">Selling Rate (₹)</th>
                        <th className="px-3 py-2.5 text-right">Taxable (₹)</th>
                        <th className="px-3 py-2.5 text-right text-purple-700">GST (₹)</th>
                        <th className="px-3 py-2.5 text-right">Total (₹)</th>
                        <th className="px-2 py-2.5 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item, idx) => {
                        const qty = parseFloat(item.quantity) || 0
                        const rate = parseFloat(item.rate) || 0
                        const taxable = Math.round(qty * rate)
                        const gstAmount = Math.round(taxable * ((parseFloat(item.gst_percent) || 18) / 100))
                        const total = taxable + gstAmount

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            {/* Product Selector */}
                            <td className="px-3 py-2 max-w-[240px]">
                              <select
                                value={item.product_id}
                                onChange={e => handleItemProductChange(idx, e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                required
                              >
                                <option value="">-- Select Product From Stock --</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    [{p.brand || 'KAG'}] {p.name} ({p.size || 'N/A'}) - Stock: {p.available != null ? p.available : p.stock} {p.unit || 'boxes'}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* HSN */}
                            <td className="px-3 py-2 text-center font-mono font-bold text-purple-700">
                              {item.hsn_code || '69072300'}
                            </td>

                            {/* Available Stock */}
                            <td className="px-3 py-2 text-center font-bold text-emerald-700">
                              {item.available_stock} {item.unit}
                            </td>

                            {/* Quantity */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={item.quantity}
                                onChange={e => handleItemFieldChange(idx, 'quantity', e.target.value)}
                                className="w-16 text-center rounded border border-slate-200 py-1 font-bold text-slate-800 outline-none focus:border-blue-500"
                                required
                              />
                            </td>

                            {/* Selling Rate */}
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.rate}
                                onChange={e => handleItemFieldChange(idx, 'rate', e.target.value)}
                                className="w-20 text-right rounded border border-slate-200 py-1 px-1 font-bold text-slate-800 outline-none focus:border-blue-500"
                                required
                              />
                            </td>

                            {/* Taxable */}
                            <td className="px-3 py-2 text-right font-medium">
                              ₹{taxable.toLocaleString('en-IN')}
                            </td>

                            {/* GST Amount */}
                            <td className="px-3 py-2 text-right font-bold text-purple-700">
                              ₹{gstAmount.toLocaleString('en-IN')}
                            </td>

                            {/* Total Line */}
                            <td className="px-3 py-2 text-right font-black text-slate-900">
                              ₹{total.toLocaleString('en-IN')}
                            </td>

                            {/* Remove */}
                            <td className="px-2 py-2 text-center">
                              {lineItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HSN Tax Segregation & Grand Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HSN Breakdown Box */}
                <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                    HSN Code Tax Segregation
                  </span>
                  <div className="space-y-1.5">
                    {formCalculations.hsnSummary.map(h => (
                      <div key={h.hsn} className="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-purple-100">
                        <div>
                          <strong className="text-purple-800 font-mono">HSN {h.hsn}</strong>
                          <span className="text-[10px] text-slate-400 block">Taxable: ₹{Math.round(h.taxable).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-purple-900">GST ({h.taxRate}%): ₹{Math.round(h.totalTax).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grand Totals Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Taxable Value:</span>
                    <span className="font-bold text-slate-800">₹{formCalculations.subtotalTaxable.toLocaleString('en-IN')}</span>
                  </div>
                  {invoiceForm.supply_type === 'INTRA_STATE' ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-700">CGST Amount:</span>
                        <span className="font-bold text-purple-800">₹{formCalculations.totalCgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-700">SGST Amount:</span>
                        <span className="font-bold text-purple-800">₹{formCalculations.totalSgst.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-700">IGST Amount:</span>
                      <span className="font-bold text-purple-800">₹{formCalculations.totalIgst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm font-black text-slate-900">
                    <span>Grand Total Bill:</span>
                    <span className="text-base text-blue-600">₹{formCalculations.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInvoice}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-md cursor-pointer disabled:bg-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {savingInvoice ? 'Deducting Stock & Saving...' : 'Generate Bill & Auto-Reduce Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Tax Invoice #{selectedInvoice.id}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto text-sm print:p-0">
              {/* Header Box */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900">AG TRADERS & SHOWROOM</h1>
                  <p className="text-xs text-slate-500 mt-1">Exclusive Tiles, Sanitaryware & Adhesives</p>
                  <p className="text-xs text-slate-500">GSTIN: 33AAFFA1234A1Z5 · State: Tamil Nadu (33)</p>
                </div>
                <div className="text-right">
                  <div className="inline-block rounded-lg bg-blue-50 px-3 py-1 font-mono text-xs font-black text-blue-700 border border-blue-200">
                    TAX INVOICE
                  </div>
                  <p className="font-bold text-slate-900 mt-2">Invoice #: {selectedInvoice.id}</p>
                  <p className="text-xs text-slate-500">Date: {fmtDate(selectedInvoice.date)}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To:</span>
                <p className="font-extrabold text-slate-900 mt-1">{selectedInvoice.customer_name}</p>
                <p className="text-xs text-slate-600">GSTIN: {selectedInvoice.customer_gstin || 'Unregistered B2C'}</p>
                {selectedInvoice.customer_phone && <p className="text-xs text-slate-600">Phone: {selectedInvoice.customer_phone}</p>}
                {selectedInvoice.customer_address && <p className="text-xs text-slate-600">{selectedInvoice.customer_address}</p>}
              </div>

              {/* Billed Items Table */}
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Rate (₹)</th>
                    <th className="p-2.5 text-right">Taxable (₹)</th>
                    <th className="p-2.5 text-right">GST (₹)</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedInvoice.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">
                        {it.product_name} <span className="text-slate-400 font-normal">({it.brand} {it.size})</span>
                      </td>
                      <td className="p-2.5 text-center font-mono">{it.hsn_code}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right">₹{parseFloat(it.rate || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right">₹{parseFloat(it.taxable_amount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right text-purple-700">₹{parseFloat(it.tax_amount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-black">₹{parseFloat(it.total_amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <span className="font-bold">₹{parseFloat(selectedInvoice.subtotal_taxable || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-purple-800">
                    <span>Total GST:</span>
                    <span className="font-bold">₹{parseFloat(selectedInvoice.total_tax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-blue-600">₹{parseFloat(selectedInvoice.total_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
