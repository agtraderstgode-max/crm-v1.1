import { useState, useEffect, useRef } from 'react'
import { 
  Send, Users, User, ShieldAlert, MessageSquare, Clock, ShieldCheck, Search 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatPage() {
  const [staffList, setStaffList] = useState([])
  const [messages, setMessages] = useState([])
  const [activeUser, setActiveUser] = useState(null) // currently authenticated sender
  const [authPin, setAuthPin] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  // Chat Room selection: 'group' or direct staff ID (e.g. 'STF-002')
  const [activeRoom, setActiveRoom] = useState('group')
  const [inputMsg, setInputMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef(null)

  // Fetch staff list & messages
  const loadData = async () => {
    try {
      const resStaff = await fetch('/api/staff')
      const dataStaff = await resStaff.json()
      setStaffList(Array.isArray(dataStaff) ? dataStaff : [])

      const resMsg = await fetch('/api/chat/messages')
      const dataMsg = await resMsg.json()
      setMessages(Array.isArray(dataMsg) ? dataMsg : [])
    } catch (err) {
      console.error('Failed to load chat data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Poll for new messages every 3 seconds to keep it live
    const interval = setInterval(async () => {
      try {
        const resMsg = await fetch('/api/chat/messages')
        const dataMsg = await resMsg.json()
        if (Array.isArray(dataMsg)) {
          setMessages(dataMsg)
        }
      } catch (e) {
        console.error(e)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoom])

  // Authenticate staff user
  const handleAuthenticate = (e) => {
    e.preventDefault()
    setErrorMsg('')
    const target = staffList.find(s => s.id === selectedStaffId)
    if (!target) {
      setErrorMsg('Please select a staff member.')
      return
    }
    if (target.passcode === authPin) {
      setActiveUser(target)
      setIsAuthenticated(true)
      setAuthPin('')
    } else {
      setErrorMsg('Invalid passcode PIN. Please try again.')
    }
  }

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!isAuthenticated || !activeUser || !inputMsg.trim()) return

    const payload = {
      senderId: activeUser.id,
      senderName: activeUser.name,
      recipientId: activeRoom, // 'group' or direct staffId
      message: inputMsg.trim()
    }

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setInputMsg('')
        // Reload immediately
        const resMsg = await fetch('/api/chat/messages')
        const dataMsg = await resMsg.json()
        setMessages(dataMsg)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filter messages for active chat room
  const filteredMessages = messages.filter(msg => {
    if (activeRoom === 'group') {
      return msg.recipientId === 'group'
    } else {
      // Direct message between authenticated activeUser and selected staff
      if (!activeUser) return false
      return (
        (msg.senderId === activeUser.id && msg.recipientId === activeRoom) ||
        (msg.senderId === activeRoom && msg.recipientId === activeUser.id)
      )
    }
  })

  const targetDirectStaff = staffList.find(s => s.id === activeRoom)

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Top Banner: User Authentication bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">Showroom Chat Window</h1>
            <p className="text-[11px] text-slate-400">Instant staff group communications & direct messages</p>
          </div>
        </div>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {isAuthenticated && activeUser ? (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700/60">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                Logged in as: <span className="text-blue-400 font-extrabold">{activeUser.name}</span>
              </span>
              <button 
                onClick={() => {
                  setIsAuthenticated(false)
                  setActiveUser(null)
                  setSelectedStaffId('')
                  // If in direct message, reset back to group room
                  setActiveRoom('group')
                }}
                className="text-[10px] bg-red-950/60 hover:bg-red-900/60 text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthenticate} className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="rounded-xl bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 outline-none font-semibold focus:border-blue-500"
              >
                <option value="">Choose Staff Member</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <input
                type="password"
                placeholder="Enter PIN Passcode"
                value={authPin}
                onChange={e => setAuthPin(e.target.value)}
                className="w-32 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 outline-none font-bold placeholder-slate-500 focus:border-blue-500"
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white px-4 py-2 rounded-xl shadow-sm transition"
              >
                Login to Chat
              </button>
            </form>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 text-xs font-bold px-6 py-2.5 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          {errorMsg}
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Rooms list */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chat Channels</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Group Channel Button */}
            <button
              onClick={() => setActiveRoom('group')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition",
                activeRoom === 'group'
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                activeRoom === 'group' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
              )}>
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Staff General Group</p>
                <p className="text-[10px] text-slate-400 truncate">All registered staff members</p>
              </div>
            </button>

            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Messages</span>
            </div>

            {/* Direct message channels with other active staff */}
            {staffList
              .filter(s => !activeUser || s.id !== activeUser.id)
              .map(member => {
                const isActive = activeRoom === member.id
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      if (!isAuthenticated) {
                        setErrorMsg('Please login above with your Passcode PIN to access Direct Messages.')
                        return
                      }
                      setActiveRoom(member.id)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition",
                      isActive
                        ? "bg-violet-50 text-violet-700 border border-violet-100"
                        : "text-slate-600 hover:bg-slate-50",
                      !isAuthenticated && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs",
                      isActive ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>

        {/* Right Area: Messages View & Send form */}
        <div className="flex-1 flex flex-col bg-slate-50/40">
          {/* Messages View Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeRoom === 'group' ? '📢 Staff General Group Chat' : `💬 Direct Message with ${targetDirectStaff?.name}`}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeRoom === 'group' 
                    ? 'Messages sent here are visible to everyone working in the showroom' 
                    : `Secure direct conversation with ${targetDirectStaff?.name}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Messages list container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs animate-pulse">Loading conversation history...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400/80">
                <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold">No messages here yet.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Type a message below to start the conversation!</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = activeUser && msg.senderId === activeUser.id
                const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex items-start gap-3 max-w-[70%]",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 text-white shadow-sm",
                      isMe ? "bg-blue-600" : "bg-slate-700"
                    )}>
                      {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'S'}
                    </div>

                    {/* Bubble */}
                    <div className="space-y-1">
                      {/* Name */}
                      <p className={cn(
                        "text-[10px] font-bold text-slate-400",
                        isMe && "text-right"
                      )}>
                        {msg.senderName}
                      </p>

                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed",
                        isMe 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      {/* Time */}
                      <p className={cn(
                        "text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        <Clock className="h-2.5 w-2.5" /> {time}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send form container */}
          <div className="bg-white border-t border-slate-200 p-4">
            {isAuthenticated ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    activeRoom === 'group' 
                      ? "Type a message to the group..." 
                      : `Type a private message to ${targetDirectStaff?.name}...`
                  }
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 flex items-center justify-center shadow-sm transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 text-center text-slate-600 text-xs font-semibold flex items-center justify-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                <span>Please select your profile and enter your Passcode PIN at the top to unlock the chat.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
