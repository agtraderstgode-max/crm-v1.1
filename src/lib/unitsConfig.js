/**
 * Standard Units Master Configuration & Utility Library
 * 
 * Preloads all standard measurement units for Tiles, Sanitaryware, Adhesives, 
 * Hardware, and Chemicals with smart detection and formatting.
 */

export const PRELOADED_UNITS = [
  {
    id: 'boxes',
    label: 'Boxes (bxs)',
    fullName: 'Boxes (Tiles Carton)',
    shortLabel: 'Boxes',
    singular: 'Box',
    category: 'Tiles',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Ceramic, Vitrified, Floor & Wall Tiles in packed cartons',
    defaultFor: ['KAG', 'TILES', 'FLOOR', 'WALL', 'PARKING', 'ELEVATION']
  },
  {
    id: 'pcs',
    label: 'Pieces (pcs)',
    fullName: 'Pieces / Pcs (Sanitaryware & Fixtures)',
    shortLabel: 'Pcs',
    singular: 'Pc',
    category: 'Sanitaryware',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Single pieces of Closets, Washbasins, Urinals, Vanity, Mirrors & CP Fittings',
    defaultFor: ['PUPA', 'SANITARY', 'BASIN', 'CLOSET', 'COMMODE', 'SEAT', 'TAP', 'FAUCET']
  },
  {
    id: 'bags',
    label: 'Bags (bags)',
    fullName: 'Bags (Tile Adhesive & Grout)',
    shortLabel: 'Bags',
    singular: 'Bag',
    category: 'Adhesives & Pastes',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Tile adhesive pastes, joint grouts, wall putty (20kg / 40kg / 50kg bags)',
    defaultFor: ['ROFF', 'ADHESIVE', 'PASTE', 'GROUT', 'EPOXY', 'CEMENT', 'BOND']
  },
  {
    id: 'sqft',
    label: 'Sq.Ft (sqft)',
    fullName: 'Square Feet (Tiles Area)',
    shortLabel: 'Sq.Ft',
    singular: 'Sq.Ft',
    category: 'Tiles Area',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Floor and wall area coverage measurement',
    defaultFor: ['AREA', 'COVERAGE', 'SQFT']
  },
  {
    id: 'nos',
    label: 'Numbers (nos)',
    fullName: 'Numbers / Count (Nos)',
    shortLabel: 'Nos',
    singular: 'No',
    category: 'General Items',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Discrete quantity count for fixtures and accessories',
    defaultFor: ['ACCESSORIES', 'SCREWS', 'SPACERS']
  },
  {
    id: 'sets',
    label: 'Sets (sets)',
    fullName: 'Sets (Combos & Kits)',
    shortLabel: 'Sets',
    singular: 'Set',
    category: 'Combos & Kits',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Bathroom combo sets, diverter kits, washbasin + counter sets',
    defaultFor: ['SET', 'COMBO', 'HARDWARE', 'KIT']
  },
  {
    id: 'kg',
    label: 'Kilograms (kg)',
    fullName: 'Kilograms (Kg)',
    shortLabel: 'Kg',
    singular: 'Kg',
    category: 'Chemicals & Pastes',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Weight-based adhesives, epoxy hardeners and chemical pastes',
    defaultFor: ['PASTE_KG', 'CHEMICAL']
  },
  {
    id: 'ltr',
    label: 'Liters (ltr)',
    fullName: 'Liters (Ltr)',
    shortLabel: 'Ltr',
    singular: 'Ltr',
    category: 'Liquids & Chemicals',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Waterproofing chemicals, tile cleaners and primers',
    defaultFor: ['CLEANER', 'WATERPROOFING', 'LIQUID']
  }
]

/**
 * Normalizes any free-text unit into a canonical unit ID
 */
export function normalizeUnit(rawUnit) {
  if (!rawUnit) return 'boxes'
  const u = String(rawUnit).trim().toLowerCase()
  if (u.includes('pc') || u.includes('piece') || u.includes('item')) return 'pcs'
  if (u.includes('bag')) return 'bags'
  if (u.includes('sqft') || u.includes('sq.ft') || u.includes('sq ft') || u.includes('square')) return 'sqft'
  if (u.includes('set')) return 'sets'
  if (u.includes('no') || u.includes('num')) return 'nos'
  if (u.includes('kg') || u.includes('kilo')) return 'kg'
  if (u.includes('ltr') || u.includes('litre') || u.includes('liter')) return 'ltr'
  if (u.includes('box') || u.includes('bx') || u.includes('ctn') || u.includes('carton')) return 'boxes'
  return 'boxes'
}

/**
 * Smart auto-detect standard unit based on product brand, category, and name
 */
export function detectDefaultUnit(meta = {}) {
  const brand = (meta.brand || '').toUpperCase()
  const name = (meta.name || '').toUpperCase()
  const category = (meta.category || meta.category_name || '').toUpperCase()
  const type = (meta.type || '').toUpperCase()

  // 1. Check Sanitaryware indicators
  if (
    brand.includes('PUPA') || 
    type === 'SANITARY' || 
    category.includes('SANITARY') ||
    name.includes('CLOSET') || 
    name.includes('BASIN') || 
    name.includes('COMMODE') || 
    name.includes('URINAL') || 
    name.includes('FAUCET') || 
    name.includes('TAP') || 
    name.includes('SEAT') ||
    name.includes('VANITY') ||
    name.includes('MIRROR')
  ) {
    return 'pcs'
  }

  // 2. Check Adhesive / Paste indicators
  if (
    brand.includes('ROFF') || 
    type === 'ADHESIVE' || 
    category.includes('ADHESIVE') ||
    name.includes('ADHESIVE') || 
    name.includes('PASTE') || 
    name.includes('GROUT') || 
    name.includes('EPOXY') || 
    name.includes('BOND') || 
    name.includes('PUTTY') || 
    name.includes('MORTAR')
  ) {
    return 'bags'
  }

  // 3. Check Hardware / Sets indicators
  if (type === 'HARDWARE' || name.includes('SET') || name.includes('KIT') || category.includes('HARDWARE')) {
    return 'sets'
  }

  // 4. Default for Tiles (KAG, Vitrified, Ceramic, Wall, Floor)
  return 'boxes'
}

/**
 * Returns the meta configuration object for a unit key
 */
export function getUnitMeta(rawUnit) {
  const id = normalizeUnit(rawUnit)
  return PRELOADED_UNITS.find(u => u.id === id) || PRELOADED_UNITS[0]
}

/**
 * Formats a quantity with singular/plural unit label
 * e.g. formatUnitQty(1, 'pcs') => "1 Pc", formatUnitQty(10, 'pcs') => "10 Pcs"
 * e.g. formatUnitQty(1, 'boxes') => "1 Box", formatUnitQty(10, 'boxes') => "10 Boxes"
 * e.g. formatUnitQty(1, 'bags') => "1 Bag", formatUnitQty(10, 'bags') => "10 Bags"
 */
export function formatUnitQty(qty, rawUnit) {
  const count = parseFloat(qty) || 0
  const meta = getUnitMeta(rawUnit)
  const isSingular = Math.abs(count) === 1
  const label = isSingular ? meta.singular : meta.shortLabel
  return `${count.toLocaleString('en-IN')} ${label}`
}

/**
 * Returns appropriate badge color classes for a given unit
 */
export function getUnitBadgeStyle(rawUnit) {
  return getUnitMeta(rawUnit).badgeColor
}
