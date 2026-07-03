import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = 5001

// Setup local directories (as offline backup)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const LEADS_FILE = path.join(DATA_DIR, 'leads.json')

// Supabase configuration
const SUPABASE_URL = 'https://emiwizejpibhvdoylbmb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaXdpemVqcGliaHZkb3lsYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzMzNTIsImV4cCI6MjA5ODY0OTM1Mn0.St_S4-7vGvLgsc41DVCbtMA_HBTe-bSmka_-fjndTis'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Enable CORS and JSON parsing
app.use(cors())
app.use(express.json())

// Ensure backup folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

const INITIAL_LEADS = [
  { id:'L001', date:'2026-07-03', name:'Aravind Kumar',        phone:'9876543210', location:'Gandhipuram',      lat:11.0172, lng:76.9561, km:0.5,  source:'Google',          size:'1500+', budget:'Medium', houseType:'New',        custType:'Owner',     stage:'Immediate',           priority:'High',   status:'New Entry',        nextDate:'2026-07-05', expectedAmt:'₹80,000',  remarks:'Wants premium wood finish tiles.' },
  { id:'L002', date:'2026-07-02', name:'Suresh Constructions', phone:'9845612307', location:'Peelamedu',        lat:11.0300, lng:77.0200, km:6.2,  source:'Engineer',        size:'2500+', budget:'High',   houseType:'New',        custType:'Builder',   stage:'Flooring Stage',      priority:'High',   status:'Keep Tracking 2x', nextDate:'2026-07-04', expectedAmt:'₹3,20,000', remarks:'Looking for imported marble.' },
  { id:'L003', date:'2026-07-01', name:'Meena Rajan',          phone:'9003344556', location:'RS Puram',         lat:11.0140, lng:76.9420, km:1.2,  source:'Walk In',         size:'750+',  budget:'Low',    houseType:'Renovation', custType:'Owner',     stage:'Planning',            priority:'Low',    status:'Lost Customer',    nextDate:'',           expectedAmt:'₹30,000',  remarks:'Price too high. Went elsewhere.' },
  { id:'L004', date:'2026-06-30', name:'Devi Architects',      phone:'9988776655', location:'Saravanampatti',   lat:11.0680, lng:77.0200, km:8.5,  source:'Social Media',    size:'2000+', budget:'High',   houseType:'New',        custType:'Architect', stage:'Construction Started', priority:'Medium', status:'Keep Tracking 3x', nextDate:'2026-07-06', expectedAmt:'₹2,10,000', remarks:'Interested in large format slabs.' },
  { id:'L005', date:'2026-06-29', name:'Karthik Homes',        phone:'9444123456', location:'Thudiyalur',       lat:11.0800, lng:76.9700, km:7.2,  source:'Tv Ad',           size:'500+',  budget:'Low',    houseType:'Renovation', custType:'Owner',     stage:'Immediate',           priority:'Medium', status:'Customer Bought',  nextDate:'',           expectedAmt:'₹22,000',  remarks:'Bought bathroom tiles set.' },
  { id:'L006', date:'2026-06-28', name:'Ibrahim Kutty',        phone:'9894002233', location:'Karumathampatti',  lat:11.0900, lng:77.1100, km:24.6, source:'Mestri',          size:'1000+', budget:'Low',    houseType:'New',        custType:'Owner',     stage:'Flooring Stage',      priority:'High',   status:'Keep Tracking 4x', nextDate:'2026-07-03', expectedAmt:'₹55,000',  remarks:'Mestri Ramu referred. Needs discount.' },
]

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8')
}

// Local File DB helper
const getLocalLeads = () => {
  try {
    const data = fs.readFileSync(LEADS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

const saveLocalLeads = (leads) => {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8')
}

// Mappers to handle PostgreSQL case-insensitive/lowercase naming convention vs frontend camelCase
const mapToPostgres = (lead) => {
  return {
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
    remarks: lead.remarks || null
  }
}

const mapFromPostgres = (lead) => {
  return {
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
    remarks: lead.remarks || ''
  }
}

// API Routes
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.warn("⚠️ Supabase Fetch Error (falling back to local):", error.message)
      return res.json(getLocalLeads())
    }

    console.log(`✅ Fetched ${data.length} leads from Supabase.`)
    
    // Map Postgres lowercase keys to camelCase keys for React frontend
    const mapped = data.map(mapFromPostgres)
    
    // Update local backup with Supabase data to stay sync
    saveLocalLeads(mapped)
    res.json(mapped)
  } catch (err) {
    console.warn("⚠️ Express Server Error (falling back to local):", err.message)
    res.json(getLocalLeads())
  }
})

app.post('/api/leads', async (req, res) => {
  const newLead = req.body
  const postgresLead = mapToPostgres(newLead)

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([postgresLead])
      .select()

    if (error) {
      throw new Error(error.message)
    }

    console.log("✅ Successfully saved new lead to Supabase.")
    
    // Save to local backup in camelCase format
    const localLeads = getLocalLeads()
    localLeads.unshift(newLead)
    saveLocalLeads(localLeads)

    res.status(201).json(newLead)
  } catch (err) {
    console.warn("⚠️ Supabase Save Error (saved to local backup instead):", err.message)
    
    // Save to local backup in camelCase format
    const localLeads = getLocalLeads()
    localLeads.unshift(newLead)
    saveLocalLeads(localLeads)
    
    res.status(201).json(newLead)
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
})
