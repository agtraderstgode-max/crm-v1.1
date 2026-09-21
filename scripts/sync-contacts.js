import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// Load .env
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(rootDir, '.env'))) {
    process.loadEnvFile(path.join(rootDir, '.env'))
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fyycsuprnwpacbsiyzrt.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_9YNgEYYtwKsklAorPWj-xA_z7mUS_kk'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const contactsFile = path.join(rootDir, 'data', 'contacts.json')
const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'))

const mapContactToPostgres = (c) => ({
  id: c.id,
  name: c.name,
  type: c.type || c.category || 'Tile Layer',
  category: c.category || c.type || 'Tile Layer',
  phone: c.phone || '',
  whatsapp: c.whatsapp || '',
  email: c.email || '',
  company: c.company || '',
  location: c.location || '',
  address: c.address || '',
  experience: c.experience || '',
  specialization: c.specialization || '',
  quote: c.quote || '',
  notes: c.notes || '',
  status: c.status || 'Active',
  totalreferrals: Number(c.totalReferrals ?? c.totalreferrals ?? (c.referrals?.length || 0)),
  totalsales: Number(c.totalSales ?? c.totalsales ?? 0),
  totalcommission: Number(c.totalCommission ?? c.totalcommission ?? 0),
  bonus: Number(c.bonus ?? 0),
  avatarcolor: c.avatarColor || c.avatarcolor || 'bg-purple-500 text-white',
  referrals: Array.isArray(c.referrals) ? c.referrals : [],
  commissionhistory: Array.isArray(c.commissionHistory ?? c.commissionhistory) ? (c.commissionHistory ?? c.commissionhistory) : [],
  bonushistory: Array.isArray(c.bonusHistory ?? c.bonushistory) ? (c.bonusHistory ?? c.bonushistory) : [],
  documents: Array.isArray(c.documents) ? c.documents : []
})

async function run() {
  console.log(`📡 Connecting to Supabase at: ${SUPABASE_URL}`)
  console.log(`📦 Found ${contacts.length} cleaned contacts locally in data/contacts.json`)

  // 1. Check if public.contacts table exists in Supabase
  const { data, error } = await supabase.from('contacts').select('id').limit(1)

  if (error) {
    console.error(`❌ Supabase error:`, error.message)
    console.error(`Code:`, error.code)
    console.error(`Details:`, error.details)
    console.error(`Hint:`, error.hint)
    return { success: false, error }
  }

  console.log(`✅ Table 'contacts' exists in Supabase schema cache!`)

  // 2. Upsert contacts
  const rows = contacts.map(mapContactToPostgres)
  const { data: upsertData, error: upsertError } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'id' })
    .select()

  if (upsertError) {
    console.error(`❌ Failed to upsert contacts:`, upsertError.message)
    return { success: false, error: upsertError }
  }

  console.log(`🎉 Successfully synced ${rows.length} contacts to Supabase!`)
  console.log(`Sample synced IDs:`, rows.map(r => r.id).join(', '))
  return { success: true }
}

run()
