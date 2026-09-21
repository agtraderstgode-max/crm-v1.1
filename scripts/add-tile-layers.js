import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const contactsFile = path.join(rootDir, 'data', 'contacts.json')

const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'))

const rawList = [
  { name: 'Arvind Varma Tile Layer', phone: '6380683300' },
  { name: 'Tiles Layer 2', phone: '8807843659' },
  { name: 'Sowrav Tile Layer', phone: '9852950460' },
  { name: 'Sowndhar Tile Layer', phone: '8825850605' },
  { name: 'Stalin Tile Layer', phone: '9976568782' },
  { name: 'Santhose Tile Layer', phone: '9600819140' },
  { name: 'Sakthivel Tile Layer', phone: '9688843779' },
  { name: 'Mithlash. Kumar Tile Layer 3', phone: '9661723405' },
  { name: 'Publu Tile Layer', phone: '9952853654' },
  { name: 'Panner Tile Layer', phone: '9698316704' },
  { name: 'Palani Tiles Layer 2 Val', phone: '9965711554' },
  { name: 'Kumar Tile Layer', phone: '9842755050' },
  { name: 'Jakab Tile Layer', phone: '9443250109' },
  { name: 'Anand Tile Layer', phone: '9791912752' },
  { name: 'Subash', phone: '9080538711' },
  { name: 'Avinash', phone: '8804341224' },
  { name: 'Jahindhar', phone: '7373429120' },
  { name: 'Pampam', phone: '9110181830' },
  { name: 'Rajesh Kumar', phone: '9486684154' },
  { name: 'Sanjith Kumar', phone: '8210994354' },
  { name: 'Sarvith', phone: '6379308788' },
  { name: 'Raja (RajesH B)', phone: '9080884119' },
  { name: 'Praveen Kumar', phone: '7010830399' },
  { name: 'Bijay', phone: '6382701127' },
  { name: 'Anil Kumar', phone: '8668170026' },
  { name: 'Ghanse', phone: '9597168093' },
  { name: 'Mantoo', phone: '8340529785' },
  { name: 'Mohan', phone: '8825961367' },
  { name: 'Ramesh', phone: '9659709124' },
  { name: 'Sakthi', phone: '9360608367' }
]

const AVATAR_COLORS = [
  'bg-purple-500 text-white',
  'bg-blue-600 text-white',
  'bg-slate-600 text-white',
  'bg-indigo-600 text-white',
  'bg-violet-400 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white'
]

// Format phone number e.g. 6380683300 -> 63806 83300
function formatPhone(p) {
  const digits = p.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return p
}

// Find next CNT ID
const existingNums = contacts.map(c => {
  const match = c.id?.match(/^CNT-(\d+)$/i)
  return match ? parseInt(match[1]) : 0
})
let nextNum = Math.max(...existingNums, 0) + 1

const newContacts = []

for (let i = 0; i < rawList.length; i++) {
  const item = rawList[i]
  const id = `CNT-${String(nextNum++).padStart(3, '0')}`
  const formattedPhone = formatPhone(item.phone)
  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]

  const contactObj = {
    id,
    name: item.name,
    type: 'Tile Layer',
    category: 'Tile Layer',
    phone: formattedPhone,
    whatsapp: formattedPhone,
    email: '',
    location: 'Tiruchengode',
    address: 'Tiruchengode & Surrounding',
    experience: '5+ years',
    specialization: 'Floor & Wall Tile Laying',
    quote: 'Experienced tile layer team',
    notes: 'Tile layer contact added to directory.',
    status: 'Active',
    totalReferrals: 0,
    totalSales: 0,
    totalCommission: 0,
    bonus: 0,
    avatarColor,
    referrals: [],
    commissionHistory: [],
    bonusHistory: [],
    documents: []
  }

  newContacts.push(contactObj)
}

contacts.push(...newContacts)

fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2), 'utf8')
console.log(`✅ Successfully added ${newContacts.length} Tile Layer contacts to data/contacts.json!`)
console.log(`Total contacts now: ${contacts.length} (IDs: CNT-001 to ${contacts[contacts.length - 1].id})`)
