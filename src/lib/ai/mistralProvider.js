/**
 * AG TRADERS CRM — Mistral AI Provider (Fallback Engine)
 * Uses standard REST fetch for 100% compatibility across Node.js & Browser / Cloudflare Workers.
 */

import { AI_MODELS } from './aiConfig.js'

export async function callMistralChat({
  messages = [],
  systemPrompt = '',
  apiKey = '',
  model = AI_MODELS.MISTRAL_DEFAULT,
  temperature = 0.7
}) {
  if (!apiKey) {
    return {
      success: false,
      error: 'Mistral API key is missing. Please configure it in Settings.',
      code: 'MISSING_KEY'
    }
  }

  // Format messages into OpenAI/Mistral format
  const formattedMessages = []

  if (systemPrompt && systemPrompt.trim()) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt.trim()
    })
  }

  for (const m of messages) {
    if (!m || !m.content) continue
    formattedMessages.push({
      role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
      content: String(m.content)
    })
  }

  if (formattedMessages.length === 0) {
    return {
      success: false,
      error: 'No messages provided to Mistral AI chat.',
      code: 'EMPTY_MESSAGES'
    }
  }

  const targetModel = model || AI_MODELS.MISTRAL_DEFAULT
  const endpoint = 'https://api.mistral.ai/v1/chat/completions'

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
        max_tokens: 2048
      })
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const errorData = await response.json()
        errorDetails = errorData?.message || errorData?.error?.message || JSON.stringify(errorData)
      } catch {
        errorDetails = `HTTP ${response.status} ${response.statusText}`
      }

      return {
        success: false,
        statusCode: response.status,
        error: errorDetails || `Mistral API call failed with HTTP ${response.status}`,
        code: response.status === 429 ? 'QUOTA_EXCEEDED' : 'API_ERROR'
      }
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    if (!text) {
      return {
        success: false,
        error: 'Empty response received from Mistral AI',
        code: 'EMPTY_RESPONSE'
      }
    }

    return {
      success: true,
      text: text.trim(),
      model: targetModel,
      provider: 'mistral',
      usage: data.usage || null
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error connecting to Mistral API',
      code: 'NETWORK_ERROR'
    }
  }
}
