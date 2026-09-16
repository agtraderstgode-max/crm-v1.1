import { supabase } from './supabaseClient'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
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

const mapLeadFromSupabase = (l) => ({
  id: l.id,
  date: l.date || '',
  name: l.name,
  phone: l.phone,
  location: l.location || '',
  lat: l.lat || '',
  lng: l.lng || '',
  km: l.km || '',
  source: l.source || '',
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
  attendedBy: l.attendedby || '',
  history: l.history || []
})

const mapLeadToSupabase = (l) => ({
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
  history: l.history || []
})

const mapCustomerFromSupabase = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || '',
  location: c.location || '',
  custType: c.custtype || '',
  expectedAmt: c.expectedamt || '',
  attendedBy: c.attendedby || '',
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
    splitPayments: o.splitpayments || [],
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
    splitpayments: o.splitPayments || o.splitpayments || [],
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

  // ─── /api/products & /api/categories ───────────────────────────────────────
  if (pathname === '/api/products' && method === 'GET') {
    const { data: prods } = await supabase.from('products').select('*')
    const { data: cats } = await supabase.from('categories').select('*')
    const categories = cats || []
    const joined = (prods || []).map(p => {
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
            category: cat.name
          }
        }
      }
      return p
    })
    return jsonResponse(joined)
  }

  if (pathname === '/api/categories' && method === 'GET') {
    const { data } = await supabase.from('categories').select('*')
    return jsonResponse(data || [])
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
