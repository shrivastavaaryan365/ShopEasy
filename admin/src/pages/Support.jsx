import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'

const statusStyles = {
  Open: 'bg-rose-50 text-rose-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  Resolved: 'bg-emerald-50 text-emerald-700'
}

const Support = ({ token }) => {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/support/admin/list`, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message || 'Inbox load nahi hua.')
      setConversations(response.data.conversations)
      setSelectedId((current) => response.data.conversations.some((item) => item._id === current) ? current : response.data.conversations[0]?._id || '')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Inbox load nahi hua.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadConversations() }, [loadConversations])

  const updateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`${backendUrl}/api/support/admin/${id}/status`, { status }, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message || 'Status update nahi hua.')
      setConversations((current) => current.map((item) => item._id === id ? { ...item, status } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Status update nahi hua.')
    }
  }

  const selected = conversations.find((item) => item._id === selectedId)

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-800'>Customer Support</h1>
          <p className='mt-1 text-sm text-gray-500'>Website ke AI chat messages aur customer issues.</p>
        </div>
        <button type='button' onClick={loadConversations} className='rounded-lg border px-4 py-2 text-sm hover:bg-gray-50'>Refresh inbox</button>
      </div>

      {error && <p className='rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'>{error}</p>}

      {loading ? <p className='py-10 text-center text-gray-500'>Inbox load ho raha hai…</p> : (
        <div className='grid min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border bg-white md:grid-cols-[300px_1fr]'>
          <aside className='border-b md:border-b-0 md:border-r'>
            <div className='border-b px-4 py-3 text-sm font-medium text-gray-700'>Conversations ({conversations.length})</div>
            <div className='max-h-[620px] overflow-y-auto'>
              {conversations.length === 0 ? <p className='px-4 py-8 text-sm text-gray-500'>Abhi koi support message nahi hai.</p> : conversations.map((item) => {
                const latest = item.messages?.[item.messages.length - 1]
                return (
                  <button type='button' key={item._id} onClick={() => setSelectedId(item._id)} className={`block w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${selectedId === item._id ? 'bg-[#fff6fa]' : ''}`}>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-medium text-gray-800'>{item.customerName || item.customerEmail || 'Guest customer'}</span>
                      <div className='flex shrink-0 items-center gap-1'>
                        {item.isComplaint && <span className='rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700'>Complaint</span>}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusStyles[item.status] || 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                      </div>
                    </div>
                    <p className='mt-1 truncate text-xs text-gray-500'>{latest?.content || 'No messages'}</p>
                    <p className='mt-1 text-[10px] text-gray-400'>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}</p>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className='flex min-h-[400px] flex-col'>
            {selected ? <>
              <header className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4'>
                <div>
                  <h2 className='font-semibold text-gray-800'>{selected.customerName || 'Guest customer'}</h2>
                  <p className='text-sm text-gray-500'>{selected.customerEmail || 'Email not provided'}</p>
                  {selected.isComplaint && <p className='mt-1 text-xs font-medium text-rose-700'>Customer complaint · review requested</p>}
                </div>
                <select aria-label='Conversation status' value={selected.status} onChange={(event) => updateStatus(selected._id, event.target.value)} className='rounded-lg border px-3 py-2 text-sm'>
                  <option>Open</option><option>In Progress</option><option>Resolved</option>
                </select>
              </header>
              <div className='flex-1 space-y-3 overflow-y-auto bg-gray-50 p-5'>
                {(selected.messages || []).map((message, index) => (
                  <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 ${message.role === 'user' ? 'bg-white shadow-sm' : 'bg-[#f9eaf1]'}`}>
                      <p className='mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400'>{message.role === 'user' ? 'Customer' : 'AI Assistant'}</p>
                      <p className='whitespace-pre-wrap break-words text-sm text-gray-700'>{message.content}</p>
                      <p className='mt-1 text-right text-[10px] text-gray-400'>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </> : <div className='m-auto p-8 text-center text-sm text-gray-500'>Conversation dekhne ke liye inbox se ek message select karein.</div>}
          </section>
        </div>
      )}
    </div>
  )
}

export default Support
