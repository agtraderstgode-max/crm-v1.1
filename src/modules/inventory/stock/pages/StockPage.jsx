import { useState, useEffect, useRef } from 'react'
import { Warehouse, AlertTriangle, UploadCloud, Check, X, FileText, Settings, ShieldAlert, Sparkles } from 'lucide-react'
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

function findBestMatch(itemName, productsList) {
  let bestProd = null
  let maxScore = 0
  
  productsList.forEach(p => {
    // Check match against product name or ID
    const score = Math.max(getSimilarity(itemName, p.name), getSimilarity(itemName, p.id))
    if (score > maxScore) {
      maxScore = score
      bestProd = p
    }
  })
  
  return maxScore >= 0.35 ? { product: bestProd, score: maxScore } : null
}

function InvoiceImportModal({ isOpen, onClose, onRefresh, products }) {
  const [file, setFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [showKeyConfig, setShowKeyConfig] = useState(!localStorage.getItem('gemini_api_key'))
  const [linkedItems, setLinkedItems] = useState([]) // array of matched productIds or 'NEW'
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
    localStorage.setItem('gemini_api_key', geminiKey.trim())
    setShowKeyConfig(false)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) uploadAndScan(selected)
  }

  const uploadAndScan = (fileToScan) => {
    const key = localStorage.getItem('gemini_api_key') || ''
    if (!key) {
      setError('Please configure your Gemini API Key in the settings block below before scanning.')
      return
    }

    setFile(fileToScan)
    setScanning(true)
    setScanResult(null)
    setError('')
    setDuplicateDismissed(false)

    const formData = new FormData()
    formData.append('invoice', fileToScan)

    fetch('/api/upload-invoice', {
      method: 'POST',
      headers: {
        'x-gemini-key': key
      },
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
        // Setup initial fuzzy mappings
        const initialLinks = result.items.map(item => {
          const matchInfo = findBestMatch(item.product_name, products)
          return {
            product_name: item.product_name,
            brand: item.brand || '',
            quantity: parseInt(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
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

  const handleCommitStock = async () => {
    if (scanResult?.is_duplicate && !duplicateDismissed) {
      alert('Please acknowledge the duplicate invoice warning before committing.')
      return
    }

    setSaving(true)
    try {
      // Loop through all items and save updates
      for (const item of linkedItems) {
        if (item.selectedId === 'NEW') {
          // 1. Create a brand new variant
          const newProd = {
            name: item.product_name,
            brand: item.brand || 'Supplier',
            category: 'Floor Tiles', // default
            size: item.size || 'N/A',
            finish: item.finish || 'Matte',
            price: `₹${Math.round(item.rate)}/sqft`,
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
          // 2. Increment stock on existing product
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

      // 3. Save invoice details to invoices list to block duplicates in future
      const invoiceLog = {
        invoice_no: scanResult.invoice_no,
        supplier_name: scanResult.supplier_name,
        items_count: linkedItems.length,
        date: new Date().toISOString().split('T')[0]
      }
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceLog)
      })

      alert('🎉 Stock updated successfully!')
      onRefresh()
      onClose()
    } catch (err) {
      console.error('Error saving stock:', err)
      alert('Failed to save stock update: ' + err.message)
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
          {/* Key configuration helper */}
          {showKeyConfig && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-blue-800">1-Minute Gemini API Key Setup (100% Free)</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    Required to scan. Go to{' '}
                    <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">
                      Google AI Studio
                    </a>{' '}
                    to generate a free key and paste it below.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your Gemini API Key here..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                />
                <button
                  onClick={handleSaveKey}
                  disabled={!geminiKey.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs font-semibold text-red-600 flex items-start gap-2">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Upload Target State */}
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

          {/* 2. Scanning Loader State */}
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
                <p className="text-xs text-slate-400 mt-1">Reading purchase items, quantities, and matching descriptions</p>
              </div>
            </div>
          )}

          {/* 3. Scan verification view */}
          {file && !scanning && scanResult && (
            <div className="space-y-5">
              {/* Duplicate warnings */}
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

              {/* Invoice details summary */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Invoice Ref No</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{scanResult.invoice_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Supplier Name</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{scanResult.supplier_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Uploaded Document</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">{file.name}</span>
                </div>
              </div>

              {/* Mappings Verification table */}
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
                              Size: {item.size || 'N/A'} · Finish: {item.finish || 'N/A'} · Brand: {item.brand || 'N/A'}
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
                                  [{p.id}] {p.name}
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
                onClick={handleCommitStock}
                disabled={saving || (scanResult.is_duplicate && !duplicateDismissed)}
                className={cn(
                  'rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm cursor-pointer',
                  (saving || (scanResult.is_duplicate && !duplicateDismissed))
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
                )}
              >
                {saving ? 'Committing...' : 'Confirm & Update Stock'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)

  const fetchStock = () => {
    setLoading(true)
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading products stock:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchStock()
  }, [])

  const getStockStatus = (stock, min) => {
    if (stock <= min / 2) return 'Critical'
    if (stock <= min) return 'Low'
    return 'OK'
  }

  const lowCount = products.filter(p => getStockStatus(p.stock, p.min) !== 'OK').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Stock Overview <Warehouse className="h-5 w-5 text-blue-500" />
          </h1>
          <p className="text-sm text-slate-500">Current stock levels across all products</p>
        </div>
        <div className="flex items-center gap-3">
          {lowCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {lowCount} low stock alerts
            </div>
          )}
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" /> Import Invoice
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Loading stock metrics...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">No products in stock list.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Product','Brand','Category','Current Qty','Reserved','Available','Min Level','Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map(s => {
                const stat = getStockStatus(s.stock, s.min)
                const availableQty = (s.stock || 0) - (s.reserved || 0)
                
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">SKU: {s.id} · Finish: {s.finish || 'Matte'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{s.brand}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{s.category}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{s.stock} {s.unit || 'boxes'}</td>
                    <td className="px-5 py-3.5 text-amber-600 font-bold">{s.reserved || 0}</td>
                    <td className="px-5 py-3.5 text-emerald-700 font-bold">{availableQty}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{s.min}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        stat === 'OK'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : stat === 'Low'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                      )}>
                        {stat}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <InvoiceImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onRefresh={fetchStock}
        products={products}
      />
    </div>
  )
}
