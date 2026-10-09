import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'

const conversationStorageKey = 'shopeasy-support-conversation'
const messagesStorageKey = 'shopeasy-support-messages'
const createConversationId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}-0000-4000-800000000000`.slice(0, 36)

const SupportChat = () => {
  const { backendUrl } = useContext(ShopContext)
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState(() => {
    let id = localStorage.getItem(conversationStorageKey)
    if (!id) {
      id = createConversationId()
      localStorage.setItem(conversationStorageKey, id)
    }
    return id
  })
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(messagesStorageKey) || '[]') } catch { return [] }
  })
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(messagesStorageKey, JSON.stringify(messages.slice(-40)))
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const startNewChat = () => {
    const nextId = createConversationId()
    localStorage.setItem(conversationStorageKey, nextId)
    localStorage.removeItem(messagesStorageKey)
    setConversationId(nextId)
    setMessages([])
    setDraft('')
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setDraft('')
    setSending(true)
    setMessages((current) => [...current, { role: 'user', content }])

    try {
      const response = await axios.post(`${backendUrl}/api/support/chat`, {
        conversationId,
        message: content,
        customerName,
        customerEmail
      })
      if (!response.data.success) throw new Error(response.data.message || 'Message send nahi ho paya.')
      setMessages((current) => [...current, { role: 'assistant', content: response.data.reply }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error.response?.data?.message || 'Message send nahi ho paya. Please dobara try karein.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='fixed bottom-5 right-5 z-50 font-sans'>
      {isOpen && (
        <section className='mb-3 flex h-[min(620px,78vh)] w-[min(370px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl' aria-label='ShopEasy support chat'>
          <header className='flex items-center justify-between bg-gray-900 px-4 py-4 text-white'>
            <div className='flex items-center gap-3'>
              <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8a8c5] to-[#a45b7f]' aria-hidden='true'>
                <svg viewBox='0 0 24 24' className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M12 3v2.5M9.5 3h5' /><rect x='4' y='6' width='16' height='14' rx='5' />
                  <path d='M8.5 12h.01M15.5 12h.01M9 16h6M4 11H2.5M21.5 11H20' />
                </svg>
              </span>
              <div>
              <p className='font-semibold'>ShopEasy Support</p>
              <p className='text-xs text-gray-300'>AI support assistant </p>
              </div>
            </div>
            <button type='button' onClick={startNewChat} className='rounded-lg px-2 py-1 text-xs text-gray-200 hover:bg-gray-700'>New chat</button>
          </header>

          <div className='flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4'>
            <p className='max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-gray-700 shadow-sm'>Namaste! Aap shopping, order ya payment mein kis problem ke liye help chahte hain?</p>
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl p-3 text-sm ${message.role === 'user' ? 'rounded-tr-sm bg-[#c586a5] text-white' : 'rounded-tl-sm bg-white text-gray-700 shadow-sm'}`}>{message.content}</p>
              </div>
            ))}
            {sending && <p className='w-fit rounded-2xl bg-white px-3 py-2 text-xs text-gray-500 shadow-sm'>Reply likh raha hoon…</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className='space-y-2 border-t p-3'>
            <div className='flex gap-2'>
              <input aria-label='Your name (optional)' value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={100} placeholder='Name (optional)' className='min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#c586a5]' />
              <input aria-label='Your email (optional)' type='email' value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} maxLength={254} placeholder='Email (optional)' className='min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#c586a5]' />
            </div>
            <p className='text-[10px] leading-4 text-gray-400'>Messages AI response ke liye process hote hain aur support inbox mein save rehte hain. Email optional hai.</p>
            <div className='flex gap-2'>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} placeholder='Apna message likhein…' className='min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c586a5]' />
              <button disabled={sending || !draft.trim()} className='rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50'>Send</button>
            </div>
          </form>
        </section>
      )}
      <button type='button' onClick={() => setIsOpen((open) => !open)} className='ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d99ab7] to-[#a45b7f] text-2xl text-transparent shadow-lg shadow-[#a45b7f]/30 transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#c586a5]/30' aria-label={isOpen ? 'Close support chat' : 'Open support chat'}>
        <svg viewBox='0 0 24 24' className='absolute h-7 w-7 text-white' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
          <path d='M12 2.75v2.5M9.5 2.75h5' /><rect x='4' y='5.75' width='16' height='15' rx='5' />
          <path d='M8.5 12h.01M15.5 12h.01M9 16h6M4 11H2.5M21.5 11H20' />
        </svg>
        {isOpen ? '×' : '✦'}
      </button>
    </div>
  )
}

export default SupportChat
