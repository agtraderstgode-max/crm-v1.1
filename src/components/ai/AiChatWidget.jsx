import { useState, useEffect, useRef } from 'react'
import { 
  Bot, Sparkles, X, Send, Trash2, Settings, Key, ChevronDown, 
  RefreshCw, CheckCircle2, AlertCircle, ArrowUp
} from 'lucide-react'
import { usePageContext } from './usePageContext'
import { AI_MODELS, AI_PROVIDERS } from '@/lib/ai/aiConfig'

export function AiChatWidget() {
  const pageContext = usePageContext()
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)

  // API Key Settings State
  const [geminiKey, setGeminiKey] = useState('')
  const [mistralKey, setMistralKey] = useState('')
  const [provider, setProvider] = useState(AI_PROVIDERS.AUTO)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'வணக்கம்! நான் **AG AI**, AG TRADERS ஷோரூமின் பிரத்யேக AI உதவியாளர். லீட்ஸ், கொட்டேஷன், ஸ்டாக், மற்றும் வாடிக்கையாளர் விவரங்கள் குறித்து என்னிடம் கேட்கலாம்.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Load API keys from localStorage on mount
  useEffect(() => {
    try {
      const gKey = localStorage.getItem('gemini_api_key') || ''
      const mKey = localStorage.getItem('mistral_api_key') || ''
      const prov = localStorage.getItem('gemini_provider') || AI_PROVIDERS.AUTO
      setGeminiKey(gKey)
      setMistralKey(mKey)
      setProvider(prov)
    } catch {
      // localStorage restricted
    }
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isOpen])

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && !showSettings) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen, showSettings])

  // Handle saving API keys
  const handleSaveSettings = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem('gemini_api_key', geminiKey.trim())
      localStorage.setItem('mistral_api_key', mistralKey.trim())
      localStorage.setItem('gemini_provider', provider)
      setSaveSuccess(true)
      setError(null)
      setTimeout(() => {
        setSaveSuccess(false)
        setShowSettings(false)
      }, 1000)
    } catch (err) {
      setError('Failed to save keys to localStorage')
    }
  }

  // Handle message sending
  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText !== null ? customText : input).trim()
    if (!textToSend || loading) return

    setError(null)
    setInput('')

    // Append user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Prepare payload for /api/ai/chat
      const payloadMessages = updatedMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey.trim(),
          'x-mistral-key': mistralKey.trim(),
          'x-provider': provider
        },
        body: JSON.stringify({
          messages: payloadMessages,
          provider,
          context: {
            currentRoute: pageContext.currentRoute,
            date: new Date().toISOString()
          }
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive AI response.')
      }

      // Append assistant message
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text || data.reply || 'No response text received.',
        provider: data.provider,
        fallbackUsed: data.fallbackUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('AG AI Chat error:', err)
      setError(err.message)
      // If missing key, prompt user to open settings
      if (err.message.includes('API key') || err.message.includes('missing') || err.message.includes('NO_KEYS_AVAILABLE')) {
        setShowSettings(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle keyboard submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'உரையாடல் அழிக்கப்பட்டுவிட்டது. புதிதாக என்ன உதவி வேண்டும்?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setError(null)
  }

  // Simple inline markdown formatter for bullet points, bold, and code
  const renderFormattedContent = (content) => {
    if (!content) return null
    const lines = content.split('\n')
    return (
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1" />

          // Bullet point
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>{renderInlineStyles(trimmed.substring(2))}</span>
              </div>
            )
          }

          // Numbered item (e.g. "1. ")
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-blue-600 font-semibold text-xs mt-0.5">{numMatch[1]}.</span>
                <span>{renderInlineStyles(numMatch[2])}</span>
              </div>
            )
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            return <p key={idx} className="font-bold text-slate-900 text-sm mt-2">{renderInlineStyles(trimmed.substring(4))}</p>
          }
          if (trimmed.startsWith('## ')) {
            return <p key={idx} className="font-bold text-slate-900 text-base mt-2.5">{renderInlineStyles(trimmed.substring(3))}</p>
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>
        })}
      </div>
    )
  }

  const renderInlineStyles = (text) => {
    // Basic bold parsing: **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const hasConfiguredKey = Boolean(geminiKey || mistralKey)

  return (
    <>
      {/* ─── 1. Floating Action Button ────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AG AI Assistant"
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-5 w-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
            </span>
          </div>
          <span className="font-semibold text-sm tracking-wide">AG AI</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* ─── 2. Floating Chat Window ──────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 z-50 sm:inset-auto sm:right-6 sm:bottom-22 w-auto sm:w-[430px] h-[82vh] sm:h-[620px] max-h-[700px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center shadow-inner border border-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white tracking-wide">AG AI Assistant</h3>
                  <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1 truncate max-w-[210px]">
                  <span>{pageContext.badge}</span>
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="AI Settings & API Keys"
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ─── 3. Settings Drawer / Inline Modal ──────────────────────────── */}
          {showSettings && (
            <div className="bg-slate-50 border-b border-slate-200 p-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-xs text-slate-800">AI API Key Configuration</span>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Google Gemini API Key (Primary)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Mistral API Key (Automatic Fallback)
                  </label>
                  <input
                    type="password"
                    placeholder="Optional Mistral key..."
                    value={mistralKey}
                    onChange={(e) => setMistralKey(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">Keys are saved locally in your browser.</span>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Save Keys
                  </button>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Keys saved successfully!</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ─── 4. API Key Reminder Banner (if unconfigured) ──────────────── */}
          {!hasConfiguredKey && !showSettings && (
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>API key not yet set in browser.</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="font-semibold text-indigo-700 underline text-xs ml-2"
              >
                Configure
              </button>
            </div>
          )}

          {/* ─── 5. Message Thread ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderFormattedContent(msg.content)
                    )}

                    {/* Meta / timestamp */}
                    <div className={`mt-1 flex items-center gap-1.5 text-[10px] ${isUser ? 'text-blue-100 justify-end' : 'text-slate-400'}`}>
                      <span>{msg.timestamp}</span>
                      {msg.fallbackUsed && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-medium">
                          Mistral fallback
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-xs max-w-[140px] shadow-sm">
                <Bot className="h-4 w-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Thinking...</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {error.includes('API key') && (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="mt-1 font-bold underline text-indigo-700 block"
                    >
                      Click here to paste Gemini API key
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── 6. Context-Aware Quick Prompt Pills ──────────────────────── */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {pageContext.suggestedPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill)}
                disabled={loading}
                className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors shrink-0 disabled:opacity-50"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* ─── 7. Input Bar ─────────────────────────────────────────────── */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask AG AI (${pageContext.title})...`}
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none max-h-24"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 flex items-center justify-center text-white transition-colors shrink-0 shadow-sm"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400">
              <span>Enter to send, Shift+Enter for new line</span>
              <span className="text-indigo-600 font-medium">{pageContext.title} Context Active</span>
            </div>
          </div>

        </div>
      )}
    </>
  )
}
