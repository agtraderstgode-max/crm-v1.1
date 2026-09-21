/**
 * AG TRADERS CRM — Google Gemini AI Provider
 * Uses standard REST fetch for 100% compatibility across Node.js & Browser / Cloudflare Workers.
 */

import { AI_MODELS } from './aiConfig.js'

export async function callGeminiChat({
  messages = [],
  systemPrompt = '',
  apiKey = '',
  model = AI_MODELS.GEMINI_DEFAULT,
  temperature = 0.7
}) {
  if (!apiKey) {
    return {
      success: false,
      error: 'Google Gemini API key is missing. Please configure it in Settings.',
      code: 'MISSING_KEY'
    }
  }

  // Format messages into Gemini's contents structure
  const contents = messages
    .filter(m => m && m.content)
    .map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content) }]
    }))

  if (contents.length === 0) {
    return {
      success: false,
      error: 'No messages provided to AI chat.',
      code: 'EMPTY_MESSAGES'
    }
  }

  const payload = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048
    }
  }

  if (systemPrompt && systemPrompt.trim()) {
    payload.system_instruction = {
      parts: [{ text: systemPrompt.trim() }]
    }
  }

  const targetModel = model || AI_MODELS.GEMINI_DEFAULT
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(apiKey)}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const errorData = await response.json()
        errorDetails = errorData?.error?.message || JSON.stringify(errorData)
      } catch {
        errorDetails = `HTTP ${response.status} ${response.statusText}`
      }

      return {
        success: false,
        statusCode: response.status,
        error: errorDetails || `Gemini API call failed with HTTP ${response.status}`,
        code: response.status === 429 ? 'QUOTA_EXCEEDED' : 'API_ERROR'
      }
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    const textPart = candidate?.content?.parts?.map(p => p.text || '').join('') || ''

    if (!textPart) {
      const blockReason = candidate?.finishReason || data.promptFeedback?.blockReason
      return {
        success: false,
        error: blockReason ? `Response blocked by safety filter (${blockReason})` : 'Empty response received from Gemini',
        code: 'EMPTY_RESPONSE'
      }
    }

    return {
      success: true,
      text: textPart.trim(),
      model: targetModel,
      provider: 'google',
      usage: data.usageMetadata || null
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error connecting to Gemini API',
      code: 'NETWORK_ERROR'
    }
  }
}
