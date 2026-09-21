/**
 * AG TRADERS CRM — Central AI Orchestrator Service
 * Handles context enrichment, multi-provider routing, and automated fallback.
 */

import { AG_TRADERS_PERSONA, AI_PROVIDERS, resolveApiKeys } from './aiConfig.js'
import { callGeminiChat } from './geminiProvider.js'
import { callMistralChat } from './mistralProvider.js'

/**
 * Enriches the base system prompt with real-time CRM state and context.
 */
export function buildEnrichedSystemPrompt({ customPrompt = '', context = {} }) {
  const sections = []

  // 1. Base Business Persona
  sections.push(AG_TRADERS_PERSONA)

  // 2. Real-time CRM Session Context
  const contextLines = []
  const now = new Date()
  contextLines.push(`- Current System Date & Time: ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${now.toLocaleTimeString('en-IN')}`)

  if (context.currentRoute) {
    contextLines.push(`- Active Page / Route: ${context.currentRoute}`)
  }
  if (context.staff) {
    const staffName = context.staff.name || 'Staff'
    const staffRole = context.staff.role || 'Showroom Executive'
    contextLines.push(`- Current Logged-in Staff: ${staffName} (${staffRole})`)
  }
  if (context.currentCustomer) {
    contextLines.push(`- Selected Customer in View: ${JSON.stringify(context.currentCustomer)}`)
  }
  if (context.currentLead) {
    contextLines.push(`- Selected Lead / Enquiry in View: ${JSON.stringify(context.currentLead)}`)
  }

  if (contextLines.length > 0) {
    sections.push(`\nActive CRM Context & State:\n${contextLines.join('\n')}`)
  }

  // 3. Page-specific behavioral guidance
  if (context.currentRoute) {
    const route = context.currentRoute.toLowerCase()
    if (route.includes('lead')) {
      sections.push('\nPage Guidance (Leads): The user is on the Leads & Enquiries screen. Help analyze customer requirements, suggest next follow-up dates, check KM distance from showroom, and draft polite Tamil/English WhatsApp replies.')
    } else if (route.includes('order')) {
      sections.push('\nPage Guidance (Orders): The user is viewing Sales Orders. Assist in tracking dispatch readiness, reviewing split payment balances, and checking order items.')
    } else if (route.includes('stock') || route.includes('product')) {
      sections.push('\nPage Guidance (Inventory): The user is reviewing Tile Catalog and Stock. Assist with box/sqft calculations, available vs reserved boxes, and minimum threshold alerts.')
    } else if (route.includes('letter-pad')) {
      sections.push('\nPage Guidance (Letter Pad): The user is drafting an official AG TRADERS letterhead or quotation document. Offer professional copywriting, formal quotes, and clear terms.')
    }
  }

  // 4. Custom developer or user prompts
  if (customPrompt && customPrompt.trim()) {
    sections.push(`\nAdditional Instructions:\n${customPrompt.trim()}`)
  }

  return sections.join('\n\n')
}

/**
 * Central handler for all AI chat queries across Local Express & Cloudflare mode.
 */
export async function handleAiChatRequest({
  messages = [],
  systemPrompt = '',
  context = {},
  provider = null,
  model = null,
  headers = {},
  body = {}
} = {}) {
  // 1. Resolve available keys & desired provider
  const resolved = resolveApiKeys({ headers, body })
  const targetProvider = provider || resolved.provider || AI_PROVIDERS.AUTO
  const geminiKey = resolved.geminiKey
  const mistralKey = resolved.mistralKey

  // Check if at least one key is present
  if (!geminiKey && !mistralKey) {
    return {
      success: false,
      error: 'No AI API key configured. Please add your Google Gemini API key or Mistral key in Settings / Purchase Invoices.',
      code: 'NO_KEYS_AVAILABLE'
    }
  }

  // 2. Assemble complete enriched system prompt
  const fullSystemPrompt = buildEnrichedSystemPrompt({
    customPrompt: systemPrompt,
    context
  })

  // 3. Execution Routing:

  // CASE A: User explicitly requested Mistral
  if (targetProvider === AI_PROVIDERS.MISTRAL) {
    if (!mistralKey) {
      return {
        success: false,
        error: 'Mistral provider selected but Mistral API key is missing.',
        code: 'MISSING_MISTRAL_KEY'
      }
    }
    const mistralResult = await callMistralChat({
      messages,
      systemPrompt: fullSystemPrompt,
      apiKey: mistralKey,
      model
    })
    return {
      ...mistralResult,
      fallbackUsed: false,
      timestamp: new Date().toISOString()
    }
  }

  // CASE B: Google Gemini Primary (with automated Mistral fallback)
  if (geminiKey) {
    const geminiResult = await callGeminiChat({
      messages,
      systemPrompt: fullSystemPrompt,
      apiKey: geminiKey,
      model
    })

    // If Gemini succeeded, return response immediately
    if (geminiResult.success) {
      return {
        ...geminiResult,
        fallbackUsed: false,
        timestamp: new Date().toISOString()
      }
    }

    // If Gemini failed and we have a Mistral key, attempt seamless fallback
    if (mistralKey) {
      console.warn(`⚠️ [AG AI] Gemini failed (${geminiResult.error}). Engaging Mistral fallback...`)
      const fallbackResult = await callMistralChat({
        messages,
        systemPrompt: fullSystemPrompt,
        apiKey: mistralKey
      })

      if (fallbackResult.success) {
        return {
          ...fallbackResult,
          fallbackUsed: true,
          primaryError: geminiResult.error,
          timestamp: new Date().toISOString()
        }
      }
    }

    // Both failed or no fallback available
    return {
      success: false,
      error: geminiResult.error || 'Gemini API call failed and no fallback available.',
      code: geminiResult.code || 'AI_CALL_FAILED',
      timestamp: new Date().toISOString()
    }
  }

  // CASE C: Only Mistral Key is available
  if (mistralKey) {
    const mistralResult = await callMistralChat({
      messages,
      systemPrompt: fullSystemPrompt,
      apiKey: mistralKey,
      model
    })
    return {
      ...mistralResult,
      fallbackUsed: false,
      timestamp: new Date().toISOString()
    }
  }

  return {
    success: false,
    error: 'Unable to initialize AI request.',
    code: 'UNKNOWN_ERROR'
  }
}
