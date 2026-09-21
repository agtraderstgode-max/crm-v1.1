import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

/**
 * Route metadata mapping for AG AI Assistant
 */
const ROUTE_DEFINITIONS = {
  '/dashboard': {
    title: 'Dashboard',
    badge: '📊 Showroom KPIs',
    pills: [
      'Today sales & enquiry summary sollu',
      'Pending follow-ups ethu?',
      'Top lead conversion source enna?'
    ]
  },
  '/leads': {
    title: 'Leads & Enquiries',
    badge: '👥 Leads Pipeline',
    pills: [
      'Overdue follow-ups list pannu',
      'High priority leads ethu?',
      'Velur Road area leads filter pannu'
    ]
  },
  '/followups': {
    title: 'Follow-ups',
    badge: '⏰ Active Follow-ups',
    pills: [
      'Today follow-ups list pannu',
      'Pending customer calls summary',
      'Draft a polite follow-up WhatsApp message'
    ]
  },
  '/buying-now': {
    title: 'Buying Now (Hot Leads)',
    badge: '🔥 Ready to Buy',
    pills: [
      'Immediate delivery requirements ethu?',
      'Draft instant quotation for 1000 sqft',
      'Customer discount rules check pannu'
    ]
  },
  '/customers': {
    title: 'Customers Directory',
    badge: '🤝 Customer Records',
    pills: [
      'Search repeat customers',
      'Highest purchase customer list',
      'Customer contact details lookup'
    ]
  },
  '/contacts': {
    title: 'Contacts Directory',
    badge: '📇 CRM Contacts',
    pills: [
      'Active masons & contractors list',
      'Factory suppliers contact details',
      'Find transporter for tile delivery'
    ]
  },
  '/quotations': {
    title: 'Quotation Planner',
    badge: '📐 2D Tile Estimator',
    pills: [
      'Box calculation for 12x10 living room',
      '48x24 PGVT vs 24x24 price difference',
      '10% wastage calculation formula'
    ]
  },
  '/orders': {
    title: 'Sales Orders',
    badge: '📦 Dispatch & Orders',
    pills: [
      'Pending dispatch orders list pannu',
      'Unpaid balance summary',
      'Vehicle & transport details check'
    ]
  },
  '/payments': {
    title: 'Payments Ledger',
    badge: '💳 Balances & Splits',
    pills: [
      'Today collection summary',
      'Split payments pending balance',
      'UPI vs Cash vs Bank collection'
    ]
  },
  '/billing': {
    title: 'Billing & Invoicing',
    badge: '🧾 GST Invoices',
    pills: [
      'GST tax breakdown for 18% & 28%',
      'Invoice numbering format check',
      'Recent billed orders summary'
    ]
  },
  '/products': {
    title: 'Product Catalog',
    badge: '🏷️ Tile Master Catalog',
    pills: [
      'KAG PGVT models list pannu',
      'High Gloss vs Carving finishes',
      'Standard box sqft rates check'
    ]
  },
  '/stock': {
    title: 'Warehouse Stock',
    badge: '🏢 Warehouse Inventory',
    pills: [
      'Low stock tiles alert check',
      'Available vs Reserved stock for 4x2',
      'Godown tile location check'
    ]
  },
  '/purchase-invoices': {
    title: 'Purchase Invoices (OCR)',
    badge: '📄 Supplier Invoices',
    pills: [
      'KAG India invoice scanner status',
      'Recent purchase invoice items',
      'HSN 69072300 tax verification'
    ]
  },
  '/returns': {
    title: 'Sales Returns',
    badge: '🔄 Returns & Rollback',
    pills: [
      'Recent returned orders',
      'Broken tiles return policy',
      'Stock rollback summary'
    ]
  },
  '/price-categories': {
    title: 'Price Categories',
    badge: '💰 Category Pricing',
    pills: [
      'Sqft per box conversion rules',
      'Online price vs MRP discount',
      'Category formula explanation'
    ]
  },
  '/staff': {
    title: 'Staff Management',
    badge: '👔 Staff & Attendance',
    pills: [
      'Today staff punch-in status',
      'Staff sales incentive summary',
      'Showroom shifts & timings'
    ]
  },
  '/chat': {
    title: 'Internal Team Chat',
    badge: '💬 Staff Messaging',
    pills: [
      'Draft team reminder for godown loading',
      'Meeting message to sales staff',
      'Customer arrival notice to manager'
    ]
  },
  '/letter-pad': {
    title: 'Official Letter Pad',
    badge: '📝 Letterhead Editor',
    pills: [
      'Formal quotation terms draft pannu',
      'Payment milestone & bank details text',
      'Tile delivery & unloading terms'
    ]
  },
  '/marketing': {
    title: 'Marketing & Channels',
    badge: '📢 Lead Channels',
    pills: [
      'JustDial vs Google vs Walk-in leads',
      'Campaign performance summary',
      'Tiruchengode flyer promo idea'
    ]
  },
  '/referral': {
    title: 'Referral Partners',
    badge: '🤝 Masons & Engineers',
    pills: [
      'Active referral partners list',
      'Pending commission payout summary',
      'Mason commission calculation rule'
    ]
  },
  '/analysis': {
    title: 'Business Analysis',
    badge: '📈 Distance & Conversions',
    pills: [
      'Lead conversion by KM radius',
      'Monthly sales trend analysis',
      'High margin tile categories'
    ]
  },
  '/settings': {
    title: 'System Settings',
    badge: '⚙️ Configurations',
    pills: [
      'Gemini API key status check',
      'Supabase connection state',
      'Local vs Cloud mode explanation'
    ]
  }
}

export function usePageContext() {
  const location = useLocation()
  const pathname = location.pathname

  return useMemo(() => {
    // Find matching route or fallback
    const matchedKey = Object.keys(ROUTE_DEFINITIONS).find(route => 
      pathname === route || (route !== '/' && pathname.startsWith(route))
    )

    const def = matchedKey ? ROUTE_DEFINITIONS[matchedKey] : {
      title: 'AG TRADERS CRM',
      badge: '🏢 Showroom Overview',
      pills: [
        'Today showroom overview sollu',
        'Quick actions list enna?',
        'How can you help me today?'
      ]
    }

    return {
      currentRoute: pathname,
      title: def.title,
      badge: def.badge,
      suggestedPills: def.pills
    }
  }, [pathname])
}
