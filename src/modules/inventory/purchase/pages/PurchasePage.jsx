import { useState, useEffect, useRef } from 'react'
import { 
  UploadCloud, Check, X, FileText, Settings, ShieldAlert, Sparkles, Eye, Receipt, Calendar, Trash2, Mail, MessageSquare, Send, Download 
} from 'lucide-react'
import { cn, fmtDate } from '@/lib/utils'

// Levenshtein similarity metric for fuzzy matching
function getSimilarity(s1, s2) {
  let longer = s1.toLowerCase()
  let shorter = s2.toLowerCase()
  if (longer.length < shorter.length) {
    let temp = longer
    longer = shorter
    shorter = temp
  }
  let longerLength = longer.length
  if (longerLength === 0) return 1.0
  
  let costs = []
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else {
        if (j > 0) {
          let newValue = costs[j - 1]
          if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0) costs[shorter.length] = lastValue
  }
  return (longerLength - costs[shorter.length]) / parseFloat(longerLength)
}

function findBestMatch(item, productsList) {
  let bestProd = null
  let maxScore = 0
  
  const itemSizeNorm = item.size ? String(item.size).toLowerCase().replace(/\s+/g, '') : ''

  productsList.forEach(p => {
    if (itemSizeNorm && p.size) {
      const pSizeNorm = String(p.size).toLowerCase().replace(/\s+/g, '')
      if (itemSizeNorm !== pSizeNorm) {
        return // skip: sizes are different
      }
    }
    
    const score = Math.max(getSimilarity(item.product_name, p.name), getSimilarity(item.product_name, p.id))
    if (score > maxScore) {
      maxScore = score
      bestProd = p
    }
  })
  
  return maxScore >= 0.85 ? { product: bestProd, score: maxScore } : null
}

// Modal to View Full Invoice Details (Tax Invoice layout matching supplier layout)
function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null

  const cgstAmount = (parseFloat(invoice.gst_amount) || 0) / 2
  const sgstAmount = (parseFloat(invoice.gst_amount) || 0) / 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" /> Purchase Invoice Summary
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Stored Tax Invoice Records</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          <div className="text-center border-b border-dashed border-slate-200 pb-4">
            <h1 className="text-xl font-black text-slate-800 tracking-wider">TAX INVOICE</h1>
            <p className="text-xs text-slate-500 font-bold mt-1">Invoice Number: {invoice.invoice_no} · Date: {fmtDate(invoice.date)}</p>
          </div>

          {/* Supplier and Buyer details side by side */}
          <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-5">
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Seller Information</p>
              <p className="font-extrabold text-slate-800 text-sm">{invoice.supplier_name}</p>
              {invoice.supplier_gstin && <p><span className="font-bold text-slate-700">GSTIN:</span> {invoice.supplier_gstin}</p>}
              {invoice.supplier_phone && <p><span className="font-bold text-slate-700">Phone:</span> {invoice.supplier_phone}</p>}
            </div>
            
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Buyer Information</p>
              <p className="font-extrabold text-slate-800 text-sm">{invoice.buyer_name || 'AG TRADERS'}</p>
              {invoice.buyer_gstin && <p><span className="font-bold text-slate-700">GSTIN:</span> {invoice.buyer_gstin}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2 w-10 text-center">No</th>
                  <th className="px-4 py-2">Model Description</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Brand / Range</th>
                  <th className="px-4 py-2">HSN</th>
                  <th className="px-4 py-2 text-right">Qty (Boxes)</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoice.items && invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2 font-bold text-slate-800">{item.product_name}</td>
                    <td className="px-4 py-2 font-mono text-[11px]">{item.size || 'N/A'}</td>
                    <td className="px-4 py-2 text-slate-500">{item.brand || 'N/A'}</td>
                    <td className="px-4 py-2 font-mono text-slate-500">{item.hsn_code || '69072300'}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-800">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-slate-700">₹{parseFloat(item.rate).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-800">₹{parseFloat(item.amount || (item.quantity * item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="text-xs text-slate-500 space-y-1.5 self-end">
              <p className="font-bold text-slate-600">
                Invoice Declared Items (Sl. No.):{' '}
                <span className="text-slate-800">{invoice.total_items || invoice.items?.length || 0}</span>
              </p>
              <p className="font-bold text-slate-600">
                Extracted Products Count:{' '}
                <span className="text-slate-800">{invoice.items?.length || 0}</span>
                {parseInt(invoice.total_items || invoice.items?.length || 0) === (invoice.items?.length || 0) ? (
                  <span className="text-emerald-600 font-extrabold ml-1.5 inline-flex items-center gap-0.5">
                    <Check className="h-3 w-3 stroke-[3]" /> Matched
                  </span>
                ) : (
                  <span className="text-rose-500 font-extrabold ml-1.5 inline-flex items-center gap-0.5">
                    <ShieldAlert className="h-3 w-3" /> Mismatch
                  </span>
                )}
              </p>
              <p className="font-bold text-slate-600">
                Invoice Declared Boxes:{' '}
                <span className="text-slate-800">{invoice.total_qty || 0} boxes</span>
              </p>
              <p className="font-bold text-slate-600">
                Extracted Sum of Boxes:{' '}
                <span className="text-slate-800">
                  {(invoice.items || []).reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)} boxes
                </span>
                {parseInt(invoice.total_qty || 0) === (invoice.items || []).reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) ? (
                  <span className="text-emerald-600 font-extrabold ml-1.5 inline-flex items-center gap-0.5">
                    <Check className="h-3 w-3 stroke-[3]" /> Matched
                  </span>
                ) : (
                  <span className="text-rose-500 font-extrabold ml-1.5 inline-flex items-center gap-0.5">
                    <ShieldAlert className="h-3 w-3" /> Mismatch
                  </span>
                )}
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2.5 font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span className="text-slate-800">₹{parseFloat(invoice.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-500 pl-4">
                <span>CGST (9%):</span>
                <span>₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-500 pl-4">
                <span>SGST (9%):</span>
                <span>₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm text-slate-800 font-black">
                <span>Grand Total Net Amount:</span>
                <span className="text-blue-600">₹{parseFloat(invoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="rounded-lg bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors cursor-pointer">
            Close View
          </button>
        </div>
      </div>
    </div>
  )
}

function InvoiceImportModal({ isOpen, onClose, onRefresh, products }) {
  const [file, setFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [provider, setProvider] = useState(localStorage.getItem('gemini_provider') || 'google')
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [geminiModel, setGeminiModel] = useState(localStorage.getItem('gemini_model') || 'gemini-2.5-flash')
  const [mistralKey, setMistralKey] = useState(localStorage.getItem('mistral_api_key') || '')
  const [showKeyConfig, setShowKeyConfig] = useState(!localStorage.getItem('gemini_api_key') && !localStorage.getItem('mistral_api_key'))
  const [linkedItems, setLinkedItems] = useState([])
  const [error, setError] = useState('')
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setFile(null)
      setScanning(false)
      setScanResult(null)
      setDuplicateDismissed(false)
      setError('')
      setSaving(false)
    }
  }, [isOpen])

  const handleSaveKey = () => {
    localStorage.setItem('gemini_provider', provider)
    localStorage.setItem('gemini_api_key', geminiKey.trim())
    localStorage.setItem('gemini_model', geminiModel)
    localStorage.setItem('mistral_api_key', mistralKey.trim())
    setShowKeyConfig(false)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) uploadAndScan(selected)
  }

  const uploadAndScan = (fileToScan) => {
    const key = localStorage.getItem('gemini_api_key') || ''
    if (!key) {
      setError('Please configure your API Key in the settings block below before scanning.')
      return
    }

    setFile(fileToScan)
    setScanning(true)
    setScanResult(null)
    setError('')
    setDuplicateDismissed(false)

    const formData = new FormData()
    formData.append('invoice', fileToScan)

    const prov = localStorage.getItem('gemini_provider') || 'google'
    const gKey = localStorage.getItem('gemini_api_key') || ''
    const mKey = localStorage.getItem('mistral_api_key') || ''
    const gModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash'

    if (prov === 'google' && !gKey) {
      setError('Please configure your Gemini API Key in the settings block below before scanning.')
      return
    }
    if (prov === 'mistral' && !mKey) {
      setError('Please configure your Mistral API Key in the settings block below before scanning.')
      return
    }

    const headers = {
      'x-provider': prov
    }
    if (prov === 'google') {
      headers['x-gemini-key'] = gKey
      headers['x-gemini-model'] = gModel
    } else {
      headers['x-mistral-key'] = mKey
    }

    fetch('/api/upload-invoice', {
      method: 'POST',
      headers: headers,
      body: formData
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || 'Failed to scan invoice document.')
          })
        }
        return res.json()
      })
      .then(result => {
        setScanResult(result)
        const initialLinks = result.items.map(item => {
          const matchInfo = findBestMatch(item, products)
          return {
            product_name: item.product_name,
            brand: item.brand || '',
            hsn_code: item.hsn_code || '69072300',
            quantity: parseInt(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            amount: parseFloat(item.amount) || (parseInt(item.quantity) * parseFloat(item.rate)) || 0,
            size: item.size || '',
            finish: item.finish || '',
            selectedId: matchInfo ? matchInfo.product.id : 'NEW',
            matchScore: matchInfo ? matchInfo.score : 0
          }
        })
        setLinkedItems(initialLinks)
        setScanning(false)
      })
      .catch(err => {
        console.error('Scan error:', err)
        setError(err.message)
        setScanning(false)
      })
  }

  const handleLinkChange = (index, val) => {
    setLinkedItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selectedId: val }
      return updated
    })
  }

  const handleSaveInvoice = async () => {
    if (scanResult?.is_duplicate && !duplicateDismissed) {
      alert('Please acknowledge the duplicate invoice warning before committing.')
      return
    }

    setSaving(true)
    try {
      const invoiceLog = {
        invoice_no: scanResult.invoice_no,
        date: scanResult.date || new Date().toISOString().split('T')[0],
        supplier_name: scanResult.supplier_name,
        supplier_gstin: scanResult.supplier_gstin,
        supplier_phone: scanResult.supplier_phone,
        buyer_name: scanResult.buyer_name,
        buyer_gstin: scanResult.buyer_gstin,
        total_qty: scanResult.total_qty,
        gross_amount: scanResult.gross_amount,
        tax_percent: scanResult.tax_percent,
        gst_amount: scanResult.gst_amount,
        total_amount: scanResult.total_amount,
        total_items: scanResult.total_items,
        stock_status: 'pending',
        items: linkedItems.map(item => ({
          product_name: item.product_name,
          size: item.size,
          finish: item.finish,
          brand: item.brand,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          selectedId: item.selectedId,
          matchScore: item.matchScore
        }))
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceLog)
      })

      if (!res.ok) {
        throw new Error('Failed to save invoice reference.')
      }

      alert('🎉 Invoice imported and saved successfully!')
      onRefresh()
      onClose()
    } catch (err) {
      console.error('Error saving invoice:', err)
      alert('Failed to save invoice: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-500" /> Import Purchase Invoice
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Gemini AI automatically scans and increases stock counts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              title="Gemini Key Config"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showKeyConfig && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-blue-800">AI Scanner Configuration (Custom Keys)</p>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  Select your provider and input your API key to scan invoices.
                </p>
              </div>

              <div className="flex gap-4 items-center">
                <span className="text-xs font-bold text-slate-600">API Provider:</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    value="google"
                    checked={provider === 'google'}
                    onChange={() => setProvider('google')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  Google Gemini
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    value="mistral"
                    checked={provider === 'mistral'}
                    onChange={() => setProvider('mistral')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  Mistral AI (Alternative)
                </label>
              </div>

              {provider === 'google' ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Paste your Gemini API Key here..."
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                  />
                  <select
                    value={geminiModel}
                    onChange={e => setGeminiModel(e.target.value)}
                    className="rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 font-semibold"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Free/Fast)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</option>
                  </select>
                  <button
                    onClick={handleSaveKey}
                    disabled={!geminiKey.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Paste your Mistral API Key here..."
                    value={mistralKey}
                    onChange={e => setMistralKey(e.target.value)}
                    className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={!mistralKey.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs font-semibold text-red-600 flex items-start gap-2">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!file && !scanning && (
            <div
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-blue-50/10 cursor-pointer transition-all space-y-3"
            >
              <UploadCloud className="h-10 w-10 text-slate-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-700">Select Supplier Invoice file</p>
                <p className="text-xs text-slate-400 mt-1">Accepts invoice PDF documents or image photos (.png, .jpg, .jpeg)</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf,image/*"
                className="hidden"
              />
            </div>
          )}

          {scanning && (
            <div className="py-16 text-center space-y-4">
              <div className="relative h-14 w-14 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <FileText className="absolute inset-0 m-auto h-6 w-6 text-blue-500 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-700 flex items-center justify-center gap-1">
                  Gemini AI Scanning Document... <Sparkles className="h-4 w-4 text-blue-500 animate-bounce" />
                </p>
                <p className="text-xs text-slate-400 mt-1">Reading purchase items, quantities, tax levels, and company details</p>
              </div>
            </div>
          )}

          {file && !scanning && scanResult && (
            <div className="space-y-5">
              {scanResult.is_duplicate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">Duplicate Invoice Found!</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Invoice <strong>{scanResult.invoice_no}</strong> from supplier <strong>{scanResult.supplier_name}</strong> has already been imported.
                        Double-check quantities to prevent double stock updates.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={duplicateDismissed}
                      onChange={e => setDuplicateDismissed(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-200 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-bold text-amber-800">I acknowledge this warning and want to proceed anyway</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-600">
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Supplier &amp; Bill</p>
                  <p><span className="font-bold text-slate-800">Seller:</span> {scanResult.supplier_name || 'N/A'}</p>
                  {scanResult.supplier_gstin && <p><span className="font-bold text-slate-800">GSTIN:</span> {scanResult.supplier_gstin}</p>}
                  <p><span className="font-bold text-slate-800">Invoice No:</span> {scanResult.invoice_no || 'N/A'} · <span className="font-bold text-slate-800">Date:</span> {scanResult.date ? fmtDate(scanResult.date) : 'N/A'}</p>
                  <p>
                    <span className="font-bold text-slate-800">Total Items (Sl. No.):</span> {scanResult.total_items || 0} items 
                    {parseInt(scanResult.total_items || 0) === linkedItems.length ? (
                      <span className="text-emerald-600 font-bold ml-1.5 inline-flex items-center gap-0.5" title="Matches count of extracted products">
                        <Check className="h-3 w-3 stroke-[3]" /> Matches Extracted
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold ml-1.5 inline-flex items-center gap-0.5" title={`Mismatch: extracted ${linkedItems.length} item rows`}>
                        <ShieldAlert className="h-3 w-3" /> Mismatch (Extracted: {linkedItems.length})
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Total Boxes:</span> {scanResult.total_qty || 0} boxes 
                    {parseInt(scanResult.total_qty || 0) === linkedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) ? (
                      <span className="text-emerald-600 font-bold ml-1.5 inline-flex items-center gap-0.5" title="Matches sum of extracted quantities">
                        <Check className="h-3 w-3 stroke-[3]" /> Matches Extracted
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold ml-1.5 inline-flex items-center gap-0.5" title={`Mismatch: sum of extracted items is ${linkedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)} boxes`}>
                        <ShieldAlert className="h-3 w-3" /> Mismatch (Extracted: {linkedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Bill Financials</p>
                  <p><span className="font-bold text-slate-800">Gross Subtotal:</span> ₹{parseFloat(scanResult.gross_amount || 0).toLocaleString('en-IN')}</p>
                  <p><span className="font-bold text-slate-800">GST amount ({parseFloat(scanResult.tax_percent || 0)}%):</span> ₹{parseFloat(scanResult.gst_amount || 0).toLocaleString('en-IN')}</p>
                  <p><span className="font-bold text-slate-800">Net Payable:</span> ₹{parseFloat(scanResult.total_amount || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verify &amp; Link Items to Stock</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Invoice Item Description</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Invoice Qty</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Link Stock Matching (SKU)</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {linkedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block text-xs">{item.product_name}</span>
                            <span className="text-[10px] text-slate-400">
                              Size: {item.size || 'N/A'} · Brand/Range: {item.brand || 'N/A'} · HSN: {item.hsn_code}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700 text-xs">
                            {item.quantity} boxes
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.selectedId}
                              onChange={e => handleLinkChange(idx, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400 max-w-[280px] w-full font-medium"
                            >
                              <option value="NEW">➕ Create as New Product Variant</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  [{p.id}] {p.name} ({p.size || 'No Size'})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {item.selectedId === 'NEW' ? (
                              <span className="rounded bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5">
                                New Item
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5" title={`Fuzzy match score: ${Math.round(item.matchScore * 100)}%`}>
                                Matched ({Math.round(item.matchScore * 100)}%)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-between items-center flex-shrink-0">
          <div>
            {file && !scanning && scanResult && (
              <button
                onClick={() => { setFile(null); setScanResult(null); }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear File &amp; Start Over
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
              Cancel
            </button>
            {file && !scanning && scanResult && (
              <button
                onClick={handleSaveInvoice}
                disabled={saving || (scanResult.is_duplicate && !duplicateDismissed)}
                className={cn(
                  'rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm cursor-pointer',
                  (saving || (scanResult.is_duplicate && !duplicateDismissed))
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
                )}
              >
                {saving ? 'Saving...' : 'Confirm & Save Invoice'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// Smart matching function to link invoice items to category classifications
function findBestCategoryMatch(item, categories) {
  if (!categories || categories.length === 0) return '';
  
  const sizeText = (item.size || '').toLowerCase();
  const nameText = (item.product_name || '').toLowerCase();
  const fullText = `${nameText} ${sizeText}`;
  
  // Extract number dimensions (e.g. 48, 24)
  const sizeNumbers = sizeText.match(/\d+/g) || [];
  
  let bestCatId = '';
  let highestScore = -1;
  
  for (const c of categories) {
    let score = 0;
    const catSize = (c.size || '').toLowerCase();
    const catName = (c.name || '').toLowerCase();
    
    // Check base size numbers compatibility
    const catNumbers = catSize.match(/\d+/g) || [];
    if (sizeNumbers.length >= 2 && catNumbers.length >= 2) {
      const match1 = sizeNumbers[0] === catNumbers[0] && sizeNumbers[1] === catNumbers[1];
      const match2 = sizeNumbers[0] === catNumbers[1] && sizeNumbers[1] === catNumbers[0];
      if (match1 || match2) {
        score += 50; // Base match score
      } else {
        continue; // Size numbers mismatch
      }
    } else {
      const itemSizeClean = sizeText.replace(/[^0-9]/g, '');
      const catSizeClean = catSize.replace(/[^0-9]/g, '');
      if (itemSizeClean && catSizeClean && (itemSizeClean.includes(catSizeClean) || catSizeClean.includes(itemSizeClean))) {
        score += 30;
      } else {
        continue;
      }
    }
    
    // Check type constraints (Wall / Floor)
    if (c.type === 'WALL' && fullText.includes('wall')) score += 20;
    if (c.type === 'FLOOR' && (fullText.includes('floor') || fullText.includes('parking'))) score += 20;
    
    // Body type (FULL BODY)
    const isFullBodyItem = fullText.includes('full body') || fullText.includes('fullbody') || fullText.includes('12mm') || nameText.includes('fb');
    const isFullBodyCat = catSize.includes('full body') || catName.includes('full body') || catName.includes('12mm');
    if (isFullBodyItem === isFullBodyCat) {
      score += 30;
    } else {
      score -= 30;
    }
    
    // Double Charge (DC)
    const isDCItem = fullText.includes('double charge') || fullText.includes('doublecharge') || fullText.includes('dc') || fullText.includes('riva') || fullText.includes('amazon');
    const isDCCat = catSize.includes('double charge') || catName.includes('double charge') || catName.includes('riva') || catName.includes('amazon');
    if (isDCItem === isDCCat) {
      score += 30;
    } else {
      score -= 30;
    }
    
    // High Glossy / HG / Carving
    const isHGItem = fullText.includes('hg') || fullText.includes('high glossy') || fullText.includes('highglossy') || fullText.includes('carving') || fullText.includes('glossy');
    const isHGCat = catName.includes('high glossy') || catName.includes('hg') || catName.includes('carving') || catName.includes('glossy');
    if (isHGItem === isHGCat) {
      score += 20;
    }
    
    // GVT / PGVT
    const isGVTItem = fullText.includes('gvt') || fullText.includes('pgvt');
    const isGVTCat = catSize.includes('gvt') || catName.includes('gvt') || catName.includes('pgvt');
    if (isGVTItem === isGVTCat) {
      score += 15;
    }
    
    // Elevation matching
    const hasEleWord = fullText.split(/[\s,.*+-]+/).includes('ele') || fullText.split(/[\s,.*+-]+/).includes('hd') || fullText.includes('elevation') || fullText.includes('glitter') || fullText.includes('high depth') || fullText.includes('highdepth');
    const isElevationCat = catName.includes('elevation') || catName.includes('glitter');
    
    if (hasEleWord) {
      if (isElevationCat) {
        score += 40;
      } else {
        score -= 30;
      }
      
      const hasHighDepth = fullText.includes('high depth') || fullText.includes('highdepth') || fullText.includes('hd');
      const catIsHighDepth = catName.includes('high depth');
      if (hasHighDepth) {
        if (catIsHighDepth) {
          score += 40;
        } else {
          score -= 30;
        }
      } else {
        if (catIsHighDepth) {
          score -= 30;
        }
      }
      
      const hasSol = fullText.includes('sol');
      const catIsSol = catName.includes('sol body');
      if (hasSol) {
        if (catIsSol) {
          score += 40;
        } else {
          score -= 30;
        }
      } else {
        if (catIsSol) {
          score -= 30;
        }
      }
    } else {
      if (isElevationCat) {
        score -= 30;
      }
    }
    
    // Poster matching
    if (fullText.includes('poster') && catName.includes('poster')) {
      score += 25;
    }
    
    // Waterproof vs Semi Waterproof distinction
    const hasSemiWord = fullText.includes('semi') || fullText.includes('swp');
    const hasWPWord = fullText.includes('wp') || fullText.includes('waterproof') || fullText.includes('water proof');
    
    const catIsSemi = catName.includes('semi') || catName.includes('swp');
    const catIsWP = catName.includes('waterproof') || catName.includes('water proof') || catName.includes('wp');
    const catIsOnlyWP = catIsWP && !catIsSemi;
    
    if (hasSemiWord) {
      if (catIsSemi) {
        score += 40;
      } else if (catIsOnlyWP) {
        score -= 40;
      }
    } else if (hasWPWord) {
      if (catIsOnlyWP) {
        score += 40;
      } else if (catIsSemi) {
        score -= 40;
      }
    }
    
    // Parking / Park matching
    const isParkingItem = fullText.includes('parking') || fullText.includes('park');
    const isParkingCat = catName.includes('parking');
    if (isParkingItem) {
      if (isParkingCat) {
        score += 40;
      } else {
        score -= 40;
      }
      if (c.type === 'FLOOR') {
        score += 20;
      } else {
        score -= 30;
      }
    }
    
    // Roofing matching
    const isRoofingItem = fullText.includes('roof') || fullText.includes('roofing');
    const isRoofingCat = catName.includes('roofing');
    if (isRoofingItem) {
      if (isRoofingCat) {
        score += 20;
      }
      
      const hasVit = fullText.includes('vit') || fullText.includes('vitrified');
      const catIsVit = catName.includes('vitrified');
      if (hasVit) {
        if (catIsVit) {
          score += 40;
        } else {
          score -= 30;
        }
      } else {
        if (catIsVit) {
          score -= 30;
        }
      }
      
      const hasJumbo = fullText.includes('jumbo');
      const catIsJumbo = catName.includes('jumbo');
      if (hasJumbo) {
        if (catIsJumbo) {
          score += 40;
        } else {
          score -= 30;
        }
      } else {
        if (catIsJumbo) {
          score -= 30;
        }
      }
      
      const hasHeavy = fullText.includes('heavy') || fullText.includes('hv');
      const catIsHeavy = catName.includes('heavy');
      if (hasHeavy) {
        if (catIsHeavy) {
          score += 40;
        } else {
          score -= 30;
        }
      } else {
        if (catIsHeavy) {
          score -= 30;
        }
      }
      
      const hasSparkle = fullText.includes('sparkle');
      const catIsSparkle = catName.includes('sparkle');
      if (hasSparkle) {
        if (catIsSparkle) {
          score += 40;
        } else {
          score -= 30;
        }
      }
    }
    
    // Substring word similarity match
    const words = nameText.split(/[\s,.*+-]+/);
    for (const word of words) {
      if (word.length > 2 && catName.includes(word)) {
        score += 10;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestCatId = c.id;
    }
  }
  
  return bestCatId;
}

// Modal to Approve Stock counts and choose SKU mappings
function ApproveStockModal({ isOpen, invoice, onClose, onRefresh, products }) {
  const [saving, setSaving] = useState(false)
  const [linkedItems, setLinkedItems] = useState([])
  const [categories, setCategories] = useState([])

  // Load categories
  useEffect(() => {
    if (isOpen) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(err => console.error("Error loading categories:", err))
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && invoice && categories.length > 0) {
      const initialLinks = (invoice.items || []).map(item => {
        const matchedCatId = findBestCategoryMatch(item, categories)

        return {
          product_name: item.product_name,
          brand: item.brand || '',
          hsn_code: item.hsn_code || '69072300',
          quantity: parseInt(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || (parseInt(item.quantity) * parseFloat(item.rate)) || 0,
          size: item.size || '',
          finish: item.finish || '',
          selectedId: item.selectedId || 'NEW',
          category_id: matchedCatId,
          matchScore: item.matchScore || 0
        }
      })
      setLinkedItems(initialLinks)
    } else if (isOpen && invoice) {
      const initialLinks = (invoice.items || []).map(item => ({
        product_name: item.product_name,
        brand: item.brand || '',
        hsn_code: item.hsn_code || '69072300',
        quantity: parseInt(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || (parseInt(item.quantity) * parseFloat(item.rate)) || 0,
        size: item.size || '',
        finish: item.finish || '',
        selectedId: item.selectedId || 'NEW',
        category_id: '',
        matchScore: item.matchScore || 0
      }))
      setLinkedItems(initialLinks)
    }
  }, [isOpen, invoice, categories])

  const handleLinkChange = (index, val) => {
    setLinkedItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selectedId: val }
      return updated
    })
  }

  const handleCategoryChange = (index, val) => {
    setLinkedItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], category_id: val }
      return updated
    })
  }

  const handleApprove = async () => {
    // Enforce that all items created as NEW variants must have a category classification mapped
    for (const item of linkedItems) {
      if (item.selectedId === 'NEW' && !item.category_id) {
        alert(`Mapping required: Please select a price category classification for product variant "${item.product_name}" (${item.size || 'N/A'}) before approving stock.`)
        return
      }
    }

    setSaving(true)
    try {
      for (const item of linkedItems) {
        if (item.selectedId === 'SKIP') {
          continue
        }
        if (item.selectedId === 'NEW') {
          const newProd = {
            name: item.product_name,
            brand: item.brand || invoice.supplier_name || 'KAG',
            category_id: item.category_id || '',
            size: item.size || 'N/A',
            finish: item.finish || 'Matte',
            price: (item.category_id && item.category_id !== 'NO_CAT') ? '' : `₹${Math.round(item.rate * 1.35)}/sqft`,
            stock: item.quantity,
            reserved: 0,
            available: item.quantity,
            min: 20,
            unit: 'boxes'
          }
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProd)
          })
        } else {
          const prod = products.find(p => p.id === item.selectedId)
          if (prod) {
            const updated = {
              ...prod,
              stock: (prod.stock || 0) + item.quantity,
              available: ((prod.stock || 0) + item.quantity) - (prod.reserved || 0)
            }
            await fetch(`/api/products/${prod.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated)
            })
          }
        }
      }

      const updatedInvoice = {
        stock_status: 'updated',
        items: linkedItems.map(item => ({
          product_name: item.product_name,
          size: item.size,
          finish: item.finish,
          brand: item.brand,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          selectedId: item.selectedId,
          category_id: item.category_id,
          matchScore: item.matchScore
        }))
      }

      const res = await fetch(`/api/invoices/${encodeURIComponent(invoice.invoice_no)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInvoice)
      })

      if (!res.ok) {
        throw new Error('Failed to update invoice status on backend.')
      }

      alert('🎉 Stock inventory updated and invoice approved successfully!')
      onRefresh()
      onClose()
    } catch (err) {
      console.error('Error approving stock:', err)
      alert('Failed to approve stock update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSkipInvoice = async () => {
    if (!window.confirm("Are you sure you want to mark this invoice as a Non-Stock Bill? No products in this invoice will be added to the stock inventory.")) {
      return
    }
    setSaving(true)
    try {
      const updatedInvoice = {
        stock_status: 'skipped'
      }

      const res = await fetch(`/api/invoices/${encodeURIComponent(invoice.invoice_no)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInvoice)
      })

      if (!res.ok) {
        throw new Error('Failed to skip invoice stock update on backend.')
      }

      alert('✓ Invoice marked as Non-Stock Bill (Stock update skipped).')
      onRefresh()
      onClose()
    } catch (err) {
      console.error('Error skipping stock update:', err)
      alert('Failed to skip stock update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Check className="h-5 w-5 text-blue-500" /> Approve Stock for Bill #{invoice.invoice_no}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Link items to showrooms inventory database and confirm quantities</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-600 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Bill Reference</p>
              <p><span className="font-bold text-slate-800">Supplier:</span> {invoice.supplier_name}</p>
              <p><span className="font-bold text-slate-800">GSTIN:</span> {invoice.supplier_gstin || 'N/A'}</p>
              <p><span className="font-bold text-slate-800">Invoice No:</span> {invoice.invoice_no} · <span className="font-bold text-slate-800">Date:</span> {fmtDate(invoice.date)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Bill Totals</p>
              <p><span className="font-bold text-slate-800">Total Declared Items:</span> {invoice.total_items || invoice.items?.length || 0} items</p>
              <p><span className="font-bold text-slate-800">Total Boxes:</span> {invoice.total_qty || 0} boxes</p>
              <p><span className="font-bold text-slate-800">Net Total Bill:</span> ₹{parseFloat(invoice.total_amount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verify and Map Products to Showroom Inventory</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Invoice Item Description</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Quantity</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Link Stock Matching (SKU)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {linkedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block text-xs">{item.product_name}</span>
                        <span className="text-[10px] text-slate-400">
                          Size: {item.size || 'N/A'} · Brand: {item.brand || 'N/A'} · HSN: {item.hsn_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 text-xs">
                        {item.quantity} boxes
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.selectedId}
                          onChange={e => handleLinkChange(idx, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400 max-w-[280px] w-full font-medium"
                        >
                          <option value="NEW">➕ Create as New Product Variant</option>
                          <option value="SKIP">⚠️ SKIP (Don't update stock for this item)</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.id}] {p.name} ({p.size || 'No Size'})
                            </option>
                          ))}
                        </select>

                        {item.selectedId === 'NEW' && (
                          <div className="mt-2 max-w-[280px]">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Map to Price List Category:</p>
                            <select
                              value={item.category_id || ''}
                              onChange={e => handleCategoryChange(idx, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 outline-none focus:border-blue-400 focus:bg-white transition font-medium"
                            >
                              <option value="">⚠️ Select Category Classification (MANDATORY) --</option>
                              <option value="NO_CAT">🚫 No Category (Unclassified)</option>
                              <optgroup label="WALL CLASSIFICATIONS">
                                {categories.filter(c => c.type === 'WALL').map(c => (
                                  <option key={c.id} value={c.id}>[{c.size}] {c.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="FLOOR CLASSIFICATIONS">
                                {categories.filter(c => c.type === 'FLOOR').map(c => (
                                  <option key={c.id} value={c.id}>[{c.size}] {c.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.selectedId === 'NEW' ? (
                          <span className="rounded bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5">
                            Create SKU
                          </span>
                        ) : item.selectedId === 'SKIP' ? (
                          <span className="rounded bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5">
                            Skip (Expense)
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5">
                            Link Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <button
              onClick={handleSkipInvoice}
              disabled={saving}
              className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Mark as Non-Stock Bill (Skip)
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={saving}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm cursor-pointer disabled:bg-slate-300"
            >
              {saving ? 'Approving...' : 'Approve & Update Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuditorSummaryModal({ isOpen, onClose, filteredInvoices, selectedMonthName, taxableTotal, cgstTotal, sgstTotal, igstTotal, grandTotal }) {
  const [email, setEmail] = useState(localStorage.getItem('auditor_email') || '')
  const [phone, setPhone] = useState(localStorage.getItem('auditor_phone') || '')

  if (!isOpen) return null

  const totalGst = cgstTotal + sgstTotal + igstTotal
  
  const reportBody = `Dear Auditor,

Please find the GST Tax Summary of Purchase Invoices for the period of ${selectedMonthName}:

Total Invoices: ${filteredInvoices.length}
----------------------------------------------
Total Taxable Value (Gross): ₹${taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
CGST Amount (Central Tax):  ₹${cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
SGST Amount (State Tax):    ₹${sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
IGST Amount (Integrated):   ₹${igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
----------------------------------------------
Total GST Tax Value:        ₹${totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Grand Total Invoice Value:  ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please download the detailed CSV file sent separately for complete line item details.

Thank you.`

  const handleSaveContact = () => {
    localStorage.setItem('auditor_email', email)
    localStorage.setItem('auditor_phone', phone)
    alert('Auditor details saved successfully!')
  }

  const sendEmail = () => {
    localStorage.setItem('auditor_email', email)
    const subject = encodeURIComponent(`Purchase Invoice GST Summary - ${selectedMonthName}`)
    const body = encodeURIComponent(reportBody)
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')
  }

  const sendWhatsApp = () => {
    localStorage.setItem('auditor_phone', phone)
    // Clean phone number: remove spaces, dashes, prepend 91 if length is 10
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone
    const text = encodeURIComponent(reportBody)
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="flex h-full max-h-[600px] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Send className="h-4.5 w-4.5 text-blue-600" /> Share Summary with Auditor
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Quickly dispatch GST purchase summary report</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Auditor Email Address</label>
              <input
                type="email"
                placeholder="auditor@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Auditor WhatsApp/Mobile</label>
              <input
                type="text"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                onClick={handleSaveContact}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Save Contact Info
              </button>
            </div>
          </div>

          {/* Preview Message */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Message Preview</label>
            <pre className="w-full bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {reportBody}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={sendWhatsApp}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" /> Share on WhatsApp
            </button>
            <button
              onClick={sendEmail}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
            >
              <Mail className="h-4 w-4" /> Send via Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PurchasePage() {
  const [products, setProducts] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [approveInvoice, setApproveInvoice] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [auditorModalOpen, setAuditorModalOpen] = useState(false)

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
      })
      .catch(err => {
        console.error("Error loading products:", err)
      })
  }

  const fetchInvoices = () => {
    setLoading(true)
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data.reverse())
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading invoices:", err)
        setLoading(false)
      })
  }

  // Calculate dynamic list of months present in imported invoices
  const uniqueMonths = Array.from(
    new Set(
      invoices
        .map(inv => (inv.date ? inv.date.substring(0, 7) : null))
        .filter(Boolean)
    )
  ).sort().reverse();

  // Get current and last month string formats
  const today = new Date();
  const thisMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const lmYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const lmMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const lastMonthStr = lmYear + '-' + String(lmMonth).padStart(2, '0');

  // Filter invoices list
  const filteredInvoices = invoices.filter(inv => {
    if (selectedMonth === 'ALL') return true;
    const invMonth = inv.date ? inv.date.substring(0, 7) : '';
    if (selectedMonth === 'THIS_MONTH') return invMonth === thisMonthStr;
    if (selectedMonth === 'LAST_MONTH') return invMonth === lastMonthStr;
    return invMonth === selectedMonth;
  });

  // Calculate overall tax totals for currently filtered list
  let taxableTotal = 0;
  let gstTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let grandTotal = 0;

  filteredInvoices.forEach(inv => {
    const gross = parseFloat(inv.gross_amount || 0);
    const gst = parseFloat(inv.gst_amount || 0);
    const total = parseFloat(inv.total_amount || 0);

    taxableTotal += gross;
    gstTotal += gst;
    grandTotal += total;

    const sGSTIN = String(inv.supplier_gstin || '').trim();
    const bGSTIN = String(inv.buyer_gstin || '').trim();
    if (sGSTIN && bGSTIN && sGSTIN.substring(0, 2) === bGSTIN.substring(0, 2)) {
      cgstTotal += gst / 2;
      sgstTotal += gst / 2;
    } else if (sGSTIN && bGSTIN) {
      igstTotal += gst;
    } else {
      cgstTotal += gst / 2;
      sgstTotal += gst / 2;
    }
  });

  const getMonthName = (mStr) => {
    if (mStr === 'ALL') return 'All Time';
    if (mStr === 'THIS_MONTH') return 'This Month (' + formatMonthLabel(thisMonthStr) + ')';
    if (mStr === 'LAST_MONTH') return 'Last Month (' + formatMonthLabel(lastMonthStr) + ')';
    return formatMonthLabel(mStr);
  };

  const formatMonthLabel = (mStr) => {
    if (!mStr) return '';
    const [yr, mn] = mStr.split('-');
    const d = new Date(parseInt(yr), parseInt(mn) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const exportToAuditorCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('No invoices to export for the selected filter.');
      return;
    }
    
    const headers = [
      "S.No",
      "Invoice No",
      "Invoice Date",
      "Supplier Name",
      "Supplier GSTIN",
      "Taxable Value (Gross)",
      "GST Rate (%)",
      "CGST",
      "SGST",
      "IGST",
      "Total Invoice Value"
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      const gross = parseFloat(inv.gross_amount || 0);
      const gst = parseFloat(inv.gst_amount || 0);
      const total = parseFloat(inv.total_amount || 0);
      const rate = parseFloat(inv.tax_percent || 0);

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      const sGSTIN = String(inv.supplier_gstin || '').trim();
      const bGSTIN = String(inv.buyer_gstin || '').trim();
      if (sGSTIN && bGSTIN && sGSTIN.substring(0, 2) === bGSTIN.substring(0, 2)) {
        cgst = gst / 2;
        sgst = gst / 2;
      } else if (sGSTIN && bGSTIN) {
        igst = gst;
      } else {
        cgst = gst / 2;
        sgst = gst / 2;
      }

      return [
        idx + 1,
        `"${inv.invoice_no}"`,
        inv.date,
        `"${inv.supplier_name}"`,
        `"${inv.supplier_gstin || ''}"`,
        gross.toFixed(2),
        rate,
        cgst.toFixed(2),
        sgst.toFixed(2),
        igst.toFixed(2),
        total.toFixed(2)
      ];
    });

    const totalRow = [
      "TOTAL",
      "",
      "",
      "",
      "",
      taxableTotal.toFixed(2),
      "",
      cgstTotal.toFixed(2),
      sgstTotal.toFixed(2),
      igstTotal.toFixed(2),
      grandTotal.toFixed(2)
    ];
    rows.push(totalRow);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const monthLabel = selectedMonth === 'ALL' ? 'all' 
                     : selectedMonth === 'THIS_MONTH' ? 'this-month'
                     : selectedMonth === 'LAST_MONTH' ? 'last-month'
                     : selectedMonth;
    link.setAttribute("download", `gst_purchase_report_${monthLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteInvoice = async (invoiceNo) => {
    if (!window.confirm(`Are you sure you want to delete invoice #${invoiceNo}? This action cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceNo)}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        throw new Error('Failed to delete invoice.')
      }
      alert(`Invoice #${invoiceNo} deleted successfully.`)
      fetchInvoices()
    } catch (err) {
      console.error('Error deleting invoice:', err)
      alert('Failed to delete invoice: ' + err.message)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchInvoices()
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Purchase Invoices <Receipt className="h-5 w-5 text-blue-500" />
          </h1>
          <p className="text-sm text-slate-500">Scan incoming supplier invoices and view import history</p>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" /> Import Invoice
        </button>
      </div>

      {/* Filters and Auditor Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Month Selector Column */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Filter Invoices by Period</label>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMonth('ALL')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedMonth === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  All Invoices
                </button>
                <button
                  onClick={() => setSelectedMonth('THIS_MONTH')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedMonth === 'THIS_MONTH' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setSelectedMonth('LAST_MONTH')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedMonth === 'LAST_MONTH' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  Last Month
                </button>
              </div>
              
              {uniqueMonths.length > 0 && (
                <select
                  value={uniqueMonths.includes(selectedMonth) ? selectedMonth : 'ALL'}
                  onChange={e => {
                    if (e.target.value !== 'ALL') {
                      setSelectedMonth(e.target.value)
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="ALL">Choose Month...</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            Showing <strong className="text-slate-700">{filteredInvoices.length}</strong> of {invoices.length} imported purchase bills
          </div>
        </div>

        {/* GST Tax Summary Box */}
        <div className="md:col-span-2 bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Subtle grid background decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 font-mono text-7xl font-bold select-none pointer-events-none">GST</div>
          
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">GST Report Summary — {getMonthName(selectedMonth)}</span>
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">Tax Details</span>
            </div>
            
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Taxable Gross</span>
                <p className="text-sm font-extrabold text-slate-100 font-mono">₹{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium">CGST (Central)</span>
                <p className="text-sm font-extrabold text-slate-100 font-mono">₹{cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium">SGST (State)</span>
                <p className="text-sm font-extrabold text-slate-100 font-mono">₹{sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium">IGST (Interstate)</span>
                <p className="text-sm font-extrabold text-slate-100 font-mono">₹{igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-blue-400 font-bold">Total GST</span>
                <p className="text-sm font-extrabold text-blue-400 font-mono">₹{(cgstTotal + sgstTotal + igstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Total Bill value:</span>
              <strong className="text-sm font-extrabold text-blue-400 font-mono">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToAuditorCSV}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer"
                title="Download CSV report for GST filing"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                onClick={() => setAuditorModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
                title="Send detailed figures directly to auditor"
              >
                <Send className="h-3.5 w-3.5" /> Send to Auditor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Loading invoices history...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No invoices found for the selected month.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Invoice No','Invoice Date','Supplier Company','GSTIN','Total Boxes','Net Total Bill','Stock Update',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{inv.invoice_no}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-semibold">{fmtDate(inv.date)}</td>
                  <td className="px-5 py-3.5 text-slate-800 font-bold">{inv.supplier_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{inv.supplier_gstin || 'N/A'}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-700">{inv.total_qty} boxes</td>
                  <td className="px-5 py-3.5 font-bold text-blue-600">
                    ₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5">
                    {inv.stock_status === 'updated' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                        <Check className="h-3 w-3 stroke-[3]" /> Approved
                      </span>
                    ) : inv.stock_status === 'skipped' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                        <X className="h-3 w-3" /> Skipped
                      </span>
                    ) : (
                      <button
                        onClick={() => setApproveInvoice(inv)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve Stock
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs transition-all"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.invoice_no)}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 cursor-pointer shadow-xs transition-all"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InvoiceImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onRefresh={() => {
          fetchProducts()
          fetchInvoices()
        }}
        products={products}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <ApproveStockModal
        isOpen={!!approveInvoice}
        invoice={approveInvoice}
        onClose={() => setApproveInvoice(null)}
        onRefresh={() => {
          fetchProducts();
          fetchInvoices();
        }}
        products={products}
      />

      <AuditorSummaryModal
        isOpen={auditorModalOpen}
        onClose={() => setAuditorModalOpen(false)}
        filteredInvoices={filteredInvoices}
        selectedMonthName={getMonthName(selectedMonth)}
        taxableTotal={taxableTotal}
        cgstTotal={cgstTotal}
        sgstTotal={sgstTotal}
        igstTotal={igstTotal}
        grandTotal={grandTotal}
      />
    </div>
  )
}
