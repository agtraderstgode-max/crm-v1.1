import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const PORT = 5001

// Setup directories
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const LEADS_FILE = path.join(DATA_DIR, 'leads.json')

// Enable CORS and JSON parsing
app.use(cors())
app.use(express.json())

// Ensure data folder and files exist
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

// Read leads helper
const getLeads = () => {
  try {
    const data = fs.readFileSync(LEADS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

// Write leads helper
const saveLeads = (leads) => {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8')
}

// API Routes
app.get('/api/leads', (req, res) => {
  res.json(getLeads())
})

app.post('/api/leads', (req, res) => {
  const newLead = req.body
  const leads = getLeads()
  leads.unshift(newLead)
  saveLeads(leads)
  res.status(201).json(newLead)
})

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
})
