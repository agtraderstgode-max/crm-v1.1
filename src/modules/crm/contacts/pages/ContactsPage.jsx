import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Phone, MapPin, Building2, Home,
  Edit2, Trash2, Download, Filter, Users, Wrench,
  Briefcase, X, ExternalLink, Grid, List,
  ChevronDown, ChevronLeft, ChevronRight, Eye, Gift, Sparkles,
  IndianRupee, Clock, FileText, Folder, ArrowRight, Compass,
  Layers, MessageCircle, AlertCircle, CheckCircle2, Receipt,
  Check, ShoppingCart, Truck, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Car
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Top Categories Matching Screenshot
const CATEGORIES = [
  { id: 'All', label: 'All Contacts', icon: Users },
  { id: 'Tile Layer', label: 'Tile Layers', icon: Layers },
  { id: 'Builder', label: 'Builders', icon: Building2 },
  { id: 'Contractor', label: 'Contractors', icon: Briefcase },
  { id: 'Architect', label: 'Architects', icon: Compass },
  { id: 'Auto', label: 'Auto', icon: Car },
  { id: 'Others', label: 'Others', icon: Users }
]

const TYPE_BADGE_STYLES = {
  'Tile Layer': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'Builder':    'bg-blue-50 text-blue-700 border-blue-200/80',
  'Contractor': 'bg-amber-50 text-amber-700 border-amber-200/80',
  'Architect':  'bg-purple-50 text-purple-700 border-purple-200/80',
  'Auto':       'bg-amber-100 text-amber-800 border-amber-300/80',
  'Auto Driver':'bg-amber-100 text-amber-800 border-amber-300/80',
  'Supplier':   'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  'Customer':   'bg-sky-50 text-sky-700 border-sky-200/80',
  'Others':     'bg-slate-100 text-slate-700 border-slate-200'
}

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

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDateForDisplay = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ContactsPage() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [locationFilter, setLocationFilter] = useState('All')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Detail View Selected Contact
  const [selectedContactId, setSelectedContactId] = useState('CNT-001')
  const [activeDetailTab, setActiveDetailTab] = useState('referrals') // 'referrals' | 'commission' | 'bonus' | 'notes' | 'documents'

  // Customer suggestions list for autocomplete
  const [customerSuggestions, setCustomerSuggestions] = useState([])

  // Sales Orders state for linking
  const [ordersList, setOrdersList] = useState([])
  const [viewingOrder, setViewingOrder] = useState(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  // Modal State for Add / Edit Contact
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Tile Layer',
    phone: '',
    whatsapp: '',
    location: '',
    address: '',
    experience: '10+ years',
    specialization: 'Tiles, Bathroom, Kitchen',
    quote: 'Quality work, long term partnership',
    notes: 'Reliable and good quality work. Regular customer referrals.',
    status: 'Active',
    totalReferrals: 0,
    totalSales: 0,
    totalCommission: 0,
    bonus: 0
  })
  const [formError, setFormError] = useState('')

  // Modal State for Add Referral Sale & Commission
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    location: '',
    items: '',
    saleValue: '',
    commissionPercent: 5,
    commissionAmount: '',
    status: 'Paid',
    notes: '',
    orderId: '',
    linkedOrder: null
  })
  const [saleError, setSaleError] = useState('')

  // Modal State for Record Commission Payout
  const [isPayoutOpen, setIsPayoutOpen] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    voucher: '',
    amount: '',
    mode: 'UPI / GPay',
    status: 'Paid'
  })

  // Modal State for Award Bonus
  const [isBonusOpen, setIsBonusOpen] = useState(false)
  const [bonusForm, setBonusForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    amount: '',
    status: 'Paid'
  })

  // Notification Toast
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Load contacts from backend API
  const loadContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setContacts(data)
          if (!data.some(c => c.id === selectedContactId)) {
            setSelectedContactId(data[0].id)
          }
          return
        }
      }
    } catch (err) {
      console.warn('API error loading contacts:', err)
    }
  }

  // Load customers for autocomplete
  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setCustomerSuggestions(data.map(c => c.name).filter(Boolean))
        }
      }
    } catch {
      // ignore fallback
    }
  }

  // Load Sales Orders for Bill / Reference auto-linking
  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setOrdersList(data)
        }
      }
    } catch (err) {
      console.warn('API error loading orders:', err)
    }
  }

  useEffect(() => {
    loadContacts()
    loadCustomers()
    loadOrders()
  }, [])

  // Unique Locations list for filter dropdown
  const uniqueLocations = useMemo(() => {
    const set = new Set(contacts.map(c => c.location).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [contacts])

  // Category counts for tab pills (Dynamic based on actual contacts data)
  const categoryCounts = useMemo(() => {
    const counts = {
      All: contacts.length,
      'Tile Layer': 0,
      Builder: 0,
      Contractor: 0,
      Architect: 0,
      Auto: 0,
      Others: 0
    }

    contacts.forEach(c => {
      const type = c.type || c.category
      if (type === 'Tile Layer') counts['Tile Layer']++
      else if (type === 'Builder') counts.Builder++
      else if (type === 'Contractor') counts.Contractor++
      else if (type === 'Architect') counts.Architect++
      else if (type === 'Auto' || type === 'Auto Driver' || type === 'Auto Drivers') counts.Auto++
      else counts.Others++
    })

    return counts
  }, [contacts])

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(item => {
      const itemType = item.type || item.category || ''
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Auto') {
          if (itemType !== 'Auto' && itemType !== 'Auto Driver' && itemType !== 'Auto Drivers') return false
        } else {
          if (itemType !== selectedCategory) return false
        }
      }

      if (typeFilter !== 'All') {
        if (typeFilter === 'Auto') {
          if (itemType !== 'Auto' && itemType !== 'Auto Driver' && itemType !== 'Auto Drivers') return false
        } else {
          if (itemType !== typeFilter) return false
        }
      }

      if (statusFilter !== 'All') {
        const itemStatus = item.status || 'Active'
        if (itemStatus.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      if (locationFilter !== 'All') {
        if (item.location !== locationFilter) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          (item.name || '').toLowerCase().includes(q) ||
          (item.phone || '').includes(q) ||
          (item.location || '').toLowerCase().includes(q) ||
          (item.type || '').toLowerCase().includes(q) ||
          (item.specialization || '').toLowerCase().includes(q)
        if (!match) return false
      }

      return true
    })
  }, [contacts, selectedCategory, typeFilter, statusFilter, locationFilter, searchQuery])

  // Sorting State: 'none' | 'referrals' | 'sales' | 'commission' | 'bonus' | 'name' | 'location'
  const [sortField, setSortField] = useState('none')
  const [sortDirection, setSortDirection] = useState('desc') // 'desc' | 'asc'

  // Helper value extractors for numeric sorting
  const getContactReferralCount = (c) => {
    if (typeof c.totalReferrals === 'number') return c.totalReferrals
    if (Array.isArray(c.referrals)) return c.referrals.length
    return parseInt(String(c.totalReferrals || 0).replace(/[^\d]/g, ''), 10) || 0
  }

  const getContactSalesValue = (c) => {
    if (typeof c.totalSales === 'number') return c.totalSales
    if (Array.isArray(c.referrals) && c.referrals.length > 0) {
      const sum = c.referrals.reduce((acc, r) => acc + (parseFloat(r.saleValue) || 0), 0)
      if (sum > 0) return sum
    }
    return parseFloat(String(c.totalSales || 0).replace(/[^\d.]/g, '')) || 0
  }

  const getContactCommissionValue = (c) => {
    if (typeof c.totalCommission === 'number') return c.totalCommission
    if (Array.isArray(c.referrals) && c.referrals.length > 0) {
      const sum = c.referrals.reduce((acc, r) => acc + (parseFloat(r.commissionAmount) || 0), 0)
      if (sum > 0) return sum
    }
    return parseFloat(String(c.totalCommission || 0).replace(/[^\d.]/g, '')) || 0
  }

  const getContactBonusValue = (c) => {
    if (typeof c.bonus === 'number') return c.bonus
    return parseFloat(String(c.bonus || 0).replace(/[^\d.]/g, '')) || 0
  }

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc')
      } else {
        setSortField('none')
        setSortDirection('desc')
      }
    } else {
      setSortField(field)
      setSortDirection(field === 'name' || field === 'location' ? 'asc' : 'desc')
    }
    setCurrentPage(1)
  }

  const handleSortPresetChange = (preset) => {
    switch (preset) {
      case 'referrals_desc':
        setSortField('referrals')
        setSortDirection('desc')
        break
      case 'referrals_asc':
        setSortField('referrals')
        setSortDirection('asc')
        break
      case 'sales_desc':
        setSortField('sales')
        setSortDirection('desc')
        break
      case 'sales_asc':
        setSortField('sales')
        setSortDirection('asc')
        break
      case 'commission_desc':
        setSortField('commission')
        setSortDirection('desc')
        break
      case 'commission_asc':
        setSortField('commission')
        setSortDirection('asc')
        break
      case 'bonus_desc':
        setSortField('bonus')
        setSortDirection('desc')
        break
      case 'bonus_asc':
        setSortField('bonus')
        setSortDirection('asc')
        break
      case 'name_asc':
        setSortField('name')
        setSortDirection('asc')
        break
      case 'name_desc':
        setSortField('name')
        setSortDirection('desc')
        break
      default:
        setSortField('none')
        setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  // Sorted Contacts based on sortField & sortDirection
  const sortedContacts = useMemo(() => {
    const list = [...filteredContacts]
    if (sortField === 'none') return list

    return list.sort((a, b) => {
      let valA = 0
      let valB = 0
      switch (sortField) {
        case 'referrals':
          valA = getContactReferralCount(a)
          valB = getContactReferralCount(b)
          return sortDirection === 'desc' ? valB - valA : valA - valB

        case 'sales':
          valA = getContactSalesValue(a)
          valB = getContactSalesValue(b)
          return sortDirection === 'desc' ? valB - valA : valA - valB

        case 'commission':
          valA = getContactCommissionValue(a)
          valB = getContactCommissionValue(b)
          return sortDirection === 'desc' ? valB - valA : valA - valB

        case 'bonus':
          valA = getContactBonusValue(a)
          valB = getContactBonusValue(b)
          return sortDirection === 'desc' ? valB - valA : valA - valB

        case 'name':
          valA = (a.name || '').toLowerCase()
          valB = (b.name || '').toLowerCase()
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)

        case 'location':
          valA = (a.location || '').toLowerCase()
          valB = (b.location || '').toLowerCase()
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)

        default:
          return 0
      }
    })
  }, [filteredContacts, sortField, sortDirection])

  // Pagination calculation
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage) || 1
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedContacts.slice(start, start + itemsPerPage)
  }, [sortedContacts, currentPage, itemsPerPage])

  // Selected contact object for detail card
  const selectedContact = useMemo(() => {
    return contacts.find(c => c.id === selectedContactId) || contacts[0] || null
  }, [contacts, selectedContactId])

  // Save updated contact helper
  const saveContactToApi = async (updated) => {
    try {
      const res = await fetch(`/api/contacts/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        const saved = await res.json()
        setContacts(prev => prev.map(c => c.id === saved.id ? saved : c))
        return saved
      }
    } catch (err) {
      console.error('Failed to update contact:', err)
    }
    // optimistic fallback
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    return updated
  }

  // Open Modal for Add Contact
  const handleAddNew = () => {
    setEditingContact(null)
    setFormData({
      name: '',
      type: selectedCategory !== 'All' ? selectedCategory : 'Tile Layer',
      phone: '',
      whatsapp: '',
      location: 'Tiruchengode',
      address: '',
      experience: '5+ years',
      specialization: 'Tiles, Flooring',
      quote: 'Quality work and commitment',
      notes: '',
      status: 'Active',
      totalReferrals: 0,
      totalSales: 0,
      totalCommission: 0,
      bonus: 0
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Open Modal for Edit Contact
  const handleEdit = (c, e) => {
    if (e) e.stopPropagation()
    setEditingContact(c)
    setFormData({
      name: c.name || '',
      type: c.type || c.category || 'Tile Layer',
      phone: c.phone || '',
      whatsapp: c.whatsapp || c.phone || '',
      location: c.location || '',
      address: c.address || '',
      experience: c.experience || '10+ years',
      specialization: c.specialization || 'Tiles, Bathroom, Kitchen',
      quote: c.quote || '',
      notes: c.notes || '',
      status: c.status || 'Active',
      totalReferrals: c.totalReferrals || 0,
      totalSales: c.totalSales || 0,
      totalCommission: c.totalCommission || 0,
      bonus: c.bonus || 0
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Delete Contact
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this contact?')) return

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id))
        if (selectedContactId === id) {
          const rem = contacts.filter(c => c.id !== id)
          if (rem.length > 0) setSelectedContactId(rem[0].id)
        }
        showToast('Contact deleted successfully')
      }
    } catch (err) {
      console.error('Failed to delete contact:', err)
    }
  }

  // Handle Contact Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formData.phone.trim()) {
      setFormError('Phone number is required')
      return
    }

    const payload = {
      ...formData,
      category: formData.type,
      totalReferrals: Number(formData.totalReferrals) || 0,
      totalSales: Number(formData.totalSales) || 0,
      totalCommission: Number(formData.totalCommission) || 0,
      bonus: Number(formData.bonus) || 0,
      referrals: editingContact?.referrals || []
    }

    try {
      if (editingContact) {
        const updated = await saveContactToApi({ ...payload, id: editingContact.id })
        setSelectedContactId(updated.id)
        showToast(`Contact "${updated.name}" updated successfully!`)
      } else {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const created = await res.json()
          setContacts(prev => [created, ...prev])
          setSelectedContactId(created.id)
          showToast(`New contact "${created.name}" created!`)
        }
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving contact:', err)
      setFormError('Failed to save contact. Please try again.')
    }
  }

  // ─── ADD / EDIT REFERRAL SALE & COMMISSION LOGIC ─────────────────────────────
  const parseOrderAmount = (amtStr) => {
    if (!amtStr) return 0
    const clean = String(amtStr).replace(/[^\d.]/g, '')
    return parseFloat(clean) || 0
  }

  const applyOrderMapping = (order, baseForm = null) => {
    if (!order) return
    const ordAmt = parseOrderAmount(order.total)
    const formToUse = baseForm || saleForm
    const pct = parseFloat(formToUse.commissionPercent) || 5
    const comm = ordAmt > 0 && pct > 0 ? Math.round(ordAmt * (pct / 100)) : formToUse.commissionAmount

    let itemsSummary = formToUse.items
    if (order.itemsdetails && order.itemsdetails.length > 0) {
      itemsSummary = order.itemsdetails.map(it => `${it.description || 'Tile'} (${it.quantity || ''} ${it.unit || ''})`).join(', ')
    } else if (order.itemsList && order.itemsList.length > 0) {
      itemsSummary = order.itemsList.map(it => `${it.description || 'Tile'} (${it.quantity || ''} ${it.unit || ''})`).join(', ')
    } else if (order.items) {
      itemsSummary = `${order.items} Items - Tiles Order`
    }

    setSaleForm(prev => ({
      ...prev,
      notes: order.id,
      orderId: order.id,
      customerName: order.customer || prev.customerName,
      saleValue: ordAmt > 0 ? String(ordAmt) : prev.saleValue,
      commissionAmount: comm !== '' ? String(comm) : prev.commissionAmount,
      location: order.location || prev.location,
      items: itemsSummary || prev.items,
      date: order.date ? (order.date.includes('T') ? order.date.split('T')[0] : order.date) : prev.date,
      linkedOrder: order
    }))
  }

  const handleNotesChange = (val) => {
    const cleanVal = val.trim()
    const matchedOrder = ordersList.find(o => 
      o.id.toLowerCase() === cleanVal.toLowerCase() ||
      cleanVal.toLowerCase() === o.id.toLowerCase().replace('-', '') ||
      cleanVal.toLowerCase() === `ord-${o.id.toLowerCase()}`
    )

    if (matchedOrder) {
      applyOrderMapping(matchedOrder, { ...saleForm, notes: val })
    } else {
      setSaleForm(prev => ({
        ...prev,
        notes: val,
        orderId: cleanVal.toUpperCase().startsWith('ORD-') ? cleanVal.toUpperCase() : '',
        linkedOrder: null
      }))
    }
  }

  const handleViewOrderDetails = async (orderId) => {
    if (!orderId) return
    const cleanId = orderId.trim().toUpperCase()
    let found = ordersList.find(o => o.id.toUpperCase() === cleanId)

    if (!found) {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setOrdersList(data)
            found = data.find(o => o.id.toUpperCase() === cleanId)
          }
        }
      } catch (err) {
        console.warn('Error fetching order for modal:', err)
      }
    }

    if (found) {
      setViewingOrder(found)
      setIsOrderModalOpen(true)
    } else {
      setViewingOrder({
        id: cleanId,
        customer: 'Customer Order',
        total: 'Linked Record',
        status: 'Confirmed',
        date: new Date().toISOString().split('T')[0]
      })
      setIsOrderModalOpen(true)
    }
  }

  const handleOpenAddSaleModal = (existingSale = null) => {
    if (!selectedContact) return
    setEditingSale(existingSale)
    if (existingSale) {
      const existingOrderId = existingSale.orderId || (existingSale.notes && existingSale.notes.toUpperCase().startsWith('ORD-') ? existingSale.notes.trim().toUpperCase() : '')
      const matched = existingOrderId ? ordersList.find(o => o.id.toLowerCase() === existingOrderId.toLowerCase()) : null

      setSaleForm({
        date: existingSale.date ? (existingSale.date.includes('-') && existingSale.date.length === 10 ? existingSale.date : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        customerName: existingSale.customerName || '',
        location: existingSale.location || '',
        items: existingSale.items || '',
        saleValue: existingSale.saleValue || '',
        commissionPercent: existingSale.commissionPercent || 5,
        commissionAmount: existingSale.commissionAmount || '',
        status: existingSale.status || 'Paid',
        notes: existingSale.notes || '',
        orderId: existingOrderId || '',
        linkedOrder: matched || null
      })
    } else {
      setSaleForm({
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        location: selectedContact.location || '',
        items: '48x24 PGVT Flooring Tiles',
        saleValue: '',
        commissionPercent: 5,
        commissionAmount: '',
        status: 'Paid',
        notes: '',
        orderId: '',
        linkedOrder: null
      })
    }
    setSaleError('')
    setIsAddSaleOpen(true)
  }

  const handleSaleValueChange = (val) => {
    const saleNum = parseFloat(val) || 0
    const pct = parseFloat(saleForm.commissionPercent) || 0
    const comm = (saleNum > 0 && pct > 0) ? Math.round(saleNum * (pct / 100)) : saleForm.commissionAmount
    setSaleForm(prev => ({
      ...prev,
      saleValue: val,
      commissionAmount: comm !== '' ? comm : ''
    }))
  }

  const handleCommissionRateChange = (pct) => {
    const saleNum = parseFloat(saleForm.saleValue) || 0
    const rateNum = parseFloat(pct) || 0
    const comm = saleNum > 0 && rateNum > 0 ? Math.round(saleNum * (rateNum / 100)) : ''
    setSaleForm(prev => ({
      ...prev,
      commissionPercent: pct,
      commissionAmount: comm !== '' ? comm : prev.commissionAmount
    }))
  }

  const handleCommissionAmountChange = (amt) => {
    const amtNum = parseFloat(amt) || 0
    const saleNum = parseFloat(saleForm.saleValue) || 0
    let calculatedPct = saleForm.commissionPercent
    if (saleNum > 0 && amtNum >= 0) {
      calculatedPct = parseFloat(((amtNum / saleNum) * 100).toFixed(2))
    }
    setSaleForm(prev => ({
      ...prev,
      commissionAmount: amt,
      commissionPercent: !isNaN(calculatedPct) && isFinite(calculatedPct) ? calculatedPct : prev.commissionPercent
    }))
  }

  const handleSaveSaleSubmit = async (e) => {
    e.preventDefault()
    if (!saleForm.customerName.trim()) {
      setSaleError('Customer or project name is required')
      return
    }
    const saleNum = parseFloat(saleForm.saleValue) || 0
    if (saleNum <= 0) {
      setSaleError('Please enter a valid sale value')
      return
    }
    const commNum = parseFloat(saleForm.commissionAmount) || Math.round(saleNum * (saleForm.commissionPercent / 100))

    const currentReferrals = [...(selectedContact.referrals || [])]
    const detectedOrderId = saleForm.orderId || (saleForm.notes && saleForm.notes.toUpperCase().startsWith('ORD-') ? saleForm.notes.trim().toUpperCase() : '')

    if (editingSale) {
      // Editing existing sale
      const idx = currentReferrals.findIndex(r => r.id === editingSale.id)
      const diffSale = saleNum - (editingSale.saleValue || 0)
      const diffComm = commNum - (editingSale.commissionAmount || 0)

      const updatedSale = {
        ...editingSale,
        date: formatDateForDisplay(saleForm.date),
        customerName: saleForm.customerName.trim(),
        location: saleForm.location.trim(),
        items: saleForm.items.trim(),
        saleValue: saleNum,
        commissionPercent: parseFloat(saleForm.commissionPercent) || (saleNum > 0 ? parseFloat(((commNum / saleNum) * 100).toFixed(2)) : 0),
        commissionAmount: commNum,
        status: saleForm.status,
        notes: saleForm.notes,
        orderId: detectedOrderId
      }

      if (idx !== -1) currentReferrals[idx] = updatedSale

      const updatedContact = {
        ...selectedContact,
        referrals: currentReferrals,
        totalSales: Math.max(0, (selectedContact.totalSales || 0) + diffSale),
        totalCommission: Math.max(0, (selectedContact.totalCommission || 0) + diffComm)
      }

      await saveContactToApi(updatedContact)
      showToast('Referral sale updated successfully!')
    } else {
      // Adding new referral sale
      const newSaleItem = {
        id: `REF-${Date.now()}`,
        date: formatDateForDisplay(saleForm.date),
        customerName: saleForm.customerName.trim(),
        location: saleForm.location.trim(),
        items: saleForm.items.trim(),
        saleValue: saleNum,
        commissionPercent: parseFloat(saleForm.commissionPercent) || (saleNum > 0 ? parseFloat(((commNum / saleNum) * 100).toFixed(2)) : 0),
        commissionAmount: commNum,
        status: saleForm.status,
        notes: saleForm.notes,
        orderId: detectedOrderId
      }

      const updatedReferrals = [newSaleItem, ...currentReferrals]
      const updatedContact = {
        ...selectedContact,
        referrals: updatedReferrals,
        totalReferrals: (selectedContact.totalReferrals || currentReferrals.length) + 1,
        totalSales: (selectedContact.totalSales || 0) + saleNum,
        totalCommission: (selectedContact.totalCommission || 0) + commNum
      }

      // If status is Paid, also record in Commission History
      if (saleForm.status === 'Paid') {
        const currentPayouts = [...(selectedContact.commissionHistory || [])]
        currentPayouts.unshift({
          id: `PAY-${Date.now()}`,
          date: formatDateForDisplay(saleForm.date),
          voucher: detectedOrderId ? `${detectedOrderId} (Comm.)` : (saleForm.notes ? saleForm.notes : `VCH-${Math.floor(8000 + Math.random() * 1000)}`),
          amount: commNum,
          mode: 'UPI / Direct Payout',
          status: 'Paid'
        })
        updatedContact.commissionHistory = currentPayouts
      }

      await saveContactToApi(updatedContact)
      showToast(`Added sale of ${formatCurrency(saleNum)} & commission of ${formatCurrency(commNum)}!`)
    }

    setIsAddSaleOpen(false)
  }

  // 1-Click Toggle / Mark as Paid
  const handleToggleSaleStatus = async (sale) => {
    const nextStatus = sale.status === 'Paid' ? 'Pending' : 'Paid'
    const currentReferrals = [...(selectedContact.referrals || [])]
    const idx = currentReferrals.findIndex(r => r.id === sale.id)
    if (idx === -1) return

    currentReferrals[idx] = { ...sale, status: nextStatus }

    const updatedContact = {
      ...selectedContact,
      referrals: currentReferrals
    }

    // If marked Paid, add to commission history
    if (nextStatus === 'Paid') {
      const currentPayouts = [...(selectedContact.commissionHistory || [])]
      currentPayouts.unshift({
        id: `PAY-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        voucher: `VCH-${Math.floor(8000 + Math.random() * 1000)}`,
        amount: sale.commissionAmount,
        mode: 'UPI / PhonePe',
        status: 'Paid'
      })
      updatedContact.commissionHistory = currentPayouts
    }

    await saveContactToApi(updatedContact)
    showToast(`Commission marked as ${nextStatus}!`)
  }

  // Delete Referral Sale
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Delete this referral sale record?')) return
    const currentReferrals = [...(selectedContact.referrals || [])]
    const target = currentReferrals.find(r => r.id === saleId)
    if (!target) return

    const updatedReferrals = currentReferrals.filter(r => r.id !== saleId)
    const updatedContact = {
      ...selectedContact,
      referrals: updatedReferrals,
      totalReferrals: Math.max(0, (selectedContact.totalReferrals || 1) - 1),
      totalSales: Math.max(0, (selectedContact.totalSales || 0) - (target.saleValue || 0)),
      totalCommission: Math.max(0, (selectedContact.totalCommission || 0) - (target.commissionAmount || 0))
    }

    await saveContactToApi(updatedContact)
    showToast('Referral sale removed.')
  }

  // ─── ADD COMMISSION PAYOUT ──────────────────────────────────────────────────
  const handleOpenPayoutModal = () => {
    setPayoutForm({
      date: new Date().toISOString().split('T')[0],
      voucher: `VCH-${Math.floor(8800 + Math.random() * 1000)}`,
      amount: '',
      mode: 'UPI / GPay',
      status: 'Paid'
    })
    setIsPayoutOpen(true)
  }

  const handleSavePayoutSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(payoutForm.amount) || 0
    if (amt <= 0) return

    const currentPayouts = [...(selectedContact.commissionHistory || [])]
    currentPayouts.unshift({
      id: `PAY-${Date.now()}`,
      date: formatDateForDisplay(payoutForm.date),
      voucher: payoutForm.voucher || `VCH-${Date.now().toString().slice(-4)}`,
      amount: amt,
      mode: payoutForm.mode,
      status: payoutForm.status
    })

    const updatedContact = {
      ...selectedContact,
      commissionHistory: currentPayouts
    }

    await saveContactToApi(updatedContact)
    setIsPayoutOpen(false)
    showToast(`Commission payout of ${formatCurrency(amt)} recorded!`)
  }

  // ─── AWARD BONUS ─────────────────────────────────────────────────────────────
  const handleOpenBonusModal = () => {
    setBonusForm({
      date: new Date().toISOString().split('T')[0],
      title: 'Target Achievement Mega Bonus',
      amount: 5000,
      status: 'Paid'
    })
    setIsBonusOpen(true)
  }

  const handleSaveBonusSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(bonusForm.amount) || 0
    if (amt <= 0) return

    const currentBonuses = [...(selectedContact.bonusHistory || [])]
    currentBonuses.unshift({
      id: `BNS-${Date.now()}`,
      date: formatDateForDisplay(bonusForm.date),
      title: bonusForm.title.trim() || 'Milestone Bonus',
      amount: amt,
      status: bonusForm.status
    })

    const updatedContact = {
      ...selectedContact,
      bonus: (selectedContact.bonus || 0) + amt,
      bonusHistory: currentBonuses
    }

    await saveContactToApi(updatedContact)
    setIsBonusOpen(false)
    showToast(`Milestone bonus of ${formatCurrency(amt)} awarded!`)
  }

  // Export to CSV
  const handleExport = () => {
    if (sortedContacts.length === 0) {
      alert('No contacts to export.')
      return
    }
    const headers = ['ID', 'Name', 'Type', 'Phone', 'Location', 'Address', 'Total Referrals', 'Total Sales', 'Total Commission', 'Bonus', 'Status']
    const rows = sortedContacts.map(c => [
      c.id,
      `"${c.name || ''}"`,
      `"${c.type || c.category || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.location || ''}"`,
      `"${c.address || ''}"`,
      c.totalReferrals || 0,
      c.totalSales || 0,
      c.totalCommission || 0,
      c.bonus || 0,
      `"${c.status || 'Active'}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ag_traders_contacts_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1600px] mx-auto min-h-screen relative">
      {/* ─── Floating Toast Notification ───────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Datalist for Customer Autocomplete ──────────────────────────────── */}
      <datalist id="customer-suggestions">
        {customerSuggestions.map((name, i) => (
          <option key={i} value={name} />
        ))}
      </datalist>

      {/* ─── Top Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage Tile Layers, Builders, Contractors and track referral commission & bonus
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-l-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
            <button
              onClick={handleAddNew}
              className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 border-l border-blue-500 text-white text-xs rounded-r-lg transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Category Tab Pills ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          const count = categoryCounts[cat.id] ?? 0
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setCurrentPage(1)
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                isActive
                  ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[20px] text-center',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ─── Filters & Search Bar ───────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by name, phone, location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Middle: Dropdown filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Contact Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="All">Contact Type: All</option>
              <option value="Tile Layer">Tile Layer</option>
              <option value="Builder">Builder</option>
              <option value="Contractor">Contractor</option>
              <option value="Architect">Architect</option>
              <option value="Auto">Auto</option>
              <option value="Others">Others</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>
                  {loc === 'All' ? 'Location: All' : loc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortField === 'none' ? 'default' : `${sortField}_${sortDirection}`}
              onChange={(e) => handleSortPresetChange(e.target.value)}
              className={cn(
                "appearance-none pl-8 pr-8 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors",
                sortField !== 'none'
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                  : "bg-slate-50/70 border-slate-200 text-slate-700 font-medium"
              )}
            >
              <option value="default">Sort by: Default</option>
              <option value="referrals_desc">🔥 More Referrals (High → Low)</option>
              <option value="referrals_asc">📉 Less Referrals (Low → High)</option>
              <option value="sales_desc">💰 More Sales (High → Low)</option>
              <option value="sales_asc">📉 Less Sales (Low → High)</option>
              <option value="commission_desc">💵 More Commission (High → Low)</option>
              <option value="commission_asc">📉 Less Commission (Low → High)</option>
              <option value="bonus_desc">🎁 More Bonus (High → Low)</option>
              <option value="bonus_asc">📉 Less Bonus (Low → High)</option>
              <option value="name_asc">🔤 Name (A → Z)</option>
              <option value="name_desc">🔤 Name (Z → A)</option>
            </select>
            <SlidersHorizontal className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none", sortField !== 'none' ? "text-blue-600" : "text-slate-400")} />
            <ChevronDown className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none", sortField !== 'none' ? "text-blue-600" : "text-slate-400")} />
          </div>

          {/* More Filters button */}
          <button
            onClick={() => {
              setTypeFilter('All')
              setStatusFilter('All')
              setLocationFilter('All')
              setSelectedCategory('All')
              setSearchQuery('')
              setSortField('none')
              setSortDirection('desc')
              setCurrentPage(1)
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Right Actions: Export & View mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Quick Sort & Summary Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium text-[11px]">Quick sort:</span>
          <button
            type="button"
            onClick={() => handleSort('referrals')}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs",
              sortField === 'referrals'
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <span>🔥 More Referrals</span>
            {sortField === 'referrals' ? (
              sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSort('sales')}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs",
              sortField === 'sales'
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <span>💰 More Sales</span>
            {sortField === 'sales' ? (
              sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSort('commission')}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs",
              sortField === 'commission'
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <span>💵 More Commission</span>
            {sortField === 'commission' ? (
              sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSort('bonus')}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs",
              sortField === 'bonus'
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <span>🎁 More Bonus</span>
            {sortField === 'bonus' ? (
              sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
            )}
          </button>

          {sortField !== 'none' && (
            <button
              type="button"
              onClick={() => {
                setSortField('none')
                setSortDirection('desc')
                setCurrentPage(1)
              }}
              className="text-[11px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Reset Sort</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Showing <strong>{sortedContacts.length}</strong> contacts
          {sortField !== 'none' && (
            <span className="text-blue-600 font-semibold ml-1">
              • Sorted by {sortField.toUpperCase()} ({sortDirection === 'desc' ? 'High → Low' : 'Low → High'})
            </span>
          )}
        </div>
      </div>

      {/* ─── Upper Half: Contacts Table ─────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th
                    onClick={() => handleSort('name')}
                    className={cn(
                      "py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-slate-900 group/th",
                      sortField === 'name' && "bg-blue-50/70 text-blue-700 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      {sortField === 'name' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th
                    onClick={() => handleSort('location')}
                    className={cn(
                      "py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-slate-900 group/th",
                      sortField === 'location' && "bg-blue-50/70 text-blue-700 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>Location</span>
                      {sortField === 'location' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('referrals')}
                    className={cn(
                      "py-3.5 px-4 text-center cursor-pointer select-none transition-colors hover:text-slate-900 group/th",
                      sortField === 'referrals' && "bg-blue-50/70 text-blue-700 font-bold"
                    )}
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Total Referrals</span>
                      {sortField === 'referrals' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('sales')}
                    className={cn(
                      "py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-slate-900 group/th",
                      sortField === 'sales' && "bg-blue-50/70 text-blue-700 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Sales</span>
                      {sortField === 'sales' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('commission')}
                    className={cn(
                      "py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-slate-900 group/th",
                      sortField === 'commission' && "bg-blue-50/70 text-blue-700 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Commission</span>
                      {sortField === 'commission' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('bonus')}
                    className={cn(
                      "py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-slate-900 group/th",
                      sortField === 'bonus' && "bg-blue-50/70 text-blue-700 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>Bonus</span>
                      {sortField === 'bonus' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <p className="font-medium text-slate-600">No contacts found</p>
                        <p className="text-slate-400 text-xs">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((contact, idx) => {
                    const isSelected = selectedContactId === contact.id
                    const initials = getInitials(contact.name)
                    const colorClass = contact.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length]
                    const typeBadge = TYPE_BADGE_STYLES[contact.type || contact.category] || TYPE_BADGE_STYLES.Others

                    return (
                      <tr
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className={cn(
                          'hover:bg-slate-50/80 cursor-pointer transition-colors group',
                          isSelected && 'bg-blue-50/30 font-medium'
                        )}
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>

                        {/* Name with Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs',
                              colorClass
                            )}>
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {contact.name}
                            </span>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border',
                            typeBadge
                          )}>
                            {contact.type || contact.category || 'General'}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {contact.phone}
                        </td>

                        {/* Location */}
                        <td className={cn("py-3.5 px-4 text-slate-600", sortField === 'location' && "bg-blue-50/40 text-blue-800 font-semibold")}>
                          {contact.location}
                        </td>

                        {/* Total Referrals */}
                        <td className={cn(
                          "py-3.5 px-4 text-center font-bold text-slate-900",
                          sortField === 'referrals' && "bg-blue-50/50 text-blue-700 font-extrabold"
                        )}>
                          {contact.totalReferrals || contact.referrals?.length || 0}
                        </td>

                        {/* Total Sales */}
                        <td className={cn(
                          "py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap",
                          sortField === 'sales' && "bg-blue-50/50 text-blue-700 font-extrabold"
                        )}>
                          {formatCurrency(contact.totalSales || 0)}
                        </td>

                        {/* Total Commission */}
                        <td className={cn(
                          "py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap",
                          sortField === 'commission' && "bg-blue-50/50 text-blue-700 font-extrabold"
                        )}>
                          {formatCurrency(contact.totalCommission || 0)}
                        </td>

                        {/* Bonus */}
                        <td className={cn(
                          "py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap",
                          sortField === 'bonus' && "bg-blue-50/50 text-blue-700 font-extrabold"
                        )}>
                          {contact.bonus > 0 ? formatCurrency(contact.bonus) : '₹0'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              (contact.status || 'Active').toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                            )} />
                            <span className="font-medium text-slate-700 text-xs">
                              {contact.status || 'Active'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedContactId(contact.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleEdit(contact, e)}
                              className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                              title="Edit Contact"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(contact.id, e)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination */}
          <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing {sortedContacts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedContacts.length)} of {sortedContacts.length} contacts
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1
                  if (totalPages > 6 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                    if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="px-1 text-slate-400">...</span>
                    }
                    return null
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-white'
                      )}
                    >
                      {page}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="appearance-none pl-2.5 pr-7 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 cursor-pointer focus:outline-none"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedContacts.map((contact, idx) => {
            const isSelected = selectedContactId === contact.id
            const initials = getInitials(contact.name)
            const colorClass = contact.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length]
            const typeBadge = TYPE_BADGE_STYLES[contact.type || contact.category] || TYPE_BADGE_STYLES.Others

            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={cn(
                  'bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md relative',
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/80 shadow-xs'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-xs', colorClass)}>
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{contact.name}</h3>
                      <span className={cn('inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold border', typeBadge)}>
                        {contact.type || contact.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleEdit(contact, e)} className="p-1.5 text-slate-400 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(contact.id, e)} className="p-1.5 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Sales</span>
                    <span className="font-bold text-slate-800">{formatCurrency(contact.totalSales || 0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Commission</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(contact.totalCommission || 0)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Lower Half: Selected Contact Detail Card (Clean & Proper Layout) ── */}
      {selectedContact && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          {/* Top Profile Header: Identity on Left, Edit Actions on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-xs shrink-0',
                selectedContact.avatarColor || 'bg-purple-500 text-white'
              )}>
                {getInitials(selectedContact.name)}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {selectedContact.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {selectedContact.status || 'Active'}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {selectedContact.type || selectedContact.category || 'Tile Layer'}
                </p>
                {selectedContact.quote && (
                  <p className="text-xs text-slate-400 italic mt-0.5">
                    &quot;{selectedContact.quote}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Edit & Options Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleEdit(selectedContact, e)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Contact</span>
              </button>

              <button
                onClick={(e) => handleDelete(selectedContact.id, e)}
                className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-50 transition-colors"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Metric KPI Cards in a clean, robust 4-column responsive grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* KPI 1: Total Referrals */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-none">
                  {selectedContact.totalReferrals || selectedContact.referrals?.length || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Total Referrals</div>
              </div>
            </div>

            {/* KPI 2: Total Sales Value */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(selectedContact.totalSales || 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Total Sales Value</div>
              </div>
            </div>

            {/* KPI 3: Total Commission */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(selectedContact.totalCommission || 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Total Commission</div>
              </div>
            </div>

            {/* KPI 4: Total Bonus */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(selectedContact.bonus || 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Total Bonus</div>
              </div>
            </div>
          </div>

          {/* Lower Section: 2 Columns (Profile details on left, Tabs and subtable on right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            {/* Left Column: Contact Profile Metadata List */}
            <div className="lg:col-span-4 space-y-4 text-xs">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">Phone</div>
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {selectedContact.phone || '—'}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">WhatsApp</div>
                  <a
                    href={`https://wa.me/91${(selectedContact.whatsapp || selectedContact.phone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <span>{selectedContact.whatsapp || selectedContact.phone || '—'}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">Location</div>
                  <div className="font-semibold text-slate-800">{selectedContact.location || '—'}</div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <Home className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">Address</div>
                  <div className="font-medium text-slate-700 leading-relaxed">
                    {selectedContact.address || 'Near Bus Stand, Tiruchengode'}
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">Experience</div>
                  <div className="font-semibold text-slate-800">{selectedContact.experience || '10+ years'}</div>
                </div>
              </div>

              {/* Specialization */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">Specialization</div>
                  <div className="font-semibold text-slate-800">
                    {selectedContact.specialization || 'Tiles, Bathroom, Kitchen'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 font-medium">Notes</div>
                  <div className="text-slate-600 leading-relaxed">
                    {selectedContact.notes || 'Reliable and good quality work. Regular customer referrals.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Detail Tabs & Sub-table */}
            <div className="lg:col-span-8 space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveDetailTab('referrals')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    activeDetailTab === 'referrals'
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Referral Sales</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('commission')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    activeDetailTab === 'commission'
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Commission History</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('bonus')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    activeDetailTab === 'bonus'
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Bonus History</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('notes')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    activeDetailTab === 'notes'
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Notes</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('documents')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    activeDetailTab === 'documents'
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Documents</span>
                </button>
              </div>

              {/* Tab 1: Referral Sales Sub-table */}
              {activeDetailTab === 'referrals' && (
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden space-y-0">
                  {/* Action Bar inside tab: Add Sale Button */}
                  <div className="p-3.5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Referral Sales & Orders
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Track tile orders referred by {selectedContact.name} and automatically calculate commission
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAddSaleModal()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Sale & Commission</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="py-3 px-3.5 w-10 text-center">#</th>
                          <th className="py-3 px-3.5">Date</th>
                          <th className="py-3 px-3.5">Customer Name</th>
                          <th className="py-3 px-3.5">Bill / Order Ref</th>
                          <th className="py-3 px-3.5">Sale Value</th>
                          <th className="py-3 px-3.5">Commission %</th>
                          <th className="py-3 px-3.5">Commission Amount</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(!selectedContact.referrals || selectedContact.referrals.length === 0) ? (
                          <tr>
                            <td colSpan={9} className="py-10 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Receipt className="w-8 h-8 text-slate-300" />
                                <p className="font-medium text-slate-600 text-xs">No referral sales recorded yet</p>
                                <button
                                  onClick={() => handleOpenAddSaleModal()}
                                  className="mt-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                                >
                                  + Record First Sale
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          selectedContact.referrals.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="py-3 px-3.5 text-center text-slate-400 font-medium">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3.5 text-slate-600 font-medium whitespace-nowrap">
                                {item.date}
                              </td>
                              <td className="py-3 px-3.5 font-semibold text-slate-900">
                                <div>{item.customerName}</div>
                                {item.items && (
                                  <div className="text-[10px] text-slate-400 font-normal truncate max-w-[160px]">{item.items}</div>
                                )}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                {(item.orderId || (item.notes && item.notes.toUpperCase().startsWith('ORD-'))) ? (
                                  <button
                                    onClick={() => handleViewOrderDetails(item.orderId || item.notes)}
                                    title="Click to view linked Sales Order Bill"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs group/btn"
                                  >
                                    <ShoppingCart className="w-3 h-3 text-blue-600" />
                                    <span>{item.orderId || item.notes}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/btn:translate-x-0.5 transition-transform" />
                                  </button>
                                ) : item.notes ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-medium">
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    <span>{item.notes}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                                {formatCurrency(item.saleValue)}
                              </td>
                              <td className="py-3 px-3.5 text-slate-600 font-medium">
                                {item.commissionPercent}%
                              </td>
                              <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                                {formatCurrency(item.commissionAmount)}
                              </td>
                              <td className="py-3 px-3.5">
                                <button
                                  onClick={() => handleToggleSaleStatus(item)}
                                  title="Click to toggle status (Paid / Pending)"
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                                    (item.status || 'Paid').toLowerCase() === 'paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-100'
                                  )}
                                >
                                  {(item.status || 'Paid').toLowerCase() === 'paid' && <Check className="w-3 h-3 text-emerald-600" />}
                                  <span>{item.status || 'Paid'}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                                  <button
                                    onClick={() => handleOpenAddSaleModal(item)}
                                    className="p-1 text-slate-400 hover:text-blue-600"
                                    title="Edit Sale"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSale(item.id)}
                                    className="p-1 text-slate-400 hover:text-red-600"
                                    title="Delete Sale"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Total {selectedContact.referrals?.length || 0} referral sales recorded
                    </span>
                    <button
                      onClick={() => handleOpenAddSaleModal()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <span>+ Add Another Sale</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Commission History */}
              {activeDetailTab === 'commission' && (
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Commission Payout Records</h3>
                      <p className="text-[11px] text-slate-400">Log payments made to {selectedContact.name} via UPI, NEFT or Cash</p>
                    </div>
                    <button
                      onClick={handleOpenPayoutModal}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Payout</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="py-3 px-3.5">Date</th>
                          <th className="py-3 px-3.5">Voucher #</th>
                          <th className="py-3 px-3.5">Amount</th>
                          <th className="py-3 px-3.5">Payment Mode</th>
                          <th className="py-3 px-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(!selectedContact.commissionHistory || selectedContact.commissionHistory.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No commission payouts recorded yet.
                            </td>
                          </tr>
                        ) : (
                          selectedContact.commissionHistory.map((c, i) => (
                            <tr key={c.id || i} className="hover:bg-slate-50/80">
                              <td className="py-3 px-3.5 text-slate-600 font-medium">{c.date}</td>
                              <td className="py-3 px-3.5 font-semibold text-slate-900">{c.voucher}</td>
                              <td className="py-3 px-3.5 font-bold text-emerald-600">{formatCurrency(c.amount)}</td>
                              <td className="py-3 px-3.5 text-slate-600">{c.mode}</td>
                              <td className="py-3 px-3.5">
                                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Bonus History */}
              {activeDetailTab === 'bonus' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Milestone Bonus History</h3>
                      <p className="text-[11px] text-slate-400">Incentives awarded for hitting referral milestones</p>
                    </div>
                    <button
                      onClick={handleOpenBonusModal}
                      className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Award Bonus</span>
                    </button>
                  </div>

                  {(!selectedContact.bonusHistory || selectedContact.bonusHistory.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No milestone bonus history recorded yet.
                    </div>
                  ) : (
                    selectedContact.bonusHistory.map((b, i) => (
                      <div key={b.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{b.title}</div>
                            <div className="text-[11px] text-slate-400">{b.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-pink-600 text-sm">+{formatCurrency(b.amount)}</div>
                          <span className="text-[10px] text-emerald-600 font-semibold">{b.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Notes */}
              {activeDetailTab === 'notes' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                    {selectedContact.notes || 'No internal notes added.'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Use Edit Contact to update notes and customer feedback.
                  </div>
                </div>
              )}

              {/* Tab 5: Documents */}
              {activeDetailTab === 'documents' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 text-xs">
                  {(!selectedContact.documents || selectedContact.documents.length === 0) ? (
                    <div className="py-8 text-center text-slate-400">
                      No documents uploaded yet.
                    </div>
                  ) : (
                    selectedContact.documents.map((doc, i) => (
                      <div key={doc.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Folder className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium text-slate-800">{doc.title}</div>
                            <div className="text-[10px] text-slate-400">{doc.date} • {doc.type}</div>
                          </div>
                        </div>
                        <button className="text-blue-600 font-semibold text-xs hover:underline">
                          Download
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT REFERRAL SALE & COMMISSION ────────────────────── */}
      {isAddSaleOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSale ? 'Edit Referral Sale' : 'Add Sale & Commission'}
                </h3>
                <p className="text-xs text-slate-500">
                  Referral by <span className="font-semibold text-blue-600">{selectedContact.name}</span> ({selectedContact.type || 'Tile Layer'})
                </p>
              </div>
              <button
                onClick={() => setIsAddSaleOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveSaleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              {saleError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saleError}</span>
                </div>
              )}

              {/* Date & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sale Date *</label>
                  <input
                    type="date"
                    required
                    value={saleForm.date}
                    onChange={e => setSaleForm({ ...saleForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Customer / Project Name *</label>
                  <input
                    type="text"
                    required
                    list="customer-suggestions"
                    value={saleForm.customerName}
                    onChange={e => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    placeholder="e.g. Kumar Residence"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              {/* Site Location & Tile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Site Location (Optional)</label>
                  <input
                    type="text"
                    value={saleForm.location}
                    onChange={e => setSaleForm({ ...saleForm, location: e.target.value })}
                    placeholder="e.g. Velur Road, Tiruchengode"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tile Details / Items</label>
                  <input
                    type="text"
                    value={saleForm.items}
                    onChange={e => setSaleForm({ ...saleForm, items: e.target.value })}
                    placeholder="e.g. 48x24 PGVT 1,200 sqft"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              {/* Sale Value & Direct Commission Amount (Bidirectional) */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/80 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Sale Value */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Tile Sale Value (₹) *</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={saleForm.saleValue}
                        onChange={e => handleSaleValueChange(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-blue-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Direct Commission Amount Input */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Commission Amount (₹) *</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.5 rounded">Direct Entry</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={saleForm.commissionAmount}
                        onChange={e => handleCommissionAmountChange(e.target.value)}
                        placeholder="e.g. 35"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-xl font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-emerald-700 placeholder-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Commission Rate (%) with Quick Chips & Custom Input */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 text-xs">
                      Commission Rate (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Effective rate:</span>
                      <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        {saleForm.commissionPercent || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[3, 3.5, 5, 7.5, 10].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleCommissionRateChange(pct)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all',
                          Number(saleForm.commissionPercent) === pct
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                    {/* Custom % input */}
                    <div className="relative flex-1 min-w-[90px]">
                      <input
                        type="number"
                        step="any"
                        value={saleForm.commissionPercent}
                        onChange={e => handleCommissionRateChange(e.target.value)}
                        placeholder="Custom %"
                        className="w-full pr-6 pl-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Summary Badge */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 text-[11px] sm:text-xs">
                      {parseFloat(saleForm.saleValue) > 0 && parseFloat(saleForm.commissionAmount) >= 0 ? (
                        <>
                          <strong className="text-emerald-700 font-bold">{formatCurrency(parseFloat(saleForm.commissionAmount) || 0)}</strong>
                          {' '}commission on{' '}
                          <strong className="text-slate-900 font-semibold">{formatCurrency(parseFloat(saleForm.saleValue) || 0)}</strong>
                          {' '}(={saleForm.commissionPercent || 0}%)
                        </>
                      ) : (
                        'Enter sale value and commission amount or rate'
                      )}
                    </span>
                  </div>

                  {parseFloat(saleForm.saleValue) > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      1000 purchase @ ₹35 = 3.5%
                    </span>
                  )}
                </div>
              </div>

              {/* Commission Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Commission Payment Status</label>
                  <select
                    value={saleForm.status}
                    onChange={e => setSaleForm({ ...saleForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  >
                    <option value="Paid">Paid (Immediately Dispatched)</option>
                    <option value="Pending">Pending (Pay After Delivery)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Bill / Voucher Reference</span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                        Type ORD # to Auto-Link
                      </span>
                    </label>
                    {ordersList.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {ordersList.length} Order{ordersList.length > 1 ? 's' : ''} in system
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      list="sales-orders-datalist"
                      value={saleForm.notes}
                      onChange={e => handleNotesChange(e.target.value)}
                      placeholder="e.g. ORD-001 or Invoice / UPI Ref"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono text-xs font-semibold uppercase placeholder:font-sans placeholder:normal-case"
                    />
                    <datalist id="sales-orders-datalist">
                      {ordersList.map(ord => (
                        <option key={ord.id} value={ord.id}>
                          {ord.id} — Customer: {ord.customer} • {ord.total} ({ord.status || 'Confirmed'})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Quick Order Select Pills */}
                  {ordersList.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">Quick link:</span>
                      {ordersList.slice(0, 4).map(ord => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => applyOrderMapping(ord)}
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1",
                            saleForm.notes === ord.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                          )}
                        >
                          <ShoppingCart className="w-2.5 h-2.5" />
                          <span>{ord.id}</span>
                          <span className="opacity-70 font-normal">({ord.total})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Visual Banner when linked to a Sales Order */}
                  {(saleForm.linkedOrder || (saleForm.notes && ordersList.find(o => o.id.toLowerCase() === saleForm.notes.trim().toLowerCase()))) && (() => {
                    const linked = saleForm.linkedOrder || ordersList.find(o => o.id.toLowerCase() === saleForm.notes.trim().toLowerCase())
                    return (
                      <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>Linked Order: {linked.id}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200/70 text-emerald-900 rounded font-semibold">
                                {linked.status || 'Confirmed'}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-700">
                              Customer: <strong>{linked.customer}</strong> • Total Bill: <strong>{linked.total}</strong>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewOrderDetails(linked.id)}
                          className="text-[11px] font-bold text-blue-700 hover:underline bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs shrink-0 cursor-pointer"
                        >
                          View Bill ↗
                        </button>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddSaleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
                >
                  {editingSale ? 'Update Sale & Commission' : 'Save Sale & Commission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SALES ORDER BILL PREVIEW ─────────────────────────────────── */}
      {isOrderModalOpen && viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Sales Order Bill: {viewingOrder.id}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      {viewingOrder.status || 'Confirmed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Official AG TRADERS Sales Order Bill & Specifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Bill Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Customer</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 truncate">{viewingOrder.customer || '–'}</div>
                  {viewingOrder.phone && <div className="text-[11px] text-slate-500 truncate">{viewingOrder.phone}</div>}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Order Date</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{viewingOrder.date || '–'}</div>
                  <div className="text-[11px] text-slate-500 truncate">Delivery: {viewingOrder.delivery || 'Standard'}</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-[10px] text-blue-600 uppercase font-semibold">Total Bill</div>
                  <div className="font-extrabold text-blue-700 text-base mt-0.5">{viewingOrder.total || '₹0'}</div>
                  <div className="text-[11px] text-blue-600">{viewingOrder.items || 0} Total Items</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[10px] text-emerald-600 uppercase font-semibold">Linked Contact</div>
                  <div className="font-bold text-emerald-800 text-xs mt-0.5 truncate">{selectedContact?.name || 'Contact'}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">{selectedContact?.type || 'Referral'}</div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 font-semibold text-slate-700 text-xs flex items-center justify-between">
                  <span>Tile Items & Specifications</span>
                  <span className="text-[11px] text-slate-400 font-mono font-medium">Order #{viewingOrder.id}</span>
                </div>

                {((viewingOrder.itemsdetails && viewingOrder.itemsdetails.length > 0) || (viewingOrder.itemsList && viewingOrder.itemsList.length > 0)) ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] text-slate-500">
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Rate</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingOrder.itemsdetails || viewingOrder.itemsList).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{it.description || 'Tile Item'}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{it.quantity} {it.unit || 'Boxes'}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{it.rate ? `₹${it.rate}` : '–'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{it.amount ? `₹${it.amount.toLocaleString('en-IN')}` : '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700">Tiles Order ({viewingOrder.items || 0} items confirmed)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Total Confirmed Bill: {viewingOrder.total}</p>
                  </div>
                )}
              </div>

              {/* Dispatch & Payment Notes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Delivery & Logistics Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>Delivery Type: <span className="font-medium text-slate-800">{viewingOrder.deliverytype || viewingOrder.deliveryType || 'Standard'}</span></div>
                  <div>Transport: <span className="font-medium text-slate-800">{viewingOrder.transport || 'Company / Direct'}</span></div>
                  <div>Handled By: <span className="font-medium text-slate-800">{viewingOrder.handleby || viewingOrder.handleBy || 'Sales'}</span></div>
                  <div>Payment Mode: <span className="font-medium text-slate-800">{viewingOrder.balancemode || viewingOrder.balanceMode || 'Cash / UPI'}</span></div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsOrderModalOpen(false)
                  navigate('/orders')
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Open in Sales Orders Page</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD COMMISSION PAYOUT ─────────────────────────────────── */}
      {isPayoutOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Commission Payout</h3>
                <p className="text-xs text-slate-500">Pay commission to {selectedContact.name}</p>
              </div>
              <button onClick={() => setIsPayoutOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayoutSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payout Date</label>
                <input
                  type="date"
                  required
                  value={payoutForm.date}
                  onChange={e => setPayoutForm({ ...payoutForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Voucher / Ref Number</label>
                <input
                  type="text"
                  required
                  value={payoutForm.voucher}
                  onChange={e => setPayoutForm({ ...payoutForm, voucher: e.target.value })}
                  placeholder="e.g. VCH-8822"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payout Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={payoutForm.mode}
                  onChange={e => setPayoutForm({ ...payoutForm, mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="Bank NEFT">Bank NEFT / IMPS</option>
                  <option value="Bank RTGS">Bank RTGS</option>
                  <option value="Cash Payout">Cash Handover</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: AWARD BONUS ──────────────────────────────────────────────── */}
      {isBonusOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Award Milestone Bonus</h3>
                <p className="text-xs text-slate-500">Reward {selectedContact.name} for high volume referrals</p>
              </div>
              <button onClick={() => setIsBonusOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBonusSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bonus Title / Milestone</label>
                <input
                  type="text"
                  required
                  value={bonusForm.title}
                  onChange={e => setBonusForm({ ...bonusForm, title: e.target.value })}
                  placeholder="e.g. Diwali 10+ Referrals Milestone"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bonus Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={bonusForm.amount}
                  onChange={e => setBonusForm({ ...bonusForm, amount: e.target.value })}
                  placeholder="5000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-pink-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Date Awarded</label>
                <input
                  type="date"
                  required
                  value={bonusForm.date}
                  onChange={e => setBonusForm({ ...bonusForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBonusOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700"
                >
                  Award Bonus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT CONTACT ───────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the professional details and referral tracking parameters
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Murugan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Contact Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Contact Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  >
                    <option value="Tile Layer">Tile Layer</option>
                    <option value="Builder">Builder</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Architect">Architect</option>
                    <option value="Auto">Auto</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Tiruchengode"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Experience</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 10+ years"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Specialization */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Tiles, Bathroom, Kitchen"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Full Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Near Bus Stand, Tiruchengode"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Quote / Motto */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Tagline / Motto</label>
                  <input
                    type="text"
                    value={formData.quote}
                    onChange={e => setFormData({ ...formData, quote: e.target.value })}
                    placeholder='e.g. "Quality work, long term partnership"'
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Total Sales & Commission values */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Total Sales (₹)</label>
                  <input
                    type="number"
                    value={formData.totalSales}
                    onChange={e => {
                      const sales = Number(e.target.value) || 0
                      setFormData({
                        ...formData,
                        totalSales: sales,
                        totalCommission: Math.round(sales * 0.05)
                      })
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Bonus (₹)</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={e => setFormData({ ...formData, bonus: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Reliable and good quality work. Regular customer referrals."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
                >
                  {editingContact ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
