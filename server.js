import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

import multer from 'multer'
import { GoogleGenAI } from '@google/genai'

// Load .env file if present
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile('.env')
  }
} catch (err) {
  // Ignore .env load error
}

const app = express()
const PORT = process.env.PORT || 5001

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
const STAFF_FILE = path.join(DATA_DIR, 'staff.json')
const CHAT_FILE = path.join(DATA_DIR, 'chat.json')
const RETURNS_FILE = path.join(DATA_DIR, 'returns.json')
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json')
const QUEUE_FILE = path.join(DATA_DIR, 'sync_queue.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

if (!fs.existsSync(CHAT_FILE)) {
  fs.writeFileSync(CHAT_FILE, JSON.stringify([], null, 2), 'utf-8')
}
if (!fs.existsSync(RETURNS_FILE)) {
  fs.writeFileSync(RETURNS_FILE, JSON.stringify([], null, 2), 'utf-8')
}
if (!fs.existsSync(REFERRALS_FILE)) {
  fs.writeFileSync(REFERRALS_FILE, JSON.stringify([], null, 2), 'utf-8')
}
if (!fs.existsSync(QUEUE_FILE)) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify([], null, 2), 'utf-8')
}

// ─── Supabase Client ─────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''
const isSupabaseConfigured = SUPABASE_URL && !SUPABASE_URL.includes('your-project') && !SUPABASE_URL.includes('emiwizejpibhvdoylbmb')

let supabase = null
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    console.log(`☁️  Supabase connected: ${SUPABASE_URL}`)
  } catch (err) {
    console.warn('⚠️  Supabase init failed:', err.message)
  }
} else {
  console.log('ℹ️  Supabase not yet configured. Running in Local Mode. (Edit .env to connect Supabase)')
}

app.use(cors())
app.use(express.json())

const INITIAL_LEADS = []
const INITIAL_ORDERS = []
const INITIAL_CUSTOMERS = []

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
const INITIAL_STAFF = [
  {
    id: 'STF-001',
    name: 'Ramesh Kumar',
    role: 'Showroom Executive / Sales',
    address: '123, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
    phone: '9876543210',
    whatsapp: '9876543210',
    telegram: '654789321',
    email: 'ramesh@tilescrm.com',
    aadhaar: '5489 1245 7856',
    username: 'ramesh01',
    passcode: '1234',
    status: 'Active',
    workingHours: '09:00 AM - 07:00 PM',
    shiftHours: 10,
    workingDays: '6 Days (Mon - Sat)',
    joinDate: '2025-01-15',
    attendance: []
  },
  {
    id: 'STF-002',
    name: 'Siva Subramaniam',
    role: 'Inventory & Stock Manager',
    address: '45, Peelamedu Pudur, Coimbatore - 641004',
    phone: '9845612307',
    whatsapp: '9845612307',
    telegram: '987654321',
    email: 'siva@tilescrm.com',
    aadhaar: '3214 5698 7412',
    username: 'siva02',
    passcode: '5678',
    status: 'Active',
    workingHours: '08:30 AM - 06:30 PM',
    shiftHours: 10,
    workingDays: '6 Days (Mon - Sat)',
    joinDate: '2025-03-01',
    attendance: []
  }
]
if (!fs.existsSync(STAFF_FILE)) {
  fs.writeFileSync(STAFF_FILE, JSON.stringify(INITIAL_STAFF, null, 2), 'utf-8')
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

const getLocalStaff = () => {
  try { return JSON.parse(fs.readFileSync(STAFF_FILE, 'utf-8')) }
  catch { return [] }
}

const saveLocalStaff = (staff) => {
  fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2), 'utf-8')
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

// ─── Offline-First Auto-Sync Engine ──────────────────────────────────────────
const getSyncQueue = () => {
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) } catch { return [] }
}
const saveSyncQueue = (q) => {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2), 'utf-8')
}

// Low-level sync executor
const syncRecordToSupabase = async (table, action, record) => {
  if (!supabase) return
  if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', record.id)
    if (error) throw error
    return
  }
  // Upsert
  let row = record
  if (table === 'leads') {
    row = mapToPostgres(record, true)
  }
  const { error } = await supabase.from(table).upsert([row])
  if (error) throw error
}

// Enqueue or execute sync: tries immediate sync; on network/server error, queues for auto-retry
const enqueueSync = (table, action, record) => {
  if (!supabase) return
  syncRecordToSupabase(table, action, record)
    .then(() => {
      console.log(`☁️  Synced ${table} ${record.id || ''} → Supabase`)
    })
    .catch((err) => {
      console.warn(`⚠️  Offline / Network failure (${err.message}). Queued ${table} ${record.id || ''} for auto-sync.`);
      const q = getSyncQueue()
      q.push({ table, action, record, timestamp: Date.now() })
      saveSyncQueue(q)
    })
}

// Background queue processor (auto-syncs whenever connection is restored)
const processSyncQueue = async () => {
  if (!supabase) return
  const q = getSyncQueue()
  if (q.length === 0) return

  const remaining = []
  let syncedCount = 0

  for (let i = 0; i < q.length; i++) {
    const item = q[i]
    try {
      await syncRecordToSupabase(item.table, item.action, item.record)
      syncedCount++
    } catch (err) {
      // Still offline or failed, retain rest of queue for next attempt
      remaining.push(...q.slice(i))
      break
    }
  }

  saveSyncQueue(remaining)
  if (syncedCount > 0) {
    console.log(`☁️  [Auto-Sync] Connection restored! Synced ${syncedCount} queued offline records to Supabase. (${remaining.length} pending)`)
  }
}

// Check and flush offline queue every 20 seconds
setInterval(processSyncQueue, 20000)

// Pull latest Supabase data on startup to refresh local cache
const refreshLocalFromCloud = async () => {
  if (!supabase) return
  try {
    const { data, error } = await supabase.from('leads').select('*').order('date', { ascending: false })
    if (error) { console.warn('⚠️  Startup cloud refresh failed:', error.message); return }
    const mapped = data.map(mapFromPostgres)
    saveLocalLeads(mapped)
    console.log(`☁️  Local cache refreshed from Supabase (${mapped.length} leads)`)
    // Also process any pending offline queue items
    processSyncQueue()
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

  // ☁️ Offline-safe sync to Supabase
  enqueueSync('leads', 'upsert', newLead)
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

  // ☁️ Offline-safe sync to Supabase
  enqueueSync('leads', 'upsert', updatedLead)
})

// ─── DELETE /api/leads/:id ─────────────────────────────────────────────────────
app.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params

  // ⚡ Remove locally first → instant response
  const localLeads = getLocalLeads()
  saveLocalLeads(localLeads.filter(l => l.id !== id))
  res.json({ success: true, id })
  console.log(`⚡ Deleted ${id} locally`)

  // ☁️ Offline-safe sync to Supabase
  enqueueSync('leads', 'delete', { id })
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
  enqueueSync('orders', 'upsert', newOrder)
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
  enqueueSync('orders', 'upsert', updatedOrder)
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
  enqueueSync('customers', 'upsert', newCustomer)
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
  enqueueSync('customers', 'upsert', updatedCustomer)
})

// ─── DELETE /api/customers/:id ──────────────────────────────────────────────────
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params
  const localCustomers = getLocalCustomers()
  saveLocalCustomers(localCustomers.filter(c => c.id !== id))
  res.json({ success: true, id })
  console.log(`⚡ Deleted customer ${id} locally`)
  enqueueSync('customers', 'delete', { id })
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
  enqueueSync('products', 'upsert', newProduct)
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
  enqueueSync('products', 'upsert', updatedProduct)
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

// ─── GET /api/staff ─────────────────────────────────────────────────────────────
app.get('/api/staff', (req, res) => {
  res.json(getLocalStaff())
})

// ─── POST /api/staff ────────────────────────────────────────────────────────────
app.post('/api/staff', (req, res) => {
  const newMember = req.body
  const staff = getLocalStaff()
  if (!newMember.id) {
    const nextNum = staff.length + 1
    newMember.id = `STF-${String(nextNum).padStart(3, '0')}`
  }
  if (!newMember.attendance) newMember.attendance = []
  staff.push(newMember)
  saveLocalStaff(staff)
  res.status(201).json(newMember)
  console.log(`⚡ Added staff member ${newMember.id} (${newMember.name})`)
})

// ─── PUT /api/staff/:id ─────────────────────────────────────────────────────────
app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params
  const updated = req.body
  const staff = getLocalStaff()
  const idx = staff.findIndex(s => s.id === id)
  if (idx !== -1) {
    staff[idx] = { ...staff[idx], ...updated }
    saveLocalStaff(staff)
    res.json(staff[idx])
    console.log(`⚡ Updated staff member ${id}`)
  } else {
    res.status(404).json({ error: 'Staff member not found' })
  }
})

// ─── DELETE /api/staff/:id ──────────────────────────────────────────────────────
app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params
  const staff = getLocalStaff()
  const filtered = staff.filter(s => s.id !== id)
  saveLocalStaff(filtered)
  res.json({ success: true, id })
  console.log(`⚡ Deleted staff member ${id}`)
})

// ─── POST /api/staff/:id/attendance ───────────────────────────────────────────
app.post('/api/staff/:id/attendance', (req, res) => {
  const { id } = req.params
  const record = req.body // { date, checkIn, checkOut, totalHours, status, notes }
  const staff = getLocalStaff()
  const member = staff.find(s => s.id === id)
  if (member) {
    if (!member.attendance) member.attendance = []
    const existingIdx = member.attendance.findIndex(a => a.date === record.date)
    if (existingIdx !== -1) {
      member.attendance[existingIdx] = { ...member.attendance[existingIdx], ...record }
    } else {
      member.attendance.unshift(record)
    }
    saveLocalStaff(staff)
    res.json(member)
    console.log(`⚡ Logged attendance for staff ${id} on ${record.date}`)
  } else {
    res.status(404).json({ error: 'Staff member not found' })
  }
})

// Helper to calculate exact hours worked between two time strings
function calcHoursBetween(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr || checkOutStr === 'In Progress') return 0
  const parseMins = (str) => {
    const m = String(str).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!m) return null
    let [_, h, min, p] = m
    h = parseInt(h)
    min = parseInt(min)
    if (p.toUpperCase() === 'PM' && h < 12) h += 12
    if (p.toUpperCase() === 'AM' && h === 12) h = 0
    return h * 60 + min
  }
  const start = parseMins(checkInStr)
  const end = parseMins(checkOutStr)
  if (start === null || end === null) return 0

  let diffMins = end - start
  if (diffMins < 0) diffMins += 24 * 60
  return parseFloat((diffMins / 60).toFixed(1))
}

// ─── POST /api/staff/punch-in (Morning Login) ──────────────────────────────
app.post('/api/staff/punch-in', (req, res) => {
  const { staffId, passcode, date, checkIn, notes } = req.body
  const staff = getLocalStaff()
  const member = staff.find(s => s.id === staffId || s.username === staffId)
  if (!member) {
    return res.status(404).json({ error: 'Staff member not found.' })
  }
  // Verify passcode
  if (member.passcode && member.passcode !== passcode) {
    return res.status(401).json({ error: 'Incorrect passcode. Please try again.' })
  }

  if (!member.attendance) member.attendance = []
  const todayStr = date || new Date().toISOString().split('T')[0]
  const timeStr = checkIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  const existingIdx = member.attendance.findIndex(a => a.date === todayStr)
  if (existingIdx !== -1) {
    const existing = member.attendance[existingIdx]
    // Already signed in & still working — block duplicate
    if (existing.checkIn && existing.checkOut === 'In Progress') {
      return res.status(400).json({
        error: `${member.name} already signed in today at ${existing.checkIn}. Cannot sign in again!`
      })
    }
    // Already signed off — allow re-sign-in (break / permission return)
    member.attendance[existingIdx].checkIn = timeStr
    member.attendance[existingIdx].checkOut = 'In Progress'
    member.attendance[existingIdx].status = 'Working'
    member.attendance[existingIdx].totalHours = 0
    if (notes) member.attendance[existingIdx].notes = notes || 'Re-signed in after break'
  } else {
    member.attendance.unshift({
      date: todayStr,
      checkIn: timeStr,
      checkOut: 'In Progress',
      totalHours: 0,
      status: 'Working',
      notes: notes || 'Morning Sign-In'
    })
  }
  saveLocalStaff(staff)
  console.log(`⚡ Staff Sign-In: ${member.name} (${member.id}) at ${timeStr}`)
  res.json({ success: true, member, message: `Welcome ${member.name}! Signed in at ${timeStr}` })
})

// ─── POST /api/staff/punch-out (Evening Sign-Off) ───────────────────────────
app.post('/api/staff/punch-out', (req, res) => {
  const { staffId, passcode, date, checkOut, notes } = req.body
  const staff = getLocalStaff()
  const member = staff.find(s => s.id === staffId || s.username === staffId)
  if (!member) {
    return res.status(404).json({ error: 'Staff member not found.' })
  }
  // Verify passcode
  if (member.passcode && member.passcode !== passcode) {
    return res.status(401).json({ error: 'Incorrect passcode. Please try again.' })
  }

  if (!member.attendance) member.attendance = []
  const todayStr = date || new Date().toISOString().split('T')[0]
  const timeStr = checkOut || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  const existingIdx = member.attendance.findIndex(a => a.date === todayStr)
  if (existingIdx === -1 || !member.attendance[existingIdx].checkIn || member.attendance[existingIdx].checkIn === '—') {
    return res.status(400).json({
      error: `${member.name} HAS NOT signed in today yet! Must sign in first.`
    })
  }

  const existing = member.attendance[existingIdx]
  if (existing.checkOut && existing.checkOut !== 'In Progress') {
    return res.status(400).json({
      error: `${member.name} has ALREADY signed off for today at ${existing.checkOut}.`
    })
  }

  const cIn = existing.checkIn || '09:00 AM'
  member.attendance[existingIdx].checkOut = timeStr
  member.attendance[existingIdx].status = 'Completed Day'
  member.attendance[existingIdx].totalHours = calcHoursBetween(cIn, timeStr)
  if (notes) member.attendance[existingIdx].notes = notes

  saveLocalStaff(staff)
  console.log(`⚡ Staff Sign-Off: ${member.name} (${member.id}) at ${timeStr}`)
  res.json({ success: true, member, message: `Goodbye ${member.name}! Signed off at ${timeStr}` })
})

// ─── POST /api/staff/:id/incentives (Add Incentive Record) ──────────────────
app.post('/api/staff/:id/incentives', (req, res) => {
  const { id } = req.params
  const { clientName, date, purchaseValue, incentiveAmount, notes } = req.body
  const staff = getLocalStaff()
  const member = staff.find(s => s.id === id)
  if (!member) {
    return res.status(404).json({ error: 'Staff member not found.' })
  }
  if (!member.incentives) member.incentives = []
  const record = {
    id: `INC-${Date.now()}`,
    clientName: clientName || '',
    date: date || new Date().toISOString().split('T')[0],
    purchaseValue: parseFloat(purchaseValue) || 0,
    incentiveAmount: parseFloat(incentiveAmount) || 0,
    notes: notes || '',
    createdAt: new Date().toISOString()
  }
  member.incentives.unshift(record)
  saveLocalStaff(staff)
  console.log(`⚡ Incentive added for ${member.name}: ₹${record.incentiveAmount} (Client: ${record.clientName})`)
  res.json({ success: true, member, record })
})

// ─── DELETE /api/staff/:id/incentives/:incId ────────────────────────────────
app.delete('/api/staff/:id/incentives/:incId', (req, res) => {
  const { id, incId } = req.params
  const staff = getLocalStaff()
  const member = staff.find(s => s.id === id)
  if (!member) {
    return res.status(404).json({ error: 'Staff member not found.' })
  }
  member.incentives = (member.incentives || []).filter(inc => inc.id !== incId)
  saveLocalStaff(staff)
  console.log(`⚡ Incentive ${incId} deleted for ${member.name}`)
  res.json({ success: true, member })
})

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

// ─── Chat Message Endpoints ──────────────────────────────────────────────────
function getChatMessages() {
  try {
    return JSON.parse(fs.readFileSync(CHAT_FILE, 'utf-8'))
  } catch (err) {
    return []
  }
}
function saveChatMessages(messages) {
  fs.writeFileSync(CHAT_FILE, JSON.stringify(messages, null, 2), 'utf-8')
}

app.get('/api/chat/messages', (req, res) => {
  res.json(getChatMessages())
})

app.post('/api/chat/messages', (req, res) => {
  const { senderId, senderName, recipientId, message } = req.body
  if (!senderId || !senderName || !message) {
    return res.status(400).json({ error: 'Missing senderId, senderName, or message' })
  }
  const messages = getChatMessages()
  const newMessage = {
    id: `MSG-${Date.now()}`,
    senderId,
    senderName,
    recipientId: recipientId || 'group',
    message,
    timestamp: new Date().toISOString()
  }
  messages.push(newMessage)
  if (messages.length > 300) {
    messages.shift()
  }
  saveChatMessages(messages)
  res.json({ success: true, message: newMessage })
})

// ─── Sales Returns Endpoints ──────────────────────────────────────────────────
function getLocalReturns() {
  try {
    return JSON.parse(fs.readFileSync(RETURNS_FILE, 'utf-8'))
  } catch (err) {
    return []
  }
}
function saveLocalReturns(returns) {
  fs.writeFileSync(RETURNS_FILE, JSON.stringify(returns, null, 2), 'utf-8')
}

const RETURN_REASONS = ['Over Bought', 'Broken', 'Batch Variant', 'Wrong Item Delivered', 'Quality Issue']

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function findOrderByBillNo(billNo) {
  const query = normalizeKey(billNo)
  if (!query) return null
  return getLocalOrders().find(order => normalizeKey(order.id) === query) || null
}

function findProductForReturnItem(item, products = getLocalProducts()) {
  const itemKey = normalizeKey(item.description || item.productName || item.product_name)
  const productId = item.productId || item.selectedId

  return products.find(product => {
    if (productId && product.id === productId) return true
    const productKey = normalizeKey(`${product.name || ''} ${product.size || ''}`)
    const nameKey = normalizeKey(product.name)
    return productKey && (itemKey === productKey || itemKey.includes(productKey) || (nameKey && itemKey.includes(nameKey)))
  }) || null
}

function buildReturnableOrder(order, returns = getLocalReturns()) {
  const itemsList = Array.isArray(order?.itemsList) ? order.itemsList : []
  const returnedByItem = new Map()

  returns
    .filter(ret => normalizeKey(ret.billNo) === normalizeKey(order.id))
    .forEach(ret => {
      ;(ret.items || []).forEach(item => {
        const key = normalizeKey(item.description || item.productName || item.product_name)
        returnedByItem.set(key, (returnedByItem.get(key) || 0) + (parseInt(item.quantity) || 0))
      })
    })

  return {
    billNo: order.id,
    orderId: order.id,
    customerName: order.customer || '',
    phone: order.phone || '',
    location: order.location || '',
    date: order.date || '',
    delivery: order.delivery || '',
    total: order.total || '',
    status: order.status || '',
    items: itemsList.map((item, idx) => {
      const description = item.description || item.productName || item.product_name || `Item ${idx + 1}`
      const purchasedQty = parseInt(item.quantity) || 0
      const alreadyReturned = returnedByItem.get(normalizeKey(description)) || 0
      const product = findProductForReturnItem(item)
      return {
        lineId: normalizeKey(description) || `line-${idx + 1}`,
        description,
        productId: product?.id || item.productId || '',
        productName: product?.name || description,
        size: product?.size || item.size || '',
        unit: item.unit || product?.unit || 'Boxes',
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
        purchasedQty,
        alreadyReturned,
        remainingQty: Math.max(purchasedQty - alreadyReturned, 0)
      }
    })
  }
}

app.get('/api/returns', (req, res) => {
  res.json(getLocalReturns())
})

app.get('/api/returns/lookup/:billNo', (req, res) => {
  const order = findOrderByBillNo(req.params.billNo)
  if (!order) {
    return res.status(404).json({ error: 'Bill / Order number not found. Return can be created only from purchased order items.' })
  }
  res.json(buildReturnableOrder(order))
})

app.post('/api/returns', (req, res) => {
  const { billNo, customerName, date, returnReason, items, notes, totalRefund } = req.body

  if (!billNo || !String(billNo).trim()) {
    return res.status(400).json({ error: 'Bill No (Invoice / Order Number) is strictly mandatory for return!' })
  }
  if (!returnReason || !String(returnReason).trim()) {
    return res.status(400).json({ error: 'Return Reason is strictly mandatory!' })
  }
  if (!RETURN_REASONS.includes(returnReason.trim())) {
    return res.status(400).json({ error: 'Please select a valid return reason.' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Select at least one purchased item to return.' })
  }

  const order = findOrderByBillNo(billNo)
  if (!order) {
    return res.status(404).json({ error: 'Bill / Order number not found. Return can be created only from purchased order items.' })
  }

  const returns = getLocalReturns()
  const returnableOrder = buildReturnableOrder(order, returns)
  const orderItemsByLine = new Map(returnableOrder.items.map(item => [item.lineId, item]))
  const cleanItems = []

  for (const item of items) {
    const lineId = item.lineId || normalizeKey(item.description || item.productName || item.product_name)
    const purchasedItem = orderItemsByLine.get(lineId)
    const qty = parseInt(item.quantity || item.boxes) || 0

    if (!purchasedItem) {
      return res.status(400).json({ error: `"${item.description || item.productName || 'Item'}" is not present in this bill.` })
    }
    if (qty <= 0) {
      return res.status(400).json({ error: `Return quantity must be greater than 0 for "${purchasedItem.description}".` })
    }
    if (qty > purchasedItem.remainingQty) {
      return res.status(400).json({ error: `Return quantity for "${purchasedItem.description}" cannot exceed remaining purchased quantity (${purchasedItem.remainingQty}).` })
    }

    cleanItems.push({
      lineId: purchasedItem.lineId,
      description: purchasedItem.description,
      productId: purchasedItem.productId,
      productName: purchasedItem.productName,
      size: purchasedItem.size,
      unit: purchasedItem.unit,
      rate: purchasedItem.rate,
      quantity: qty,
      amount: qty * (parseFloat(purchasedItem.rate) || 0)
    })
  }

  const isBroken = returnReason.toLowerCase().includes('broken')

  const newReturn = {
    id: `RET-${Date.now()}`,
    billNo: order.id,
    customerName: order.customer || customerName || 'Walk-in Customer',
    phone: order.phone || '',
    location: order.location || '',
    date: date || new Date().toISOString().split('T')[0],
    returnReason: returnReason.trim(),
    stockRestocked: !isBroken,
    items: cleanItems,
    notes: notes || '',
    totalRefund: parseFloat(totalRefund) || cleanItems.reduce((sum, item) => sum + item.amount, 0),
    createdAt: new Date().toISOString()
  }

  // Stock Adjustment Rule:
  // If NOT broken, add returned box quantities back to product stock in data/products.json!
  if (!isBroken && cleanItems.length > 0) {
    const products = getLocalProducts()
    let stockUpdated = false

    cleanItems.forEach(item => {
      const boxesToReturn = parseInt(item.quantity) || 0
      if (boxesToReturn > 0) {
        const prod = products.find(p => p.id === item.productId) || findProductForReturnItem(item, products)
        if (prod) {
          prod.stock = (parseInt(prod.stock) || 0) + boxesToReturn
          prod.available = (parseInt(prod.available) || 0) + boxesToReturn
          stockUpdated = true
          console.log(`📦 Restocked product ${prod.id} (${prod.name}): +${boxesToReturn} boxes (New Stock: ${prod.stock})`)
        }
      }
    })

    if (stockUpdated) {
      saveLocalProducts(products)
    }
  } else if (isBroken) {
    console.log(`⚠️ Return reason is BROKEN. Products will NOT be added back to stock inventory.`)
  }

  returns.unshift(newReturn)
  saveLocalReturns(returns)
  res.status(201).json(newReturn)
  enqueueSync('returns', 'upsert', newReturn)
})

app.delete('/api/returns/:id', (req, res) => {
  const { id } = req.params
  let returns = getLocalReturns()
  returns = returns.filter(r => r.id !== id)
  saveLocalReturns(returns)
  res.json({ success: true, message: `Return ${id} deleted` })
  enqueueSync('returns', 'delete', { id })
})

// ─── Referral System Endpoints ────────────────────────────────────────────────
function getLocalReferrals() {
  try {
    return JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf-8'))
  } catch (err) {
    return []
  }
}
function saveLocalReferrals(referrals) {
  fs.writeFileSync(REFERRALS_FILE, JSON.stringify(referrals, null, 2), 'utf-8')
}

// GET /api/referrals
app.get('/api/referrals', (req, res) => {
  res.json(getLocalReferrals())
})

// POST /api/referrals (Create Referral Partner)
app.post('/api/referrals', (req, res) => {
  const { name, category, phone, whatsapp, location, commissionType, commissionValue, upiId, notes } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Partner Name is required.' })
  }
  const referrals = getLocalReferrals()
  const nextNum = referrals.length + 1
  const newPartner = {
    id: `REF-${String(nextNum).padStart(3, '0')}`,
    name: name.trim(),
    category: category || 'Mestri / Mason',
    phone: phone || '',
    whatsapp: whatsapp || phone || '',
    location: location || '',
    commissionType: commissionType || 'Percentage',
    commissionValue: parseFloat(commissionValue) || 3,
    upiId: upiId || '',
    notes: notes || '',
    status: 'Active',
    createdDate: new Date().toISOString().split('T')[0],
    payouts: [],
    referredOrders: []
  }
  referrals.unshift(newPartner)
  saveLocalReferrals(referrals)
  console.log(`⚡ Created referral partner ${newPartner.id} (${newPartner.name})`)
  res.status(201).json(newPartner)
  enqueueSync('referrals', 'upsert', newPartner)
})

// PUT /api/referrals/:id (Update Referral Partner)
app.put('/api/referrals/:id', (req, res) => {
  const { id } = req.params
  const updatedData = req.body
  const referrals = getLocalReferrals()
  const idx = referrals.findIndex(r => r.id === id)
  if (idx !== -1) {
    referrals[idx] = { ...referrals[idx], ...updatedData }
    saveLocalReferrals(referrals)
    res.json(referrals[idx])
    enqueueSync('referrals', 'upsert', referrals[idx])
  } else {
    res.status(404).json({ error: 'Referral partner not found' })
  }
})

// DELETE /api/referrals/:id
app.delete('/api/referrals/:id', (req, res) => {
  const { id } = req.params
  let referrals = getLocalReferrals()
  referrals = referrals.filter(r => r.id !== id)
  saveLocalReferrals(referrals)
  res.json({ success: true, message: `Referral partner ${id} deleted` })
  enqueueSync('referrals', 'delete', { id })
})

// POST /api/referrals/:id/orders (Link Referred Client Order)
app.post('/api/referrals/:id/orders', (req, res) => {
  const { id } = req.params
  const { orderId, clientName, date, orderAmount, commissionAmount } = req.body
  const referrals = getLocalReferrals()
  const partner = referrals.find(r => r.id === id)
  if (!partner) return res.status(404).json({ error: 'Referral partner not found' })

  if (!partner.referredOrders) partner.referredOrders = []
  const newOrderEntry = {
    id: `REFORD-${Date.now()}`,
    orderId: orderId || 'CUSTOM',
    clientName: clientName || 'Client Order',
    date: date || new Date().toISOString().split('T')[0],
    orderAmount: parseFloat(orderAmount) || 0,
    commissionAmount: parseFloat(commissionAmount) || 0,
    status: 'Approved'
  }
  partner.referredOrders.unshift(newOrderEntry)
  saveLocalReferrals(referrals)
  console.log(`⚡ Linked referred order for ${partner.name}: ₹${newOrderEntry.commissionAmount} commission`)
  res.json({ success: true, partner, newOrderEntry })
  enqueueSync('referrals', 'upsert', partner)
})

// POST /api/referrals/:id/payouts (Record Commission Payout)
app.post('/api/referrals/:id/payouts', (req, res) => {
  const { id } = req.params
  const { date, amount, mode, notes } = req.body
  const referrals = getLocalReferrals()
  const partner = referrals.find(r => r.id === id)
  if (!partner) return res.status(404).json({ error: 'Referral partner not found' })

  if (!partner.payouts) partner.payouts = []
  const payoutEntry = {
    id: `PAY-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    amount: parseFloat(amount) || 0,
    mode: mode || 'UPI',
    notes: notes || 'Commission payout'
  }
  partner.payouts.unshift(payoutEntry)
  saveLocalReferrals(referrals)
  console.log(`⚡ Recorded payout of ₹${payoutEntry.amount} for ${partner.name}`)
  res.json({ success: true, partner, payoutEntry })
  enqueueSync('referrals', 'upsert', partner)
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
