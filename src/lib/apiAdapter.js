import { supabase } from './supabaseClient'
import { handleAiChatRequest } from './ai/aiOrchestrator'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function cleanNumber(val) {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

function cleanDate(val) {
  if (!val) return ''
  const str = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const dmyMatch = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
  const ymdMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`
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

export function safeJsonParse(raw) {
  if (!raw || typeof raw !== 'string') return {}

  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  const firstBrace = text.indexOf('{')
  if (firstBrace !== -1) {
    const lastBrace = text.lastIndexOf('}')
    if (lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1)
    } else {
      text = text.substring(firstBrace)
    }
  }

  const removeTrailingCommas = (str) => str.replace(/,(\s*[}\]])/g, '$1')

  try {
    return JSON.parse(text)
  } catch (e1) {
    try {
      return JSON.parse(removeTrailingCommas(text))
    } catch (e2) {
      // LLM truncated mid-stream or has dangling comma/property
      let cleaned = removeTrailingCommas(text)
      cleaned = cleaned.replace(/,\s*"[^"]*":?\s*[^,}\]]*$/, '')
      cleaned = cleaned.replace(/,\s*$/, '')

      let openBraces = 0
      let openBrackets = 0
      let inString = false
      let escape = false

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i]
        if (char === '\\' && !escape) {
          escape = true
          continue
        }
        if (char === '"' && !escape) {
          inString = !inString
        } else if (!inString) {
          if (char === '{') openBraces++
          else if (char === '}') openBraces = Math.max(0, openBraces - 1)
          else if (char === '[') openBrackets++
          else if (char === ']') openBrackets = Math.max(0, openBrackets - 1)
        }
        escape = false
      }

      while (openBrackets > 0) {
        cleaned += ']'
        openBrackets--
      }
      while (openBraces > 0) {
        cleaned += '}'
        openBraces--
      }

      try {
        return JSON.parse(removeTrailingCommas(cleaned))
      } catch (e3) {
        console.warn('safeJsonParse repair failed:', e3.message)
        throw e1
      }
    }
  }
}

// ─── MAPPERS ─────────────────────────────────────────────────────────────────
const mapStaffFromSupabase = (s) => ({
  id: s.id,
  name: s.name,
  role: s.role,
  address: s.address || '',
  phone: s.phone || '',
  whatsapp: s.whatsapp || '',
  telegram: s.telegram || '',
  email: s.email || '',
  aadhaar: s.aadhaar || '',
  username: s.username || '',
  passcode: s.passcode || '',
  status: s.status || 'Active',
  workingHours: s.workinghours || s.workingHours || '09:00 AM - 07:00 PM',
  shiftHours: s.shifthours || s.shiftHours || 10,
  workingDays: s.workingdays || s.workingDays || '6 Days (Mon - Sat)',
  joinDate: s.joindate || s.joinDate || '',
  attendance: s.attendance || [],
  incentives: s.incentives || []
})

const mapStaffToSupabase = (s) => ({
  id: s.id,
  name: s.name,
  role: s.role,
  address: s.address || '',
  phone: s.phone || '',
  whatsapp: s.whatsapp || '',
  telegram: s.telegram || '',
  email: s.email || '',
  aadhaar: s.aadhaar || '',
  username: s.username || '',
  passcode: s.passcode || '',
  status: s.status || 'Active',
  workinghours: s.workingHours || s.workinghours || '09:00 AM - 07:00 PM',
  shifthours: parseInt(s.shiftHours || s.shifthours || 10),
  workingdays: s.workingDays || s.workingdays || '6 Days (Mon - Sat)',
  joindate: s.joinDate || s.joindate || null,
  attendance: s.attendance || [],
  incentives: s.incentives || []
})

const resolveLegacyStaff = (raw) => {
  if (raw === 'Staff 1' || raw === 'STF-001') return 'Vanmathi.B'
  if (raw === 'Staff 2' || raw === 'STF-002') return 'Boopana'
  return raw || ''
}

const mapLeadFromSupabase = (l) => {
  const history = Array.isArray(l.history) ? l.history : []
  const refMeta = history.find(h => h && h.type === 'REFERRAL_MAPPING') || {}

  return {
    id: l.id,
    date: l.date || '',
    name: l.name,
    phone: l.phone,
    location: l.location || '',
    lat: l.lat || '',
    lng: l.lng || '',
    km: l.km || '',
    source: l.source || '',
    referredContactId: refMeta.contactId || l.referredContactId || '',
    referredByName: refMeta.contactName || l.referredByName || '',
    referredByPhone: refMeta.contactPhone || l.referredByPhone || '',
    referredByType: refMeta.contactType || l.referredByType || '',
    size: l.size || '',
    budget: l.budget || '',
    houseType: l.housetype || '',
    custType: l.custtype || '',
    stage: l.stage || '',
    expectedAmt: l.expectedamt || '',
    priority: l.priority || 'Medium',
    status: l.status || 'New Entry',
    nextDate: l.nextdate || '',
    withinDays: l.withindays || '',
    remarks: l.remarks || '',
    attendedBy: resolveLegacyStaff(l.attendedby),
    history
  }
}

const mapLeadToSupabase = (l) => {
  const history = Array.isArray(l.history) ? [...l.history] : []
  if (l.referredContactId || l.referredByName) {
    const existingIdx = history.findIndex(h => h && h.type === 'REFERRAL_MAPPING')
    const refEntry = {
      type: 'REFERRAL_MAPPING',
      contactId: l.referredContactId || '',
      contactName: l.referredByName || '',
      contactPhone: l.referredByPhone || '',
      contactType: l.referredByType || ''
    }
    if (existingIdx !== -1) history[existingIdx] = refEntry
    else history.unshift(refEntry)
  }

  return {
    id: l.id,
    date: l.date || null,
    name: l.name,
    phone: l.phone,
    location: l.location || null,
    lat: l.lat ? parseFloat(l.lat) : null,
    lng: l.lng ? parseFloat(l.lng) : null,
    km: l.km ? parseFloat(l.km) : null,
    source: l.source || null,
    size: l.size || null,
    budget: l.budget || null,
    housetype: l.houseType || null,
    custtype: l.custType || null,
    stage: l.stage || null,
    expectedamt: l.expectedAmt || null,
    priority: l.priority || 'Medium',
    status: l.status || 'New Entry',
    nextdate: l.nextDate || null,
    withindays: l.withinDays || null,
    remarks: l.remarks || null,
    attendedby: l.attendedBy || null,
    history
  }
}

const mapCustomerFromSupabase = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || '',
  location: c.location || '',
  custType: c.custtype || '',
  expectedAmt: c.expectedamt || '',
  attendedBy: resolveLegacyStaff(c.attendedby),
  remarks: c.remarks || '',
  source: c.source || '',
  size: c.size || '',
  houseType: c.housetype || '',
  stage: c.stage || '',
  budget: c.budget || '',
  date: c.date || ''
})

const mapCustomerToSupabase = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || null,
  location: c.location || null,
  custtype: c.custType || null,
  expectedamt: c.expectedAmt || null,
  attendedby: c.attendedBy || null,
  remarks: c.remarks || null,
  source: c.source || null,
  size: c.size || null,
  housetype: c.houseType || null,
  stage: c.stage || null,
  budget: c.budget || null,
  date: c.date || null
})

const mapContactFromSupabase = (c) => ({
  id: c.id,
  name: c.name || '',
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
  totalReferrals: Number(c.totalreferrals ?? c.totalReferrals ?? (c.referrals?.length || 0)),
  totalSales: Number(c.totalsales ?? c.totalSales ?? 0),
  totalCommission: Number(c.totalcommission ?? c.totalCommission ?? 0),
  bonus: Number(c.bonus ?? 0),
  avatarColor: c.avatarcolor || c.avatarColor || 'bg-purple-500 text-white',
  referrals: Array.isArray(c.referrals) ? c.referrals : [],
  commissionHistory: Array.isArray(c.commissionhistory ?? c.commissionHistory) ? (c.commissionhistory ?? c.commissionHistory) : [],
  bonusHistory: Array.isArray(c.bonushistory ?? c.bonusHistory) ? (c.bonushistory ?? c.bonusHistory) : [],
  documents: Array.isArray(c.documents) ? c.documents : [],
  created_at: c.created_at || c.createdAt || ''
})

const mapContactToSupabase = (c) => ({
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

const mapOrderFromSupabase = (o) => {
  let cancelReason = o.cancelReason || ''
  let paymentNotes = o.paymentnotes || ''
  let cancelledAt = o.cancelledAt || ''

  if (paymentNotes.startsWith('[CANCELLED:')) {
    const match = paymentNotes.match(/^\[CANCELLED:\s*(.*?)\](?:\s*\[AT:\s*(.*?)\])?\s*(.*)$/)
    if (match) {
      cancelReason = match[1] || cancelReason
      cancelledAt = match[2] || cancelledAt
      paymentNotes = match[3] || ''
    }
  }

  const rawSplit = Array.isArray(o.splitpayments) ? o.splitpayments : []
  const payments = rawSplit
    .filter(p => p && (parseFloat(p.amount) > 0 || p.mode))
    .map((p, idx) => ({
      id: p.id || `PAY-${o.id || 'ORD'}-${idx + 1}`,
      date: p.date || o.confirmedat || o.date || (o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString()),
      amount: parseFloat(p.amount) || 0,
      mode: p.mode || 'Cash',
      ref: p.ref || 'Order Confirmation',
      notes: p.notes || ''
    }))

  const paidAmount = payments.reduce((sum, p) => sum + (p.mode !== 'Write Off' ? p.amount : 0), 0)

  return {
    id: o.id,
    customer: o.customer,
    phone: o.phone || '',
    date: o.date || '',
    items: o.items || 0,
    total: o.total || '',
    status: o.status || 'Processing',
    delivery: o.delivery || '',
    deliveryType: o.deliverytype || '',
    transport: o.transport || '',
    vehicleInfo: o.vehicleinfo || '',
    handleBy: o.handleby || '',
    confirmedAt: o.confirmedat || '',
    dispatchedAt: o.dispatchedat || '',
    deliveredAt: o.deliveredat || '',
    splitPayments: rawSplit.length > 0 ? rawSplit : payments,
    payments,
    paidAmount,
    balanceMode: o.balancemode || '',
    paymentNotes,
    cancelReason,
    cancelledAt,
    itemsDetails: o.itemsdetails || []
  }
}

const mapOrderToSupabase = (o) => {
  let notes = o.paymentNotes || o.paymentnotes || ''
  if (o.status === 'Cancelled' && o.cancelReason) {
    const at = o.cancelledAt || new Date().toISOString()
    notes = `[CANCELLED: ${o.cancelReason}] [AT: ${at}] ${notes}`.trim()
  }

  // Consolidate payments into splitpayments JSONB column
  let finalPayments = []
  if (Array.isArray(o.payments) && o.payments.length > 0) {
    finalPayments = o.payments
  } else if (Array.isArray(o.splitPayments) && o.splitPayments.length > 0) {
    finalPayments = o.splitPayments
  } else if (Array.isArray(o.splitpayments) && o.splitpayments.length > 0) {
    finalPayments = o.splitpayments
  }

  return {
    id: o.id,
    customer: o.customer,
    phone: o.phone || null,
    date: o.date || null,
    items: parseInt(o.items) || 0,
    total: o.total || '',
    status: o.status || 'Processing',
    delivery: o.delivery || null,
    deliverytype: o.deliveryType || o.deliverytype || null,
    transport: o.transport || null,
    vehicleinfo: o.vehicleInfo || o.vehicleinfo || null,
    handleby: o.handleBy || o.handleby || null,
    confirmedat: o.confirmedAt || o.confirmedat || null,
    dispatchedat: o.dispatchedAt || o.dispatchedat || null,
    deliveredat: o.deliveredAt || o.deliveredat || null,
    splitpayments: finalPayments,
    balancemode: o.balanceMode || o.balancemode || null,
    paymentnotes: notes || null,
    itemsdetails: o.itemsDetails || o.itemsdetails || []
  }
}

const mapReturnFromSupabase = (r) => ({
  id: r.id,
  billNo: r.billno,
  customerName: r.customername,
  date: r.date,
  returnReason: r.returnreason,
  stockRestocked: r.stockrestocked,
  items: r.items || [],
  notes: r.notes || '',
  totalRefund: r.totalrefund || 0,
  createdAt: r.created_at
})

const mapReturnToSupabase = (r) => ({
  id: r.id,
  billno: r.billNo,
  customername: r.customerName || 'Customer',
  date: r.date || null,
  returnreason: r.returnReason,
  stockrestocked: !!r.stockRestocked,
  items: r.items || [],
  notes: r.notes || '',
  totalrefund: parseFloat(r.totalRefund) || 0
})

const mapReferralFromSupabase = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  phone: p.phone,
  whatsapp: p.whatsapp,
  location: p.location,
  commissionType: p.commissiontype,
  commissionValue: p.commissionvalue,
  upiId: p.upiid,
  notes: p.notes,
  status: p.status,
  createdDate: p.createddate,
  payouts: p.payouts || [],
  referredOrders: p.referredorders || []
})

const mapReferralToSupabase = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  phone: p.phone,
  whatsapp: p.whatsapp,
  location: p.location,
  commissiontype: p.commissionType,
  commissionvalue: p.commissionValue,
  upiid: p.upiId,
  notes: p.notes,
  status: p.status,
  createddate: p.createdDate || null,
  payouts: p.payouts || [],
  referredorders: p.referredOrders || []
})

const mapInvoiceToSupabase = (inv) => {
  const stockStatus = inv.stock_status || inv.stockStatus || 'pending'
  const items = (Array.isArray(inv.items) ? inv.items : []).map(item => ({
    ...item,
    _stock_status: item._stock_status || stockStatus
  }))

  return {
    id: inv.id || inv.invoice_no || `INV-${Date.now()}`,
    invoice_no: inv.invoice_no || '',
    date: inv.date ? (String(inv.date).match(/^\d{4}-\d{2}-\d{2}/) ? inv.date : null) : null,
    supplier_name: inv.supplier_name || '',
    supplier_gstin: inv.supplier_gstin || '',
    supplier_phone: inv.supplier_phone || '',
    buyer_name: inv.buyer_name || '',
    buyer_gstin: inv.buyer_gstin || '',
    gross_amount: Number(inv.gross_amount) || 0,
    tax_percent: Number(inv.tax_percent) || 0,
    gst_amount: Number(inv.gst_amount) || 0,
    total_amount: Number(inv.total_amount) || 0,
    total_qty: Number(inv.total_qty) || 0,
    total_items: Number(inv.total_items) || items.length,
    items
  }
}

const mapInvoiceFromSupabase = (row) => {
  const items = Array.isArray(row.items) ? row.items : []
  const stockStatus = items[0]?._stock_status || 'pending'

  return {
    id: row.id,
    invoice_no: row.invoice_no,
    date: row.date,
    supplier_name: row.supplier_name,
    supplier_gstin: row.supplier_gstin,
    supplier_phone: row.supplier_phone,
    buyer_name: row.buyer_name,
    buyer_gstin: row.buyer_gstin,
    gross_amount: Number(row.gross_amount) || 0,
    tax_percent: Number(row.tax_percent) || 0,
    gst_amount: Number(row.gst_amount) || 0,
    total_amount: Number(row.total_amount) || 0,
    total_qty: Number(row.total_qty) || 0,
    total_items: Number(row.total_items) || items.length,
    stock_status: stockStatus,
    items,
    created_at: row.created_at
  }
}

// ─── SUPABASE API ROUTER ─────────────────────────────────────────────────────
export async function handleApiRequest(url, options = {}) {
  const parsed = new URL(url, window.location.origin)
  const pathname = parsed.pathname
  const method = (options.method || 'GET').toUpperCase()
  let body = {}
  try {
    if (options.body) body = JSON.parse(options.body)
  } catch {}

  // ─── /api/staff ────────────────────────────────────────────────────────────
  if (pathname === '/api/staff' && method === 'GET') {
    const { data, error } = await supabase.from('staff').select('*').order('id')
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapStaffFromSupabase))
  }

  if (pathname === '/api/staff' && method === 'POST') {
    const { data: all } = await supabase.from('staff').select('id')
    const nextNum = (all || []).length + 1
    const newStaff = {
      ...body,
      id: body.id || `STF-${String(nextNum).padStart(3, '0')}`,
      status: body.status || 'Active',
      attendance: body.attendance || [],
      incentives: body.incentives || []
    }
    const { error } = await supabase.from('staff').insert([mapStaffToSupabase(newStaff)])
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse(newStaff, 201)
  }

  const staffIdMatch = pathname.match(/^\/api\/staff\/([^/]+)$/)
  if (staffIdMatch) {
    const id = staffIdMatch[1]
    if (method === 'PUT') {
      const updated = { ...body, id }
      const { error } = await supabase.from('staff').update(mapStaffToSupabase(updated)).eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse(updated)
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('staff').delete().eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ success: true, id })
    }
  }

  // Attendance & Punch
  if (pathname === '/api/staff/punch-in' && method === 'POST') {
    const { username, passcode, notes } = body
    const { data: staffList } = await supabase.from('staff').select('*')
    const staff = (staffList || []).map(mapStaffFromSupabase)
    const member = staff.find(s => s.username === username && s.passcode === passcode)
    if (!member) return jsonResponse({ error: 'Invalid username or passcode' }, 401)

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    if (!member.attendance) member.attendance = []

    const existingToday = member.attendance.find(a => a.date === today)
    if (existingToday && existingToday.checkOut === 'In Progress') {
      return jsonResponse({ error: 'Already signed in! Please sign off before signing in again.' }, 400)
    }

    member.attendance.unshift({
      date: today,
      checkIn: currentTimeStr,
      checkOut: 'In Progress',
      totalHours: 0,
      status: 'Working',
      notes: notes || 'Morning Sign-In'
    })

    await supabase.from('staff').update({ attendance: member.attendance }).eq('id', member.id)
    return jsonResponse({ success: true, member })
  }

  if (pathname === '/api/staff/punch-out' && method === 'POST') {
    const { username, passcode, notes } = body
    const { data: staffList } = await supabase.from('staff').select('*')
    const staff = (staffList || []).map(mapStaffFromSupabase)
    const member = staff.find(s => s.username === username && s.passcode === passcode)
    if (!member) return jsonResponse({ error: 'Invalid username or passcode' }, 401)

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    if (!member.attendance) member.attendance = []

    const activeEntry = member.attendance.find(a => a.date === today && a.checkOut === 'In Progress')
    if (activeEntry) {
      activeEntry.checkOut = currentTimeStr
      activeEntry.status = 'Completed Day'
      if (notes) activeEntry.notes = activeEntry.notes ? `${activeEntry.notes}; ${notes}` : notes
    } else {
      member.attendance.unshift({
        date: today,
        checkIn: currentTimeStr,
        checkOut: currentTimeStr,
        totalHours: 0,
        status: 'Completed Day',
        notes: notes || 'Direct Sign-Off'
      })
    }

    await supabase.from('staff').update({ attendance: member.attendance }).eq('id', member.id)
    return jsonResponse({ success: true, member })
  }

  const staffAttendanceMatch = pathname.match(/^\/api\/staff\/([^/]+)\/attendance$/)
  if (staffAttendanceMatch && method === 'POST') {
    const id = staffAttendanceMatch[1]
    const { data: memberData } = await supabase.from('staff').select('*').eq('id', id).single()
    if (!memberData) return jsonResponse({ error: 'Staff member not found' }, 404)
    const member = mapStaffFromSupabase(memberData)
    if (!member.attendance) member.attendance = []
    member.attendance.unshift(body)
    await supabase.from('staff').update({ attendance: member.attendance }).eq('id', id)
    return jsonResponse({ success: true, member })
  }

  const staffIncentivesMatch = pathname.match(/^\/api\/staff\/([^/]+)\/incentives$/)
  if (staffIncentivesMatch && method === 'POST') {
    const id = staffIncentivesMatch[1]
    const { data: memberData } = await supabase.from('staff').select('*').eq('id', id).single()
    if (!memberData) return jsonResponse({ error: 'Staff member not found' }, 404)
    const member = mapStaffFromSupabase(memberData)
    if (!member.incentives) member.incentives = []
    const newEntry = {
      id: `INC-${Date.now()}`,
      clientName: body.clientName || 'Direct Client',
      date: body.date || new Date().toISOString().split('T')[0],
      purchaseValue: parseFloat(body.purchaseValue) || 0,
      incentiveAmount: parseFloat(body.incentiveAmount) || 0,
      status: body.status || 'Pending Approval',
      notes: body.notes || ''
    }
    member.incentives.unshift(newEntry)
    await supabase.from('staff').update({ incentives: member.incentives }).eq('id', id)
    return jsonResponse({ success: true, member, newEntry })
  }

  // ─── /api/leads ────────────────────────────────────────────────────────────
  if (pathname === '/api/leads' && method === 'GET') {
    const { data, error } = await supabase.from('leads').select('*').order('date', { ascending: false })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapLeadFromSupabase))
  }

  if (pathname === '/api/leads' && method === 'POST') {
    const { data: all } = await supabase.from('leads').select('id')
    const nums = (all || []).map(l => {
      const match = l.id?.match(/^L(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    const newLead = {
      ...body,
      id: `L${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
    }
    const { error } = await supabase.from('leads').insert([mapLeadToSupabase(newLead)])
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse(newLead, 201)
  }

  const leadIdMatch = pathname.match(/^\/api\/leads\/([^/]+)$/)
  if (leadIdMatch) {
    const id = leadIdMatch[1]
    if (method === 'PUT') {
      const updated = { ...body, id }
      const { error } = await supabase.from('leads').update(mapLeadToSupabase(updated)).eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse(updated)
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ success: true, id })
    }
  }

  // ─── /api/customers ────────────────────────────────────────────────────────
  if (pathname === '/api/customers' && method === 'GET') {
    const { data, error } = await supabase.from('customers').select('*').order('date', { ascending: false })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapCustomerFromSupabase))
  }

  if (pathname === '/api/customers' && method === 'POST') {
    const { data: all } = await supabase.from('customers').select('id')
    const nums = (all || []).map(c => {
      const match = c.id?.match(/^C-(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    const newCust = {
      ...body,
      id: body.id || `C-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
    }
    const { error } = await supabase.from('customers').insert([mapCustomerToSupabase(newCust)])
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse(newCust, 201)
  }

  const custIdMatch = pathname.match(/^\/api\/customers\/([^/]+)$/)
  if (custIdMatch) {
    const id = custIdMatch[1]
    if (method === 'PUT') {
      const updated = { ...body, id }
      const { error } = await supabase.from('customers').update(mapCustomerToSupabase(updated)).eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse(updated)
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ success: true, id })
    }
  }

  // ─── /api/contacts ─────────────────────────────────────────────────────────
  if (pathname === '/api/contacts' && method === 'GET') {
    try {
      const { data, error } = await supabase.from('contacts').select('*').order('id', { ascending: false })
      if (error) {
        console.warn('[apiAdapter] contacts fetch warning:', error.message)
        return jsonResponse([])
      }
      return jsonResponse((data || []).map(mapContactFromSupabase))
    } catch {
      return jsonResponse([])
    }
  }

  if (pathname === '/api/contacts' && method === 'POST') {
    try {
      const { data: all } = await supabase.from('contacts').select('id')
      const nums = (all || []).map(c => {
        const match = c.id?.match(/^CNT-(\d+)$/i)
        return match ? parseInt(match[1]) : 0
      })
      const newContact = {
        ...body,
        id: body.id || `CNT-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
      }
      const { error } = await supabase.from('contacts').insert([mapContactToSupabase(newContact)])
      if (error) console.warn('[apiAdapter] contacts insert warning:', error.message)
      return jsonResponse(newContact, 201)
    } catch {
      return jsonResponse(body, 201)
    }
  }

  const contactIdMatch = pathname.match(/^\/api\/contacts\/([^/]+)$/)
  if (contactIdMatch) {
    const id = contactIdMatch[1]
    if (method === 'PUT') {
      const updated = { ...body, id }
      try {
        const { error } = await supabase.from('contacts').update(mapContactToSupabase(updated)).eq('id', id)
        if (error) console.warn('[apiAdapter] contacts update warning:', error.message)
      } catch {}
      return jsonResponse(updated)
    }
    if (method === 'DELETE') {
      try {
        const { error } = await supabase.from('contacts').delete().eq('id', id)
        if (error) console.warn('[apiAdapter] contacts delete warning:', error.message)
      } catch {}
      return jsonResponse({ success: true, id })
    }
  }

  // ─── /api/orders ───────────────────────────────────────────────────────────
  if (pathname === '/api/orders' && method === 'GET') {
    const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: false })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapOrderFromSupabase))
  }

  if (pathname === '/api/orders' && method === 'POST') {
    const { data: all } = await supabase.from('orders').select('id')
    const nums = (all || []).map(o => {
      const match = o.id?.match(/^ORD-(\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    const newOrder = {
      ...body,
      id: body.id || `ORD-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
    }
    const { error } = await supabase.from('orders').insert([mapOrderToSupabase(newOrder)])
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse(newOrder, 201)
  }

  const orderIdMatch = pathname.match(/^\/api\/orders\/([^/]+)$/)
  if (orderIdMatch) {
    const id = orderIdMatch[1]
    if (method === 'PUT') {
      const updated = { ...body, id }
      const { error } = await supabase.from('orders').update(mapOrderToSupabase(updated)).eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse(updated)
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ success: true, id })
    }
  }

function getQuotationSqft(cat, customMap = {}) {
  if (customMap && customMap[cat.id] != null) return parseFloat(customMap[cat.id]);
  if (cat.sqft_per_box_quotation != null) return parseFloat(cat.sqft_per_box_quotation);
  const size = (cat.size || '').toUpperCase().trim();
  const pcs = parseInt(cat.pcs_per_box || 0);
  const dimMatch = size.match(/(\d+)\s*[X*x]\s*(\d+)/);
  if (dimMatch && pcs > 0) {
    const w = parseFloat(dimMatch[1]);
    const h = parseFloat(dimMatch[2]);
    return Number(((w * h * pcs) / 144).toFixed(2));
  }
  if (size.includes('4 FEET') || size.includes('4FEET')) {
    if (size.includes('RISER') || (cat.name || '').toUpperCase().includes('RISER')) return 10.67;
    return 16.0;
  }
  if (size.includes('3 FEET') || size.includes('3FEET')) {
    if (size.includes('RISER') || (cat.name || '').toUpperCase().includes('RISER')) return 8.0;
    return 12.0;
  }
  return parseFloat(cat.sqft_per_box || 15.5);
}

  // ─── /api/products & /api/categories ───────────────────────────────────────
  if (pathname === '/api/products' && method === 'GET') {
    let prods = []
    let from = 0
    const pageSize = 1000
    while (true) {
      const { data } = await supabase.from('products').select('*').range(from, from + pageSize - 1)
      if (!data || data.length === 0) break
      prods = prods.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }
    const { data: cats } = await supabase.from('categories').select('*').range(0, 4999)
    const categories = cats || []
    let customMap = {}
    try {
      const { data: qSetting } = await supabase.from('settings').select('value').eq('key', 'category_quotation_sqft').maybeSingle()
      if (qSetting && qSetting.value) customMap = qSetting.value
    } catch (e) {}

    let productHsnTaxMap = {}
    try {
      const { data: taxSetting } = await supabase.from('settings').select('value').eq('key', 'product_hsn_tax_map').maybeSingle()
      if (taxSetting && taxSetting.value) productHsnTaxMap = taxSetting.value
    } catch (e) {}

    const joined = (prods || []).map(p => {
      const meta = productHsnTaxMap[p.id] || {}
      const hsn_code = p.hsn_code || meta.hsn_code || '69072300'
      const tax_percent = p.tax_percent != null ? p.tax_percent : (meta.tax_percent != null ? meta.tax_percent : 18)
      const gst_percent = p.gst_percent != null ? p.gst_percent : (meta.gst_percent != null ? meta.gst_percent : 18)
      const purchase_rate = p.purchase_rate != null ? p.purchase_rate : (meta.purchase_rate || 0)
      const brand = p.brand || meta.brand || 'KAG'

      if (p.category_id && p.category_id !== 'NO_CAT') {
        const cat = categories.find(c => c.id === p.category_id)
        if (cat) {
          return {
            ...p,
            brand,
            hsn_code,
            tax_percent,
            gst_percent,
            purchase_rate,
            mrp: cat.mrp,
            online_price: cat.online_price,
            sqft_price: cat.sqft_price,
            price: `₹${cat.sqft_price}/sqft`,
            pcs_per_box: cat.pcs_per_box,
            sqft_per_box: cat.sqft_per_box,
            sqft_per_box_quotation: getQuotationSqft(cat, customMap),
            weight_per_box: cat.weight_per_box,
            category: cat.name
          }
        }
      }
      return {
        ...p,
        brand,
        hsn_code,
        tax_percent,
        gst_percent,
        purchase_rate
      }
    })
    return jsonResponse(joined)
  }

  if (pathname === '/api/products' && method === 'POST') {
    const prodId = body.id || `TL-${Date.now().toString().slice(-4)}`
    const { hsn_code, tax_percent, gst_percent, purchase_rate, ...cleanProd } = body
    const newProduct = {
      ...cleanProd,
      id: prodId
    }
    const { error } = await supabase.from('products').insert([newProduct])
    if (error) return jsonResponse({ error: error.message }, 400)

    if (hsn_code || tax_percent || gst_percent || purchase_rate || body.brand) {
      try {
        const { data: taxSetting } = await supabase.from('settings').select('value').eq('key', 'product_hsn_tax_map').maybeSingle()
        const currentMap = taxSetting?.value || {}
        currentMap[prodId] = {
          hsn_code: hsn_code || '69072300',
          tax_percent: parseFloat(tax_percent || gst_percent) || 18,
          gst_percent: parseFloat(gst_percent || tax_percent) || 18,
          purchase_rate: parseFloat(purchase_rate) || 0,
          brand: body.brand || ''
        }
        await supabase.from('settings').upsert([{ key: 'product_hsn_tax_map', value: currentMap }], { onConflict: 'key' })
      } catch (err) {
        console.warn('Could not save product tax map:', err.message)
      }
    }

    return jsonResponse({
      ...newProduct,
      hsn_code: hsn_code || '69072300',
      tax_percent: parseFloat(tax_percent || gst_percent) || 18,
      gst_percent: parseFloat(gst_percent || tax_percent) || 18,
      purchase_rate: parseFloat(purchase_rate) || 0
    }, 201)
  }

  const productIdMatch = pathname.match(/^\/api\/products\/([^/]+)$/)
  if (productIdMatch && method === 'PUT') {
    const id = productIdMatch[1]
    const { hsn_code, tax_percent, gst_percent, purchase_rate, ...updateData } = body
    delete updateData.category // calculated field
    delete updateData.mrp
    delete updateData.online_price
    delete updateData.sqft_price
    delete updateData.pcs_per_box
    delete updateData.sqft_per_box
    delete updateData.sqft_per_box_quotation
    delete updateData.weight_per_box
    const { error } = await supabase.from('products').update(updateData).eq('id', id)
    if (error) return jsonResponse({ error: error.message }, 400)

    if (hsn_code || tax_percent || gst_percent || purchase_rate || body.brand) {
      try {
        const { data: taxSetting } = await supabase.from('settings').select('value').eq('key', 'product_hsn_tax_map').maybeSingle()
        const currentMap = taxSetting?.value || {}
        currentMap[id] = {
          ...(currentMap[id] || {}),
          hsn_code: hsn_code || currentMap[id]?.hsn_code || '69072300',
          tax_percent: parseFloat(tax_percent || gst_percent) || currentMap[id]?.tax_percent || 18,
          gst_percent: parseFloat(gst_percent || tax_percent) || currentMap[id]?.gst_percent || 18,
          purchase_rate: parseFloat(purchase_rate) != null ? parseFloat(purchase_rate) : (currentMap[id]?.purchase_rate || 0),
          brand: body.brand || currentMap[id]?.brand || ''
        }
        await supabase.from('settings').upsert([{ key: 'product_hsn_tax_map', value: currentMap }], { onConflict: 'key' })
      } catch (err) {
        console.warn('Could not update product tax map:', err.message)
      }
    }

    return jsonResponse({
      success: true,
      id,
      ...body,
      hsn_code: hsn_code || '69072300',
      tax_percent: parseFloat(tax_percent || gst_percent) || 18,
      gst_percent: parseFloat(gst_percent || tax_percent) || 18,
      purchase_rate: parseFloat(purchase_rate) || 0
    })
  }

  if (productIdMatch && method === 'DELETE') {
    const id = productIdMatch[1]
    await supabase.from('products').delete().eq('id', id)
    return jsonResponse({ success: true, id })
  }

  if (pathname === '/api/categories' && method === 'GET') {
    const { data: rawCats } = await supabase.from('categories').select('*').range(0, 4999)
    let customMap = {}
    let brandMap = {}
    try {
      const { data: qSetting } = await supabase.from('settings').select('value').eq('key', 'category_quotation_sqft').maybeSingle()
      if (qSetting && qSetting.value) customMap = qSetting.value
    } catch (e) {}
    try {
      const { data: bSetting } = await supabase.from('settings').select('value').eq('key', 'category_brand_map').maybeSingle()
      if (bSetting && bSetting.value) brandMap = bSetting.value
    } catch (e) {}

    const enriched = (rawCats || []).map(c => {
      let b = brandMap[c.id]
      if (!b) {
        const uType = (c.type || '').toUpperCase()
        const uName = (c.name || '').toUpperCase()
        if (uType === 'SANITARY' || uName.includes('PUPA')) b = 'PUPA'
        else if (uType === 'ADHESIVE' || uName.includes('ROFF')) b = 'ROFF'
        else b = 'KAG'
      }
      return {
        ...c,
        brand: b,
        sqft_per_box_quotation: getQuotationSqft(c, customMap)
      }
    })
    return jsonResponse(enriched)
  }

  if (pathname === '/api/categories/auto-classify' && method === 'POST') {
    const targetBrand = (body.brand || 'PUPA').toUpperCase().trim()
    const prodName = (body.product_name || '').trim()
    const rate = parseFloat(body.rate || 0)
    const size = body.size || 'Standard'

    const { data: rawCats } = await supabase.from('categories').select('*').range(0, 4999)
    let brandMap = {}
    try {
      const { data: bSetting } = await supabase.from('settings').select('value').eq('key', 'category_brand_map').maybeSingle()
      if (bSetting && bSetting.value) brandMap = bSetting.value
    } catch (e) {}

    // Find if a category for this brand already matches
    const existing = (rawCats || []).find(c => {
      const b = brandMap[c.id] || (c.type === 'SANITARY' ? 'PUPA' : c.type === 'ADHESIVE' ? 'ROFF' : 'KAG')
      if (b !== targetBrand) return false
      if (c.name && prodName && (prodName.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(prodName.toLowerCase()))) return true
      return true
    })

    if (existing) {
      return jsonResponse({
        ...existing,
        brand: targetBrand,
        created: false
      })
    }

    // Auto-create a brand classification category
    let catType = 'SANITARY'
    let catName = `${targetBrand} Sanitaryware & Fixtures`
    let mrpMultiplier = 1.40
    let discountPct = 20

    if (targetBrand === 'ROFF' || prodName.toLowerCase().includes('bond') || prodName.toLowerCase().includes('adhesive')) {
      catType = 'ADHESIVE'
      catName = `${targetBrand} Adhesives & Grouts`
      mrpMultiplier = 1.25
      discountPct = 15
    } else if (targetBrand === 'PUPA') {
      catType = 'SANITARY'
      if (prodName.toLowerCase().includes('closet') || prodName.toLowerCase().includes('commode') || prodName.toLowerCase().includes('ewc')) {
        catName = 'Pupa Sanitary - One Piece & Wall Hung Closets'
      } else if (prodName.toLowerCase().includes('basin') || prodName.toLowerCase().includes('sink')) {
        catName = 'Pupa Sanitary - Wash Basins & Table Top'
      } else {
        catName = 'Pupa Sanitaryware & Bathware'
      }
      mrpMultiplier = 1.40
      discountPct = 20
    }

    const calcMrp = rate > 0 ? Math.round(rate * mrpMultiplier) : 1500
    const calcOnline = Math.round(calcMrp * (1 - discountPct / 100))
    const newCatId = `${targetBrand}_${catType.slice(0, 3)}_${Date.now().toString().slice(-4)}`

    const newCat = {
      id: newCatId,
      size: size,
      name: catName,
      type: catType,
      sqft_per_box: 1,
      pcs_per_box: 1,
      weight_per_box: 0,
      mrp: calcMrp,
      online_price: calcOnline,
      sqft_price: calcOnline,
      discount_pct: discountPct
    }

    await supabase.from('categories').insert([newCat])

    brandMap[newCatId] = targetBrand
    try {
      await supabase.from('settings').upsert({
        key: 'category_brand_map',
        value: brandMap,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    } catch (e) {}

    return jsonResponse({
      ...newCat,
      brand: targetBrand,
      created: true
    }, 201)
  }

  if (pathname === '/api/categories' && method === 'POST') {
    const mrp = parseFloat(body.mrp || 0)
    const sqft = parseFloat(body.sqft_per_box || 1)
    const discount = body.discount_pct !== undefined ? parseFloat(body.discount_pct) : 10
    const online_price = Math.round(mrp * (1 - discount / 100))
    const sqft_price = Math.round(online_price / (sqft || 1))

    const catId = body.id ? body.id.trim().toUpperCase() : `CAT_${Date.now().toString().slice(-4)}`
    const newCategory = {
      id: catId,
      size: body.size,
      name: body.name,
      type: body.type || 'FLOOR',
      sqft_per_box: sqft,
      pcs_per_box: parseInt(body.pcs_per_box || 0),
      weight_per_box: parseFloat(body.weight_per_box || 0),
      mrp,
      online_price,
      sqft_price,
      discount_pct: discount
    }
    const { error } = await supabase.from('categories').insert([newCategory])
    if (error) return jsonResponse({ error: error.message }, 400)

    if (body.brand) {
      try {
        const { data: bSetting } = await supabase.from('settings').select('value').eq('key', 'category_brand_map').maybeSingle()
        const brandMap = (bSetting && bSetting.value) || {}
        brandMap[catId] = body.brand.toUpperCase().trim()
        await supabase.from('settings').upsert({
          key: 'category_brand_map',
          value: brandMap,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      } catch (e) {}
    }

    if (body.sqft_per_box_quotation !== undefined) {
      try {
        const { data: qSetting } = await supabase.from('settings').select('value').eq('key', 'category_quotation_sqft').maybeSingle()
        const currentMap = (qSetting && qSetting.value) || {}
        currentMap[catId] = parseFloat(body.sqft_per_box_quotation)
        await supabase.from('settings').upsert({
          key: 'category_quotation_sqft',
          value: currentMap,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      } catch (e) {}
    }

    return jsonResponse({
      ...newCategory,
      brand: body.brand ? body.brand.toUpperCase().trim() : 'KAG',
      sqft_per_box_quotation: body.sqft_per_box_quotation != null ? parseFloat(body.sqft_per_box_quotation) : getQuotationSqft(newCategory)
    }, 201)
  }

  const categoryIdMatch = pathname.match(/^\/api\/categories\/([^/]+)$/)
  if (categoryIdMatch && method === 'PUT') {
    const id = categoryIdMatch[1]
    const mrp = parseFloat(body.mrp || 0)
    const sqft = parseFloat(body.sqft_per_box || 1)
    const discount = body.discount_pct !== undefined ? parseFloat(body.discount_pct) : 10
    const online_price = Math.round(mrp * (1 - discount / 100))
    const sqft_price = Math.round(online_price / (sqft || 1))

    const updated = {
      size: body.size,
      name: body.name,
      type: body.type,
      sqft_per_box: sqft,
      pcs_per_box: parseInt(body.pcs_per_box || 0),
      weight_per_box: parseFloat(body.weight_per_box || 0),
      mrp,
      online_price,
      sqft_price,
      discount_pct: discount
    }
    const { error } = await supabase.from('categories').update(updated).eq('id', id)
    if (error) return jsonResponse({ error: error.message }, 400)

    if (body.brand) {
      try {
        const { data: bSetting } = await supabase.from('settings').select('value').eq('key', 'category_brand_map').maybeSingle()
        const brandMap = (bSetting && bSetting.value) || {}
        brandMap[id] = body.brand.toUpperCase().trim()
        await supabase.from('settings').upsert({
          key: 'category_brand_map',
          value: brandMap,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      } catch (e) {}
    }

    if (body.sqft_per_box_quotation !== undefined) {
      try {
        const { data: qSetting } = await supabase.from('settings').select('value').eq('key', 'category_quotation_sqft').maybeSingle()
        const currentMap = (qSetting && qSetting.value) || {}
        currentMap[id] = parseFloat(body.sqft_per_box_quotation)
        await supabase.from('settings').upsert({
          key: 'category_quotation_sqft',
          value: currentMap,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      } catch (e) {}
    }

    return jsonResponse({
      success: true,
      id,
      ...updated,
      brand: body.brand ? body.brand.toUpperCase().trim() : 'KAG',
      sqft_per_box_quotation: body.sqft_per_box_quotation != null ? parseFloat(body.sqft_per_box_quotation) : getQuotationSqft({ ...updated, id })
    })
  }

  if (categoryIdMatch && method === 'DELETE') {
    const id = categoryIdMatch[1]
    await supabase.from('categories').delete().eq('id', id)
    return jsonResponse({ success: true, id })
  }

  // ─── /api/pricing-settings ──────────────────────────────────────────────────
  if (pathname === '/api/pricing-settings' && method === 'GET') {
    let brandDiscounts = { KAG: 10, PUPA: 20, ROFF: 15 }
    try {
      const { data: bDisc } = await supabase.from('settings').select('value').eq('key', 'brand_pricing_discounts').maybeSingle()
      if (bDisc && bDisc.value) brandDiscounts = { ...brandDiscounts, ...bDisc.value }
    } catch (e) {}

    const saved = localStorage.getItem('crm_pricing_settings')
    const globalDisc = saved ? JSON.parse(saved).discount_percentage : 10

    return jsonResponse({
      discount_percentage: globalDisc,
      brand_discounts: brandDiscounts
    })
  }

  if (pathname === '/api/pricing-settings' && method === 'POST') {
    const targetBrand = body.brand ? body.brand.toUpperCase().trim() : 'ALL'
    const pct = parseFloat(body.discount_percentage || 10)

    if (targetBrand === 'ALL') {
      localStorage.setItem('crm_pricing_settings', JSON.stringify({ discount_percentage: pct }))
    }

    let brandDiscounts = { KAG: 10, PUPA: 20, ROFF: 15 }
    try {
      const { data: bDisc } = await supabase.from('settings').select('value').eq('key', 'brand_pricing_discounts').maybeSingle()
      if (bDisc && bDisc.value) brandDiscounts = { ...brandDiscounts, ...bDisc.value }
    } catch (e) {}

    if (targetBrand !== 'ALL') {
      brandDiscounts[targetBrand] = pct
    } else {
      Object.keys(brandDiscounts).forEach(k => { brandDiscounts[k] = pct })
    }

    try {
      await supabase.from('settings').upsert({
        key: 'brand_pricing_discounts',
        value: brandDiscounts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    } catch (e) {}

    let brandMap = {}
    try {
      const { data: bSetting } = await supabase.from('settings').select('value').eq('key', 'category_brand_map').maybeSingle()
      if (bSetting && bSetting.value) brandMap = bSetting.value
    } catch (e) {}

    // Update matching categories in Supabase
    const { data: cats } = await supabase.from('categories').select('*').range(0, 4999)
    if (cats && cats.length > 0) {
      const targetCats = cats.filter(c => {
        if (targetBrand === 'ALL') return true
        const b = brandMap[c.id] || (c.type === 'SANITARY' ? 'PUPA' : c.type === 'ADHESIVE' ? 'ROFF' : 'KAG')
        return b === targetBrand
      })

      const updatedCats = targetCats.map(c => {
        const mrp = parseFloat(c.mrp || 0)
        const sqft = parseFloat(c.sqft_per_box || 1)
        const online_price = Math.round(mrp * (1 - pct / 100))
        const sqft_price = Math.round(online_price / (sqft || 1))
        return {
          ...c,
          discount_pct: pct,
          online_price,
          sqft_price
        }
      })

      for (let i = 0; i < updatedCats.length; i += 20) {
        await supabase.from('categories').upsert(updatedCats.slice(i, i + 20), { onConflict: 'id' })
      }
    }

    return jsonResponse({ success: true, brand: targetBrand, discount_percentage: pct, brand_discounts: brandDiscounts })
  }

  // ─── /api/returns ──────────────────────────────────────────────────────────
  if (pathname === '/api/returns' && method === 'GET') {
    const { data, error } = await supabase.from('returns').select('*').order('created_at', { ascending: false })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapReturnFromSupabase))
  }

  if (pathname === '/api/returns' && method === 'POST') {
    const newReturn = {
      ...body,
      id: body.id || `RET-${Date.now()}`
    }
    await supabase.from('returns').insert([mapReturnToSupabase(newReturn)])
    return jsonResponse(newReturn, 201)
  }

  const returnIdMatch = pathname.match(/^\/api\/returns\/([^/]+)$/)
  if (returnIdMatch && method === 'DELETE') {
    const id = returnIdMatch[1]
    await supabase.from('returns').delete().eq('id', id)
    return jsonResponse({ success: true, id })
  }

  // ─── /api/referrals ────────────────────────────────────────────────────────
  if (pathname === '/api/referrals' && method === 'GET') {
    const { data, error } = await supabase.from('referrals').select('*').order('created_at', { ascending: false })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapReferralFromSupabase))
  }

  if (pathname === '/api/referrals' && method === 'POST') {
    const { data: all } = await supabase.from('referrals').select('id')
    const nextNum = (all || []).length + 1
    const newPartner = {
      ...body,
      id: `REF-${String(nextNum).padStart(3, '0')}`,
      status: 'Active',
      payouts: [],
      referredOrders: []
    }
    await supabase.from('referrals').insert([mapReferralToSupabase(newPartner)])
    return jsonResponse(newPartner, 201)
  }

  // ─── /api/invoices ─────────────────────────────────────────────────────────
  if (pathname === '/api/invoices' && method === 'GET') {
    const { data, error } = await supabase
      .from('purchase_invoices')
      .select('*')
      .order('date', { ascending: false })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse((data || []).map(mapInvoiceFromSupabase))
  }

  if (pathname === '/api/invoices' && method === 'POST') {
    const invoiceData = body || {}
    const mapped = mapInvoiceToSupabase(invoiceData)
    const { data, error } = await supabase
      .from('purchase_invoices')
      .upsert([mapped], { onConflict: 'id' })
      .select()
    if (error) {
      console.error('Error saving invoice to Supabase:', error)
      return jsonResponse({ error: error.message }, 500)
    }
    return jsonResponse(mapInvoiceFromSupabase(data?.[0] || mapped), 201)
  }

  const invoiceNoMatch = pathname.match(/^\/api\/invoices\/([^/]+)$/)
  if (invoiceNoMatch) {
    const invoiceNo = decodeURIComponent(invoiceNoMatch[1])
    if (method === 'PUT') {
      const { data: existing } = await supabase
        .from('purchase_invoices')
        .select('*')
        .or(`invoice_no.eq."${invoiceNo}",id.eq."${invoiceNo}"`)
        .limit(1)

      const base = existing?.[0] ? mapInvoiceFromSupabase(existing[0]) : { invoice_no: invoiceNo }
      const merged = { ...base, ...body }
      const mapped = mapInvoiceToSupabase(merged)
      mapped.id = existing?.[0]?.id || invoiceNo

      const { data, error } = await supabase
        .from('purchase_invoices')
        .upsert([mapped], { onConflict: 'id' })
        .select()

      if (error) {
        console.error('Error updating invoice in Supabase:', error)
        return jsonResponse({ error: error.message }, 500)
      }
      return jsonResponse(mapInvoiceFromSupabase(data?.[0] || mapped))
    }

    if (method === 'DELETE') {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .or(`invoice_no.eq."${invoiceNo}",id.eq."${invoiceNo}"`)

      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ success: true, message: `Invoice ${invoiceNo} deleted.` })
    }
  }

  // ─── /api/chat/messages ────────────────────────────────────────────────────
  if (pathname === '/api/chat/messages' && method === 'GET') {
    const { data, error } = await supabase.from('chat_messages').select('*').order('timestamp')
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse(data || [])
  }

  if (pathname === '/api/chat/messages' && method === 'POST') {
    const newMsg = {
      id: `MSG-${Date.now()}`,
      senderid: body.senderId,
      sendername: body.senderName,
      recipientid: body.recipientId || 'group',
      message: body.message,
      timestamp: new Date().toISOString()
    }
    await supabase.from('chat_messages').insert([newMsg])
    return jsonResponse(newMsg, 201)
  }

  // ─── /api/ai/chat ──────────────────────────────────────────────────────────
  if (pathname === '/api/ai/chat' && method === 'POST') {
    try {
      const { messages, systemPrompt, context, provider, model } = body || {}
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({
          success: false,
          error: 'Invalid request: "messages" array is required.'
        }, 400)
      }

      let parsedHeaders = {}
      if (options.headers) {
        if (typeof options.headers.forEach === 'function') {
          options.headers.forEach((val, key) => {
            parsedHeaders[key.toLowerCase()] = val
          })
        } else {
          parsedHeaders = { ...options.headers }
        }
      }

      const result = await handleAiChatRequest({
        messages,
        systemPrompt,
        context,
        provider,
        model,
        headers: parsedHeaders,
        body
      })

      const status = result.success ? 200 : (result.statusCode || (result.code === 'NO_KEYS_AVAILABLE' ? 400 : 502))
      return jsonResponse(result, status)
    } catch (err) {
      console.error('❌ [apiAdapter] /api/ai/chat error:', err)
      return jsonResponse({
        success: false,
        error: err.message || 'Internal error in client-side AI chat adapter.',
        code: 'CLIENT_ADAPTER_ERROR'
      }, 500)
    }
  }

  // ─── POST /api/test-mistral ────────────────────────────────────────────────
  if (pathname === '/api/test-mistral' && method === 'POST') {
    try {
      const getHeader = (h) => {
        const headers = options.headers
        if (!headers) return ''
        if (typeof headers.get === 'function') return headers.get(h) || ''
        if (typeof headers.forEach === 'function') {
          let val = ''
          headers.forEach((v, k) => {
            if (k.toLowerCase() === h.toLowerCase()) val = v
          })
          return val
        }
        return headers[h] || headers[h.toLowerCase()] || ''
      }

      let mistralKey = getHeader('x-mistral-key')
      if (!mistralKey && body?.mistralKey) {
        mistralKey = body.mistralKey
      }
      mistralKey = (mistralKey || localStorage.getItem('mistral_api_key') || 'mstrl_Nb4uJzQTWhO5xvm7Hg06R0MMHvAqxhcj_1jhCtG').trim()

      if (!mistralKey) {
        return jsonResponse({ success: false, error: 'No Mistral API key provided.' }, 400)
      }

      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${mistralKey}` }
      })

      if (!response.ok) {
        const err = await response.text()
        return jsonResponse({ success: false, error: err }, response.status)
      }

      const data = await response.json()
      return jsonResponse({ success: true, modelsCount: data.data?.length || 0 })
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500)
    }
  }

  // ─── POST /api/upload-invoice ──────────────────────────────────────────────
  if (pathname === '/api/upload-invoice' && method === 'POST') {
    try {
      const getHeader = (h) => {
        const headers = options.headers
        if (!headers) return ''
        if (typeof headers.get === 'function') return headers.get(h) || ''
        if (typeof headers.forEach === 'function') {
          let val = ''
          headers.forEach((v, k) => {
            if (k.toLowerCase() === h.toLowerCase()) val = v
          })
          return val
        }
        return headers[h] || headers[h.toLowerCase()] || ''
      }

      const prov = getHeader('x-provider') || localStorage.getItem('gemini_provider') || 'mistral'

      let file = null
      if (options.body instanceof FormData) {
        file = options.body.get('invoice')
      }
      if (!file) {
        return jsonResponse({ error: 'No invoice file uploaded.' }, 400)
      }

      // Convert File to Data URI
      const fileDataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = String(fileDataUri).split(',')[1]
      const mimeType = file.type || 'image/png'

      const invoiceSystemPrompt = `
You are an expert purchase tax invoice parser. Analyze the uploaded invoice image or document.
Identify and extract the following details and return ONLY a valid JSON object matching the requested schema.
Strict rules:
- Return ONLY the raw valid JSON object without markdown fences, comments, or extra text.
- Never output trailing commas before } or ].
- Enclose all keys and string values in double quotes.

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
  "total_items": number (Highest Serial Number / item count declared in the invoice table),
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
`

      let contentText = null

      if (prov === 'mistral') {
        const mistralKey = (getHeader('x-mistral-key') || localStorage.getItem('mistral_api_key') || 'mstrl_Nb4uJzQTWhO5xvm7Hg06R0MMHvAqxhcj_1jhCtG').trim()
        if (!mistralKey) {
          return jsonResponse({ error: 'Mistral API Key is missing. Please configure it in settings.' }, 400)
        }

        let targetDataUri = fileDataUri
        let extractedPdfText = ''

        const fileName = (file && file.name) || ''
        const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf') || String(fileDataUri).startsWith('data:application/pdf')

        // If PDF, extract embedded text; if text exists, use it directly!
        if (isPdf) {
          try {
            let pdfjsLib = await import('pdfjs-dist')
            if (pdfjsLib.default) pdfjsLib = pdfjsLib.default
            try {
              const worker = new Worker('/pdf.worker.min.mjs', { type: 'module' })
              pdfjsLib.GlobalWorkerOptions.workerPort = worker
            } catch {
              pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
            }

            const arrayBuffer = await file.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
            const pdfDoc = await loadingTask.promise

            // 1. Extract text from pages
            for (let p = 1; p <= Math.min(pdfDoc.numPages, 3); p++) {
              const page = await pdfDoc.getPage(p)
              const content = await page.getTextContent()
              const pageText = content.items.map(item => item.str).join(' ')
              extractedPdfText += `--- PAGE ${p} ---\n${pageText}\n`
            }

            // 2. If scanned PDF without embedded text, render page 1 to PNG via canvas
            if (extractedPdfText.trim().length < 80) {
              const page = await pdfDoc.getPage(1)
              const viewport = page.getViewport({ scale: 2.0 })
              const canvas = document.createElement('canvas')
              canvas.width = viewport.width
              canvas.height = viewport.height
              const ctx = canvas.getContext('2d')
              await page.render({ canvasContext: ctx, viewport }).promise
              targetDataUri = canvas.toDataURL('image/png')
            }
          } catch (pdfErr) {
            console.warn('PDF parsing in browser warning:', pdfErr)
          }
        }

        // Build user message content safely for Mistral API
        let userContent = null

        if (extractedPdfText && extractedPdfText.trim().length >= 80) {
          userContent = `Analyze the following purchase tax invoice text and extract all details according to the schema:\n\n${extractedPdfText}`
        } else if (targetDataUri && targetDataUri.startsWith('data:image/')) {
          userContent = [
            { type: 'text', text: 'Analyze this invoice document and extract all fields according to schema.' },
            { type: 'image_url', image_url: targetDataUri }
          ]
        } else {
          // Automatic Seamless Fallback to Google Gemini for native PDF handling!
          const fallbackGeminiKey = (getHeader('x-gemini-key') || localStorage.getItem('gemini_api_key') || '').trim()
          if (fallbackGeminiKey) {
            console.log('PDF detected for Mistral. Engaging native Gemini multimodal PDF parser...')
            let geminiModel = getHeader('x-gemini-model') || localStorage.getItem('gemini_model') || 'gemini-3.8-flash'
            if (geminiModel.startsWith('gemini-2.5')) geminiModel = 'gemini-3.8-flash'

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${fallbackGeminiKey}`
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
                      { text: invoiceSystemPrompt }
                    ]
                  }
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                  maxOutputTokens: 8192
                }
              })
            })

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json()
              contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
            }
          }

          if (!contentText) {
            throw new Error('Unable to extract text or render PDF image for Mistral. Please upload invoice as PNG/JPG or switch provider to Google Gemini.')
          }
        }

        if (!contentText) {
          // Call ministral-8b-latest Completions API
          const visionRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mistralKey}`
            },
            body: JSON.stringify({
              model: 'ministral-8b-latest',
              messages: [
                { role: 'system', content: invoiceSystemPrompt },
                { role: 'user', content: userContent }
              ],
              max_tokens: 8192,
              response_format: { type: 'json_object' }
            })
          })

          if (!visionRes.ok) {
            const errText = await visionRes.text()
            throw new Error(`Mistral API error (${visionRes.status}): ${errText}`)
          }

          const visionData = await visionRes.json()
          contentText = visionData.choices?.[0]?.message?.content
        }
      } else {
        // Google Gemini
        const geminiKey = (getHeader('x-gemini-key') || localStorage.getItem('gemini_api_key') || '').trim()
        let geminiModel = getHeader('x-gemini-model') || localStorage.getItem('gemini_model') || 'gemini-3.8-flash'
        if (geminiModel.startsWith('gemini-2.5')) {
          geminiModel = 'gemini-3.8-flash'
        }
        if (!geminiKey) {
          return jsonResponse({ error: 'Gemini API Key is missing. Please configure it in settings.' }, 400)
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { data: base64Data, mimeType } },
                  { text: invoiceSystemPrompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: 8192
            }
          })
        })

        if (!geminiRes.ok) {
          const errText = await geminiRes.text()
          throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`)
        }

        const geminiData = await geminiRes.json()
        contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      }

      if (!contentText) {
        throw new Error('Could not extract text from invoice.')
      }

      const parsed = safeJsonParse(contentText)

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
      }

      // Check duplicate against Supabase
      let isDuplicate = false
      try {
        const { data: dupData } = await supabase
          .from('purchase_invoices')
          .select('invoice_no, supplier_name')
          .eq('invoice_no', cleanedResult.invoice_no)
        if (dupData && dupData.length > 0) isDuplicate = true
      } catch {}
      cleanedResult.is_duplicate = isDuplicate

      return jsonResponse(cleanedResult)
    } catch (err) {
      console.error('❌ [apiAdapter] /api/upload-invoice error:', err)
      return jsonResponse({ error: err.message || 'Invoice scanning failed' }, 500)
    }
  }

  // Fallback 404
  return jsonResponse({ error: `Not found: ${method} ${pathname}` }, 404)
}

// ─── INSTALL GLOBAL FETCH INTERCEPTOR ────────────────────────────────────────
export function installFetchInterceptor() {
  const originalFetch = window.fetch

  window.fetch = async function (input, init = {}) {
    let url = typeof input === 'string' ? input : (input?.url || '')

    // Check if this is an /api/ request
    if (url.startsWith('/api/')) {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      // If we are on production (e.g. Cloudflare workers.dev) OR local backend is down:
      if (!isLocal) {
        // Route directly to Supabase!
        return handleApiRequest(url, init)
      } else {
        // On localhost, try the local Node.js server first; if fails or 405/404, fallback to Supabase
        try {
          const res = await originalFetch(input, init)
          if (res.status === 404 || res.status === 405) {
            return handleApiRequest(url, init)
          }
          return res
        } catch (err) {
          console.warn('Local API server unreachable, falling back to Supabase:', err.message)
          return handleApiRequest(url, init)
        }
      }
    }

    return originalFetch(input, init)
  }

  console.log('🚀 [CRM Engine] Direct Supabase & Offline-safe Fetch Interceptor Active!')
}
