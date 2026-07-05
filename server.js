import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

import multer from 'multer'
import { GoogleGenAI } from '@google/genai'

const app = express()
const PORT = 5001

// ─── Mode Switch ──────────────────────────────────────────────────────────────
// Development: USE_CLOUD=false → instant local reads, background Supabase sync
// Production:  USE_CLOUD=true  → read/write directly from Supabase (cloud-first)
const USE_CLOUD = process.env.USE_CLOUD === 'true'
console.log(`🔧 Mode: ${USE_CLOUD ? '☁️  Cloud-first (Supabase)' : '⚡ Local-first (fast dev mode)'}`)

// ─── Local File Storage ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const LEADS_FILE = path.join(DATA_DIR, 'leads.json')
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json')
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json')

// ─── Supabase Client ─────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://emiwizejpibhvdoylbmb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaXdpemVqcGliaHZkb3lsYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzMzNTIsImV4cCI6MjA5ODY0OTM1Mn0.St_S4-7vGvLgsc41DVCbtMA_HBTe-bSmka_-fjndTis'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

app.use(cors())
app.use(express.json())

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

const INITIAL_LEADS = [
  { id:'L001', date:'2026-07-03', name:'Aravind Kumar',        phone:'9876543210', location:'Gandhipuram',      lat:11.0172, lng:76.9561, km:0.5,  source:'Google',          size:'1500+', budget:'Medium', houseType:'New',        custType:'Owner',     stage:'Immediate',           priority:'High',   status:'New Entry',        nextDate:'2026-07-05', expectedAmt:'₹80,000',  remarks:'Wants premium wood finish tiles.' },
  { id:'L002', date:'2026-07-02', name:'Suresh Constructions', phone:'9845612307', location:'Peelamedu',        lat:11.0300, lng:77.0200, km:6.2,  source:'Engineer',        size:'2500+', budget:'High',   houseType:'New',        custType:'Builder',   stage:'Flooring Stage',      priority:'High',   status:'Keep Tracking 2x', nextDate:'2026-07-04', expectedAmt:'₹3,20,000', remarks:'Looking for imported marble.' },
  { id:'L003', date:'2026-07-01', name:'Meena Rajan',          phone:'9003344556', location:'RS Puram',         lat:11.0140, lng:76.9420, km:1.2,  source:'Walk In',         size:'750+',  budget:'Low',    houseType:'Renovation', custType:'Owner',     stage:'Planning',            priority:'Low',    status:'Lost Customer',    nextDate:'',           expectedAmt:'₹30,000',  remarks:'Price too high. Went elsewhere.' },
  { id:'L004', date:'2026-06-30', name:'Devi Architects',      phone:'9988776655', location:'Saravanampatti',   lat:11.0680, lng:77.0200, km:8.5,  source:'Social Media',    size:'2000+', budget:'High',   houseType:'New',        custType:'Architect', stage:'Construction Started', priority:'Medium', status:'Keep Tracking 3x', nextDate:'2026-07-06', expectedAmt:'₹2,10,000', remarks:'Interested in large format slabs.' },
  { id:'L005', date:'2026-06-29', name:'Karthik Homes',        phone:'9444123456', location:'Thudiyalur',       lat:11.0800, lng:76.9700, km:7.2,  source:'Tv Ad',           size:'500+',  budget:'Low',    houseType:'Renovation', custType:'Owner',     stage:'Immediate',           priority:'Medium', status:'Customer Bought',  nextDate:'',           expectedAmt:'₹22,000',  remarks:'Bought bathroom tiles set.' },
  { id:'L006', date:'2026-06-28', name:'Ibrahim Kutty',        phone:'9894002233', location:'Karumathampatti',  lat:11.0900, lng:77.1100, km:24.6, source:'Mestri',          size:'1000+', budget:'Low',    houseType:'New',        custType:'Owner',     stage:'Flooring Stage',      priority:'High',   status:'Keep Tracking 4x', nextDate:'2026-07-03', expectedAmt:'₹55,000',  remarks:'Mestri Ramu referred. Needs discount.' },
]

const INITIAL_ORDERS = [
  { id:'ORD-001', customer:'Suresh Constructions', date:'2026-07-02', items:28, total:'₹4,80,000', status:'Processing', delivery:'2026-07-08' },
  { id:'ORD-002', customer:'Karthik Builders',    date:'2026-07-01', items:15, total:'₹2,10,000', status:'Dispatched', delivery:'2026-07-05' },
  { id:'ORD-003', customer:'Aravind Kumar',        date:'2026-06-30', items:12, total:'₹1,24,500', status:'Delivered',  delivery:'2026-07-03' },
  { id:'ORD-004', customer:'Ibrahim Tiles',        date:'2026-06-28', items:8,  total:'₹68,000',   status:'Confirmed',  delivery:'2026-07-10' },
]

const INITIAL_CUSTOMERS = [
  { id: 'C-001', name: 'Aravind Kumar',       phone: '9876543210', location: 'Gandhipuram',    custType: 'Owner',       expectedAmt: '₹80,000',   attendedBy: 'Ramesh', remarks: 'Wants premium wood finish tiles.', source: 'Google', size: '1500+', houseType: 'New', stage: 'Immediate', budget: 'Medium', date: '2026-07-03' },
  { id: 'C-002', name: 'Suresh Constructions',phone: '9845612307', location: 'Peelamedu',       custType: 'Builder',     expectedAmt: '₹3,20,000', attendedBy: 'Siva',   remarks: 'Looking for imported marble.',     source: 'Engineer', size: '2500+', houseType: 'New', stage: 'Flooring Stage', budget: 'High', date: '2026-07-02' },
  { id: 'C-003', name: 'Meena Rajan',         phone: '9003344556', location: 'RS Puram',        custType: 'Owner',       expectedAmt: '₹30,000',   attendedBy: 'Ramesh', remarks: 'Price too high initially.',         source: 'Walk In', size: '750+', houseType: 'Renovation', stage: 'Planning', budget: 'Low', date: '2026-07-01' },
]

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8')
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(INITIAL_ORDERS, null, 2), 'utf-8')
}
if (!fs.existsSync(CUSTOMERS_FILE)) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(INITIAL_CUSTOMERS, null, 2), 'utf-8')
}
if (!fs.existsSync(INVOICES_FILE)) {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2), 'utf-8')
}

// ─── Local File Helpers ───────────────────────────────────────────────────────
const getLocalLeads = () => {
  try { return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalLeads = (leads) => {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8')
}

const getLocalOrders = () => {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalOrders = (orders) => {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8')
}

const getLocalCustomers = () => {
  try { return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalCustomers = (customers) => {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), 'utf-8')
}

const getLocalProducts = () => {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalProducts = (products) => {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8')
}

const getLocalInvoices = () => {
  try { return JSON.parse(fs.readFileSync(INVOICES_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalInvoices = (invoices) => {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf-8')
}

// ─── Supabase Mappers ─────────────────────────────────────────────────────────
const mapToPostgres = (lead, includeHistory = true) => {
  const row = {
    id: lead.id,
    date: lead.date || null,
    name: lead.name,
    phone: lead.phone,
    location: lead.location || null,
    lat: lead.lat ? parseFloat(lead.lat) : null,
    lng: lead.lng ? parseFloat(lead.lng) : null,
    km: lead.km ? parseFloat(lead.km) : null,
    source: lead.source || null,
    size: lead.size || null,
    budget: lead.budget || null,
    housetype: lead.houseType || null,
    custtype: lead.custType || null,
    stage: lead.stage || null,
    expectedamt: lead.expectedAmt || null,
    priority: lead.priority || null,
    status: lead.status || null,
    nextdate: lead.nextDate || null,
    withindays: lead.withinDays || null,
    remarks: lead.remarks || null,
    attendedby: lead.attendedBy || null,
  }
  // Only add history if column is expected to exist
  if (includeHistory) row.history = lead.history || []
  return row
}

const mapFromPostgres = (lead) => ({
  id: lead.id,
  date: lead.date || '',
  name: lead.name,
  phone: lead.phone,
  location: lead.location || '',
  lat: lead.lat || '',
  lng: lead.lng || '',
  km: lead.km || '',
  source: lead.source || '',
  size: lead.size || '',
  budget: lead.budget || '',
  houseType: lead.housetype || '',
  custType: lead.custtype || '',
  stage: lead.stage || '',
  expectedAmt: lead.expectedamt || '',
  priority: lead.priority || 'Medium',
  status: lead.status || 'New Entry',
  nextDate: lead.nextdate || '',
  withinDays: lead.withindays || '',
  remarks: lead.remarks || '',
  attendedBy: lead.attendedby || '',
  history: lead.history || []
})

// ─── Background Supabase Sync (fire-and-forget) ───────────────────────────────
// Dev mode: API already responded to client. Supabase gets updated quietly.
const syncUpsertToSupabase = (lead) => {
  // Try with history first; if that column doesn't exist yet, retry without it
  supabase.from('leads').upsert([mapToPostgres(lead, true)])
    .then(({ error }) => {
      if (error && error.message.includes('history')) {
        // history column not yet added in Supabase — retry without it
        return supabase.from('leads').upsert([mapToPostgres(lead, false)])
          .then(({ error: e2 }) => {
            if (e2) console.warn(`⚠️  BG sync (no-history) failed for ${lead.id}:`, e2.message)
            else console.log(`☁️  BG synced ${lead.id} → Supabase (without history — add history column to enable)`)
          })
      }
      if (error) console.warn(`⚠️  BG sync failed for ${lead.id}:`, error.message)
      else console.log(`☁️  BG synced ${lead.id} → Supabase`)
    })
    .catch(err => console.warn('⚠️  BG sync exception:', err.message))
}

// Pull latest Supabase data on startup to refresh local cache
const refreshLocalFromCloud = async () => {
  try {
    const { data, error } = await supabase.from('leads').select('*').order('date', { ascending: false })
    if (error) { console.warn('⚠️  Startup cloud refresh failed:', error.message); return }
    const mapped = data.map(mapFromPostgres)
    saveLocalLeads(mapped)
    console.log(`☁️  Local cache refreshed from Supabase (${mapped.length} leads)`)
  } catch (err) {
    console.warn('⚠️  Startup cloud refresh exception:', err.message)
  }
}

// ─── GET /api/leads ────────────────────────────────────────────────────────────
app.get('/api/leads', async (req, res) => {
  if (USE_CLOUD) {
    // Cloud-first: wait for Supabase response
    try {
      const { data, error } = await supabase.from('leads').select('*').order('date', { ascending: false })
      if (error) throw error
      const mapped = data.map(mapFromPostgres)
      saveLocalLeads(mapped)
      return res.json(mapped)
    } catch (err) {
      console.warn('⚠️  Supabase read failed, serving local:', err.message)
      return res.json(getLocalLeads())
    }
  }

  // ⚡ Local-first: instant response from local file cache
  const localLeads = getLocalLeads()
  res.json(localLeads)
  console.log(`⚡ Served ${localLeads.length} leads instantly from local cache`)
})

// ─── POST /api/leads ────────────────────────────────────────────────────────────
app.post('/api/leads', async (req, res) => {
  const newLead = req.body
  const localLeads = getLocalLeads()

  // Generate sequential ID from local file (no cloud round-trip needed)
  const nums = localLeads.map(l => {
    const match = l.id?.match(/^L(\d+)$/i)
    return match ? parseInt(match[1]) : 0
  })
  newLead.id = `L${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`

  // ⚡ Save locally first → instant response
  localLeads.unshift(newLead)
  saveLocalLeads(localLeads)
  res.status(201).json(newLead)
  console.log(`⚡ Saved ${newLead.id} locally`)

  // ☁️ Background sync to Supabase
  syncUpsertToSupabase(newLead)
})

// ─── PUT /api/leads/:id ────────────────────────────────────────────────────────
app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params
  const updatedLead = req.body

  // ⚡ Update locally first → instant response
  const localLeads = getLocalLeads()
  const idx = localLeads.findIndex(l => l.id === id)
  if (idx !== -1) localLeads[idx] = updatedLead
  else localLeads.unshift(updatedLead)
  saveLocalLeads(localLeads)
  res.json(updatedLead)
  console.log(`⚡ Updated ${id} locally`)

  // ☁️ Background sync to Supabase
  syncUpsertToSupabase(updatedLead)
})

// ─── DELETE /api/leads/:id ─────────────────────────────────────────────────────
app.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params

  // ⚡ Remove locally first → instant response
  const localLeads = getLocalLeads()
  saveLocalLeads(localLeads.filter(l => l.id !== id))
  res.json({ success: true, id })
  console.log(`⚡ Deleted ${id} locally`)

  // ☁️ Background sync to Supabase
  supabase.from('leads').delete().eq('id', id)
    .then(({ error }) => {
      if (error) console.warn(`⚠️  BG delete failed for ${id}:`, error.message)
      else console.log(`☁️  BG deleted ${id} from Supabase`)
    })
    .catch(err => console.warn('⚠️  BG delete exception:', err.message))
})

// ─── GET /api/orders ───────────────────────────────────────────────────────────
app.get('/api/orders', (req, res) => {
  res.json(getLocalOrders())
})

// ─── POST /api/orders ──────────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const newOrder = req.body
  const localOrders = getLocalOrders()

  if (!newOrder.id) {
    const nums = localOrders.map(o => {
      const match = o.id?.match(/^ORD-(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    newOrder.id = `ORD-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  }

  localOrders.unshift(newOrder)
  saveLocalOrders(localOrders)
  res.status(201).json(newOrder)
  console.log(`⚡ Saved order ${newOrder.id} locally`)
})

// ─── PUT /api/orders/:id ────────────────────────────────────────────────────────
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params
  const updatedOrder = req.body
  const localOrders = getLocalOrders()
  const idx = localOrders.findIndex(o => o.id === id)
  if (idx !== -1) {
    localOrders[idx] = updatedOrder
  } else {
    localOrders.unshift(updatedOrder)
  }
  saveLocalOrders(localOrders)
  res.json(updatedOrder)
  console.log(`⚡ Updated order ${id} locally`)
})

// ─── GET /api/customers ──────────────────────────────────────────────────────────
app.get('/api/customers', (req, res) => {
  res.json(getLocalCustomers())
})

// ─── POST /api/customers ─────────────────────────────────────────────────────────
app.post('/api/customers', (req, res) => {
  const newCustomer = req.body
  const localCustomers = getLocalCustomers()

  if (!newCustomer.id) {
    const nums = localCustomers.map(c => {
      const match = c.id?.match(/^C-(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    newCustomer.id = `C-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  }

  localCustomers.unshift(newCustomer)
  saveLocalCustomers(localCustomers)
  res.status(201).json(newCustomer)
  console.log(`⚡ Saved customer ${newCustomer.id} locally`)
})

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────────
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params
  const updatedCustomer = req.body
  const localCustomers = getLocalCustomers()
  const idx = localCustomers.findIndex(c => c.id === id)
  if (idx !== -1) {
    localCustomers[idx] = updatedCustomer
  } else {
    localCustomers.unshift(updatedCustomer)
  }
  saveLocalCustomers(localCustomers)
  res.json(updatedCustomer)
  console.log(`⚡ Updated customer ${id} locally`)
})

// ─── DELETE /api/customers/:id ──────────────────────────────────────────────────
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params
  const localCustomers = getLocalCustomers()
  saveLocalCustomers(localCustomers.filter(c => c.id !== id))
  res.json({ success: true, id })
  console.log(`⚡ Deleted customer ${id} locally`)
})

// ─── GET /api/products ───────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json(getLocalProducts())
})

// ─── POST /api/products ──────────────────────────────────────────────────────────
app.post('/api/products', (req, res) => {
  const newProduct = req.body
  const localProducts = getLocalProducts()
  
  if (!newProduct.id) {
    const nums = localProducts.map(p => {
      const match = p.id?.match(/^TL-(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    newProduct.id = `TL-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  }

  localProducts.push(newProduct)
  saveLocalProducts(localProducts)
  res.status(201).json(newProduct)
  console.log(`⚡ Saved product ${newProduct.id} locally`)
})

// ─── PUT /api/products/:id ───────────────────────────────────────────────────────
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params
  const updatedProduct = req.body
  const localProducts = getLocalProducts()
  const idx = localProducts.findIndex(p => p.id === id)
  if (idx !== -1) {
    localProducts[idx] = updatedProduct
  } else {
    localProducts.push(updatedProduct)
  }
  saveLocalProducts(localProducts)
  res.json(updatedProduct)
  console.log(`⚡ Updated product ${id} locally`)
})

// ─── GET /api/invoices ───────────────────────────────────────────────────────────
app.get('/api/invoices', (req, res) => {
  res.json(getLocalInvoices())
})

// ─── POST /api/invoices ──────────────────────────────────────────────────────────
app.post('/api/invoices', (req, res) => {
  const newInvoice = req.body // { invoice_no, supplier_name, items_count, date }
  const localInvoices = getLocalInvoices()
  localInvoices.push(newInvoice)
  saveLocalInvoices(localInvoices)
  res.status(201).json(newInvoice)
  console.log(`⚡ Saved invoice ${newInvoice.invoice_no} to history`)
})

// ─── Multer Middleware for File Upload ──────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() })

// ─── POST /api/upload-invoice ───────────────────────────────────────────────────
app.post('/api/upload-invoice', upload.single('invoice'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No invoice file uploaded.' })

    const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key is missing. Please configure it in Settings.' })
    }

    const ai = new GoogleGenAI({ apiKey })

    const systemPrompt = `
      You are an expert purchase invoice scanner. Analyze the uploaded invoice image or PDF document.
      Identify and extract:
      1. Invoice/Bill number
      2. Supplier/Vendor name
      3. All tile items: name, size, finish, brand, quantity (always integer count of boxes/sqft), and rate (price per unit).

      Provide ONLY a valid JSON object matching the schema below. No markdown wrappers.

      Schema:
      {
        "invoice_no": "String (invoice/bill reference number)",
        "supplier_name": "String (supplier name)",
        "items": [
          {
            "product_name": "String (exact item description from invoice)",
            "brand": "String (e.g. Kajaria, Somany, RAK, Orient, Johnson, if found)",
            "quantity": number (quantity of units/boxes),
            "rate": number (price per unit/box),
            "size": "String (e.g. 600x600, 800x800, if found)",
            "finish": "String (e.g. Glossy, Matte, Satin, Rough, if found)"
          }
        ]
      }
    `

    const filePart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    }

    console.log(`🤖 Processing invoice with Gemini 2.5 Flash (${file.size} bytes, ${file.mimetype})...`)
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        filePart,
        systemPrompt
      ]
    })

    const text = response.text.trim()
    console.log(`✅ Gemini response:`, text)

    const jsonStr = text.replace(/^```json/i, '').replace(/```$/, '').trim()
    const invoiceData = JSON.parse(jsonStr)

    // Check for duplicate invoice in history
    const localInvoices = getLocalInvoices()
    const isDuplicate = localInvoices.some(inv => 
      inv.invoice_no === invoiceData.invoice_no && 
      inv.supplier_name.toLowerCase() === invoiceData.supplier_name.toLowerCase()
    )

    res.json({
      invoice_no: invoiceData.invoice_no || '',
      supplier_name: invoiceData.supplier_name || '',
      items: invoiceData.items || [],
      is_duplicate: isDuplicate
    })

  } catch (error) {
    console.error('Gemini invoice scanning error:', error)
    res.status(500).json({ error: error.message || 'Failed to scan purchase invoice.' })
  }
})

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)

  // On startup: silently pull latest cloud data so local cache is up-to-date
  if (!USE_CLOUD) {
    console.log('🔄 Refreshing local cache from Supabase in background...')
    refreshLocalFromCloud()
  }
})
