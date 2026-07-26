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
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')


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

const getLocalCategories = () => {
  try { return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalCategories = (categories) => {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8')
}

const getPricingSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    }
  } catch {}
  return { discount_percentage: 15 }
}

const savePricingSettings = (settings) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
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
  const products = getLocalProducts()
  const categories = getLocalCategories()
  
  const joined = products.map(p => {
    if (p.category_id && p.category_id !== 'NO_CAT') {
      const cat = categories.find(c => c.id === p.category_id)
      if (cat) {
        return {
          ...p,
          mrp: cat.mrp,
          online_price: cat.online_price,
          sqft_price: cat.sqft_price,
          price: `₹${cat.sqft_price}/sqft`,
          pcs_per_box: cat.pcs_per_box,
          sqft_per_box: cat.sqft_per_box,
          weight_per_box: cat.weight_per_box,
          category: cat.name // map display category in UI
        }
      }
    } else if (p.category_id === 'NO_CAT') {
      return {
        ...p,
        category: 'No Category'
      }
    }
    return p
  })
  res.json(joined)
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

// ─── GET /api/categories ─────────────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  res.json(getLocalCategories())
})

// ─── POST /api/categories ────────────────────────────────────────────────────────
app.post('/api/categories', (req, res) => {
  const newCat = req.body
  const categories = getLocalCategories()
  
  if (!newCat.id) {
    const nums = categories.map(c => {
      const match = c.id?.match(/^CAT-(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    newCat.id = `CAT-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  }
  
  const settings = getPricingSettings()
  const defaultPct = settings.discount_percentage || 15
  const pct = newCat.discount_pct !== undefined ? parseFloat(newCat.discount_pct) : defaultPct
  
  newCat.discount_pct = pct
  
  // Calculate pricing based on formula
  const mrp = parseFloat(newCat.mrp || 0)
  const sqft = parseFloat(newCat.sqft_per_box || 1)
  newCat.online_price = Math.round(mrp * (1 - pct / 100))
  newCat.sqft_price = Math.round(newCat.online_price / sqft)
  
  categories.push(newCat)
  saveLocalCategories(categories)
  res.status(201).json(newCat)
  console.log(`⚡ Saved category ${newCat.id} locally`)
})

// ─── PUT /api/categories/:id ─────────────────────────────────────────────────────
app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params
  const updated = req.body
  const categories = getLocalCategories()
  const idx = categories.findIndex(c => c.id === id)
  if (idx !== -1) {
    const settings = getPricingSettings()
    const defaultPct = settings.discount_percentage || 15
    const pct = updated.discount_pct !== undefined ? parseFloat(updated.discount_pct) : defaultPct
    
    updated.discount_pct = pct

    const mrp = parseFloat(updated.mrp || 0)
    const sqft = parseFloat(updated.sqft_per_box || 1)
    updated.online_price = Math.round(mrp * (1 - pct / 100))
    updated.sqft_price = Math.round(updated.online_price / sqft)
    
    categories[idx] = { ...categories[idx], ...updated }
    saveLocalCategories(categories)
    res.json(categories[idx])
    console.log(`⚡ Updated category ${id} locally`)
  } else {
    res.status(404).json({ error: 'Category not found' })
  }
})

// ─── GET /api/pricing-settings ───────────────────────────────────────────────────
app.get('/api/pricing-settings', (req, res) => {
  res.json(getPricingSettings())
})

// ─── POST /api/pricing-settings ──────────────────────────────────────────────────
app.post('/api/pricing-settings', (req, res) => {
  const { discount_percentage } = req.body
  if (discount_percentage === undefined || isNaN(discount_percentage)) {
    return res.status(400).json({ error: 'Invalid discount percentage.' })
  }
  
  const pct = parseFloat(discount_percentage)
  savePricingSettings({ discount_percentage: pct })
  
  // Recalculate categories
  const categories = getLocalCategories()
  const updated = categories.map(c => {
    const mrp = parseFloat(c.mrp || 0)
    const sqft = parseFloat(c.sqft_per_box || 1)
    const online_price = Math.round(mrp * (1 - pct / 100))
    const sqft_price = Math.round(online_price / sqft)
    return {
      ...c,
      discount_pct: pct, // reset category custom discount percentage to global
      online_price,
      sqft_price
    }
  })
  saveLocalCategories(updated)
  
  res.json({ success: true, discount_percentage: pct, count: updated.length })
  console.log(`⚡ Re-calculated prices for ${updated.length} categories with ${pct}% discount`)
})


// ─── DELETE /api/categories/:id ──────────────────────────────────────────────────
app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params
  const categories = getLocalCategories()
  const idx = categories.findIndex(c => c.id === id)
  if (idx !== -1) {
    categories.splice(idx, 1)
    saveLocalCategories(categories)
    res.json({ success: true, message: `Category ${id} deleted successfully.` })
    console.log(`⚡ Deleted category ${id} locally`)
  } else {
    res.status(404).json({ error: 'Category not found' })
  }
})

// ─── GET /api/invoices ───────────────────────────────────────────────────────────
app.get('/api/invoices', (req, res) => {
  res.json(getLocalInvoices())
})

// ─── POST /api/invoices ──────────────────────────────────────────────────────────
app.post('/api/invoices', (req, res) => {
  const newInvoice = req.body // { invoice_no, supplier_name, items_count, date }
  newInvoice.stock_status = newInvoice.stock_status || 'pending'
  const localInvoices = getLocalInvoices()
  localInvoices.push(newInvoice)
  saveLocalInvoices(localInvoices)
  res.status(201).json(newInvoice)
  console.log(`⚡ Saved invoice ${newInvoice.invoice_no} to history`)
})

// ─── PUT /api/invoices/:invoice_no ───────────────────────────────────────────────
app.put('/api/invoices/:invoice_no', (req, res) => {
  const { invoice_no } = req.params
  const updatedFields = req.body
  const localInvoices = getLocalInvoices()
  const idx = localInvoices.findIndex(inv => inv.invoice_no === invoice_no)
  if (idx !== -1) {
    localInvoices[idx] = { ...localInvoices[idx], ...updatedFields }
    saveLocalInvoices(localInvoices)
    res.json(localInvoices[idx])
    console.log(`⚡ Updated invoice ${invoice_no} fields:`, updatedFields)
  } else {
    res.status(404).json({ error: 'Invoice not found' })
  }
})

// ─── DELETE /api/invoices/:invoice_no ────────────────────────────────────────────
app.delete('/api/invoices/:invoice_no', (req, res) => {
  const { invoice_no } = req.params
  const localInvoices = getLocalInvoices()
  const idx = localInvoices.findIndex(inv => inv.invoice_no === invoice_no)
  if (idx !== -1) {
    localInvoices.splice(idx, 1)
    saveLocalInvoices(localInvoices)
    res.json({ success: true, message: `Invoice ${invoice_no} deleted successfully.` })
    console.log(`⚡ Deleted invoice ${invoice_no} from history`)
  } else {
    res.status(404).json({ error: 'Invoice not found' })
  }
})

// ─── Multer Middleware for File Upload ──────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() })

// Clean string representation of numbers to float (handles commas, currency signs)
function cleanNumber(val) {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

// Clean and normalize arbitrary date strings to YYYY-MM-DD
function cleanDate(val) {
  if (!val) return ''
  const str = String(val).trim()
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }
  
  const dmyMatch = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
  }

  const ymdMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`
  }

  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dateVal = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dateVal}`
    }
  } catch {}

  return str
}

// ─── POST /api/upload-invoice ───────────────────────────────────────────────────
app.post('/api/upload-invoice', upload.single('invoice'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No invoice file uploaded.' })

    if (req.headers['x-provider'] === 'mistral') {
      const mistralKey = req.headers['x-mistral-key'];
      if (!mistralKey) {
        return res.status(400).json({ error: 'Mistral API Key is missing. Please configure it in settings.' });
      }

      console.log(`🤖 Processing invoice with Mistral OCR (${file.size} bytes)...`);

      // 1. Call Mistral OCR Endpoint
      const base64Data = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64Data}`;

      const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralKey}`
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'document_url',
            document_url: dataUri
          }
        })
      });

      if (!ocrResponse.ok) {
        const errText = await ocrResponse.text();
        throw new Error(`Mistral OCR API failed: ${errText}`);
      }

      const ocrResult = await ocrResponse.json();
      const markdownText = ocrResult.pages.map(p => p.markdown).join('\n');

      console.log('🤖 Structuring extracted markdown using mistral-large-latest completions...');

      // 2. Call Mistral Completions Endpoint to structure the JSON
      const systemPromptText = `
        You are an expert purchase tax invoice parser. Analyze the provided invoice text.
        Identify and extract the following details and return ONLY a valid JSON object matching the requested schema.
        Do not include markdown tags, comments, or wrappers. Just return the raw JSON object.

        Schema:
        {
          "invoice_no": string,
          "date": string (format: YYYY-MM-DD),
          "supplier_name": string (Seller company name),
          "supplier_gstin": string (Seller GSTIN),
          "supplier_phone": string (Seller phone),
          "buyer_name": string (Buyer name),
          "buyer_gstin": string (Buyer GSTIN),
          "total_qty": number (Grand total quantity of boxes),
          "gross_amount": number (Gross amount before tax),
          "tax_percent": number (Overall GST rate in %),
          "gst_amount": number (Grand total of GST taxes),
          "total_amount": number (Grand total bill amount),
          "total_items": number (Highest Serial Number / item count declared in the invoice),
          "items": [
            {
              "product_name": string,
              "size": string (extract exactly what is written in the Size column of the invoice, preserving attributes like "WP", "WP MAT", "PGVT", "HG", e.g., "12X12 WP MAT", "18X12 WP", "48X24 PGVT"),
              "finish": string,
              "brand": string,
              "hsn_code": string,
              "quantity": number,
              "rate": number,
              "amount": number
            }
          ]
        }
      `;

      const chatResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralKey}`
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            { role: 'system', content: systemPromptText },
            { role: 'user', content: markdownText }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        throw new Error(`Mistral Completions API failed: ${errText}`);
      }

      const chatResult = await chatResponse.json();
      const contentText = chatResult.choices[0].message.content;
      
      const parsed = JSON.parse(contentText);

      const cleanedResult = {
        invoice_no: parsed.invoice_no || 'N/A',
        date: cleanDate(parsed.date),
        supplier_name: parsed.supplier_name || 'N/A',
        supplier_gstin: parsed.supplier_gstin || '',
        supplier_phone: parsed.supplier_phone || '',
        buyer_name: parsed.buyer_name || '',
        buyer_gstin: parsed.buyer_gstin || '',
        total_qty: cleanNumber(parsed.total_qty),
        gross_amount: cleanNumber(parsed.gross_amount),
        tax_percent: cleanNumber(parsed.tax_percent),
        gst_amount: cleanNumber(parsed.gst_amount),
        total_amount: cleanNumber(parsed.total_amount),
        total_items: cleanNumber(parsed.total_items),
        items: (parsed.items || []).map(item => ({
          product_name: item.product_name || 'N/A',
          size: String(item.size || '').toUpperCase().trim(),
          finish: item.finish || 'Matte',
          brand: item.brand || parsed.supplier_name || 'KAG',
          hsn_code: String(item.hsn_code || '69072300').replace(/\D/g, ''),
          quantity: cleanNumber(item.quantity),
          rate: cleanNumber(item.rate),
          amount: cleanNumber(item.amount)
        }))
      };

      const localInvoices = getLocalInvoices();
      const isDuplicate = localInvoices.some(inv => 
        inv.invoice_no === cleanedResult.invoice_no && 
        inv.supplier_name === cleanedResult.supplier_name
      );
      cleanedResult.is_duplicate = isDuplicate;

      return res.json(cleanedResult);
    }

    const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY
    const modelName = req.headers['x-gemini-model'] || 'gemini-2.5-flash'
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key is missing. Please configure it in Settings.' })
    }

    const ai = new GoogleGenAI({ apiKey })

    const systemPrompt = `
      You are an expert purchase tax invoice parser. Analyze the uploaded invoice image or PDF document.
      Identify and extract the following details:
      1. invoice_no: Invoice/Bill Reference Number.
      2. date: Invoice Date (format: YYYY-MM-DD).
      3. supplier_name: Seller company name (e.g. KAG INDIA PRIVATE LIMITED).
      4. supplier_gstin: Seller GSTIN number (e.g. 33AADCK5381Q1Z1).
      5. supplier_phone: Seller Phone Number.
      6. buyer_name: Buyer company name (e.g. AG TRADERS).
      7. buyer_gstin: Buyer GSTIN number (e.g. 33DULPN7536Q1ZQ).
      8. total_qty: Grand total quantity of boxes (integer).
      9. gross_amount: Subtotal / Gross amount before tax.
      10. tax_percent: Overall GST rate in % (e.g., 18 or 28, combined CGST + SGST).
      11. gst_amount: Grand total of GST taxes (CGST + SGST).
      12. total_amount: Net grand total amount after taxes (net payable).
      13. total_items: The total number of products/items listed in the invoice. Scan the serial number column in the invoice table (often labeled 'No', 'Sl. No.', 'S.No.', 'SNo', 'SlNo', 'No. of Items', etc.) and extract the highest number (maximum/last serial number value) from this column (for example: if the rows are numbered 1 to 9, the total_items value is 9). If no serial number column exists, count the total rows in the item list table.
      14. items: Array of invoice line items, each containing:
          - product_name: Item model/design description.
          - size: Item size (extract exactly what is written in the Size column of the invoice table, preserving any text/attributes like "WP", "WP MAT", "PGVT", "HG", e.g., "12X12 WP MAT", "18X12 WP", "48X24 PGVT").
          - finish: Item finish details (e.g. MAT, MATT, WP, SM, GL, SM ELE, etc.).
          - brand: Brand or range details (e.g. BRN FLWR, GREY GL ELE).
          - hsn_code: HSN code (e.g., 69072300).
          - quantity: Number of boxes (integer).
          - rate: Purchase price per box.
          - amount: Item total amount before tax.

      Provide ONLY a valid JSON object matching the schema below. No markdown wrappers.

      Schema:
      {
        "invoice_no": "String",
        "date": "String",
        "supplier_name": "String",
        "supplier_gstin": "String",
        "supplier_phone": "String",
        "buyer_name": "String",
        "buyer_gstin": "String",
        "total_qty": number,
        "gross_amount": number,
        "tax_percent": number,
        "gst_amount": number,
        "total_amount": number,
        "total_items": number,
        "items": [
          {
            "product_name": "String",
            "size": "String",
            "finish": "String",
            "brand": "String",
            "hsn_code": "String",
            "quantity": number,
            "rate": number,
            "amount": number
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

    console.log(`🤖 Processing invoice with ${modelName} (${file.size} bytes, ${file.mimetype})...`)
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        filePart,
        systemPrompt
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            invoice_no: { type: 'STRING' },
            date: { type: 'STRING' },
            supplier_name: { type: 'STRING' },
            supplier_gstin: { type: 'STRING' },
            supplier_phone: { type: 'STRING' },
            buyer_name: { type: 'STRING' },
            buyer_gstin: { type: 'STRING' },
            total_qty: { type: 'NUMBER' },
            gross_amount: { type: 'NUMBER' },
            tax_percent: { type: 'NUMBER' },
            gst_amount: { type: 'NUMBER' },
            total_amount: { type: 'NUMBER' },
            total_items: { type: 'NUMBER' },
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  product_name: { type: 'STRING' },
                  size: { type: 'STRING' },
                  finish: { type: 'STRING' },
                  brand: { type: 'STRING' },
                  hsn_code: { type: 'STRING' },
                  quantity: { type: 'NUMBER' },
                  rate: { type: 'NUMBER' },
                  amount: { type: 'NUMBER' }
                },
                required: ['product_name']
              }
            }
          },
          required: ['invoice_no', 'supplier_name', 'items']
        }
      }
    })

    const text = response.text.trim()
    console.log(`✅ Gemini response:`, text)

    const invoiceData = JSON.parse(text)

    // Check for duplicate invoice in history
    const localInvoices = getLocalInvoices()
    const isDuplicate = localInvoices.some(inv => 
      inv.invoice_no === invoiceData.invoice_no && 
      inv.supplier_name.toLowerCase() === invoiceData.supplier_name.toLowerCase()
    )

    // Sanitize and clean numerical fields and dates defensively
    const cleanedDate = cleanDate(invoiceData.date)
    const gross_amount = cleanNumber(invoiceData.gross_amount)
    const gst_amount = cleanNumber(invoiceData.gst_amount)
    const total_amount = cleanNumber(invoiceData.total_amount)
    const tax_percent = cleanNumber(invoiceData.tax_percent)
    const total_qty = Math.round(cleanNumber(invoiceData.total_qty))
    const total_items = Math.round(cleanNumber(invoiceData.total_items))

    const cleanedItems = (invoiceData.items || []).map(item => {
      const qty = Math.round(cleanNumber(item.quantity))
      const rate = cleanNumber(item.rate)
      return {
        product_name: item.product_name || '',
        size: item.size || '',
        finish: item.finish || '',
        brand: item.brand || '',
        hsn_code: item.hsn_code || '',
        quantity: qty,
        rate: rate,
        amount: cleanNumber(item.amount) || (qty * rate)
      }
    })

    res.json({
      invoice_no: invoiceData.invoice_no || '',
      date: cleanedDate,
      supplier_name: invoiceData.supplier_name || '',
      supplier_gstin: invoiceData.supplier_gstin || '',
      supplier_phone: invoiceData.supplier_phone || '',
      buyer_name: invoiceData.buyer_name || '',
      buyer_gstin: invoiceData.buyer_gstin || '',
      total_qty: total_qty,
      gross_amount: gross_amount,
      tax_percent: tax_percent,
      gst_amount: gst_amount,
      total_amount: total_amount,
      total_items: total_items,
      items: cleanedItems,
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
