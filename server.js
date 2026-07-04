import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

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

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8')
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(INITIAL_ORDERS, null, 2), 'utf-8')
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

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)

  // On startup: silently pull latest cloud data so local cache is up-to-date
  if (!USE_CLOUD) {
    console.log('🔄 Refreshing local cache from Supabase in background...')
    refreshLocalFromCloud()
  }
})
