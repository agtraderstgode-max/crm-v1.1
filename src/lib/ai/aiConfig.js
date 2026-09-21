/**
 * AG TRADERS CRM — Central AI Configuration & System Prompts
 */

export const AI_MODELS = {
  GEMINI_DEFAULT: 'gemini-2.5-flash',
  GEMINI_PRO: 'gemini-2.5-pro',
  MISTRAL_DEFAULT: 'mistral-large-latest',
  MISTRAL_SMALL: 'mistral-small-latest'
}

export const AI_PROVIDERS = {
  GOOGLE: 'google',
  MISTRAL: 'mistral',
  AUTO: 'auto'
}

export const AG_TRADERS_PERSONA = `
You are AG AI, the dedicated Senior Sales & Operations AI Assistant for AG TRADERS — KAG Tiles Exclusive Showroom located in Tiruchengode, Tamil Nadu.

Business Context & Specialization:
- Company: AG TRADERS (KAG Tiles Exclusive Showroom, Tiruchengode).
- Core Products: Premium Floor Tiles, Wall Tiles, PGVT, GVT, High Gloss (HG), Carving Finish, Matt Finish, Parking Tiles, Elevation Tiles, Steps/Risers, Adhesives & Grouts.
- Standard Tile Dimensions: 12x12, 18x12, 24x12, 24x24, 48x24 (4x2), 48x48 (4x4), 64x32.
- Key Operations: Customer Enquiries, Site Measurements, 2D Tile Quotations, Sales Orders, Warehouse Stock Verification, Delivery & Dispatch Tracking, Follow-ups, and Referral Commissions for Masons/Engineers/Contractors.

Your Behavior & Tone:
1. Professional, courteous, energetic, and highly practical.
2. Naturally converse in the language preferred by the user: Tamil, English, or conversational Tanglish (e.g., "Vanakkam! Lead details check panren...").
3. Always provide accurate, concise, and structured answers with bullet points when listing data or options.
4. If asked about prices or stock without exact product IDs, clarify friendly and guide them to check the Products or Stock module.
`.trim()

/**
 * Resolves API keys across various execution environments:
 * Priority: Explicit header/payload > process.env (Node) > localStorage (Browser)
 */
export function resolveApiKeys(options = {}) {
  const { headers = {}, body = {} } = options

  // 1. Google Gemini Key
  let geminiKey = 
    headers['x-gemini-key'] ||
    headers['X-Gemini-Key'] ||
    body.geminiKey ||
    body.apiKey ||
    ''

  // If running in Node.js
  if (!geminiKey && typeof process !== 'undefined' && process.env) {
    geminiKey = process.env.GEMINI_API_KEY || ''
  }

  // If running in Browser
  if (!geminiKey && typeof window !== 'undefined' && window.localStorage) {
    try {
      geminiKey = window.localStorage.getItem('gemini_api_key') || ''
    } catch {
      // Ignore localStorage access restrictions
    }
  }

  // 2. Mistral Key
  let mistralKey = 
    headers['x-mistral-key'] ||
    headers['X-Mistral-Key'] ||
    body.mistralKey ||
    ''

  if (!mistralKey && typeof process !== 'undefined' && process.env) {
    mistralKey = process.env.MISTRAL_API_KEY || ''
  }

  if (!mistralKey && typeof window !== 'undefined' && window.localStorage) {
    try {
      mistralKey = window.localStorage.getItem('mistral_api_key') || ''
    } catch {
      // Ignore localStorage access restrictions
    }
  }

  // 3. Provider Choice
  const provider = 
    headers['x-provider'] ||
    body.provider ||
    (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('gemini_provider') : null) ||
    AI_PROVIDERS.AUTO

  return {
    geminiKey: geminiKey.trim(),
    mistralKey: mistralKey.trim(),
    provider
  }
}
