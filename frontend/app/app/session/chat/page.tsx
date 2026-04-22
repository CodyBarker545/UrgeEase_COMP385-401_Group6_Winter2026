'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { getSessionMessages, sendMessage } from '@/frontend/lib/api'
import type { Message } from '@/frontend/lib/types'
import { CrisisModal } from '@/frontend/components/app/CrisisModal'

// Shows the chat session page.
export default function ChatSessionPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId') || ''
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCrisisModal, setShowCrisisModal] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId) return
    // Loads messages for the current session.
    async function loadMessages() {
      try {
        const data = await getSessionMessages(sessionId)
        setMessages(data)
      } catch (error) {
        console.error('Failed to load messages', error)
        setSendError('Unable to load messages from the server.')
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handles handle send.
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !sessionId || sending) return

    const messageText = input.trim()
    setSendError(null)

    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      sessionId,
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
      mode: 'chat',
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const response = await sendMessage({ sessionId, mode: 'chat', text: messageText })
      const syncedMessages = await getSessionMessages(sessionId)
      setMessages(syncedMessages)
      
      if (response.crisisFlag) {
        setShowCrisisModal(true)
      }
    } catch (error) {
      console.error('Failed to send message', error)
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
      setInput(messageText)
      setSendError(error instanceof Error ? error.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: 'var(--color-text-muted)' }}>No session selected</p>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
        
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-lg font-medium" style={{ color: 'var(--color-text-dark)' }}>
                  Start your conversation
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Share what&apos;s on your mind. UrgeEase is here to listen without judgment.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'rounded-br-sm'
                        : 'rounded-bl-sm'
                    }`}
                    style={{
                      backgroundColor:
                        msg.role === 'user'
                          ? 'var(--color-accent)'
                          : 'var(--color-card-bg)',
                      color: msg.role === 'user' ? 'var(--color-text-light)' : 'var(--color-text-dark)',
                    }}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl rounded-bl-sm px-4 py-2"
                    style={{ backgroundColor: 'var(--color-card-bg)' }}
                  >
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>UrgeEase is typing…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        
        <form onSubmit={handleSend} className="border-t p-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
          {sendError && (
            <div
              className="mb-3 rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'rgba(220, 38, 38, 0.4)',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                color: '#fca5a5',
              }}
            >
              {sendError}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none rounded-lg border-2 px-4 py-2 text-sm focus:outline-none"
              style={{
                borderColor: 'rgba(227, 155, 99, 0.2)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-dark)',
                fontFamily: 'var(--font-primary)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-light)',
              }}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} />}
    </>
  )
}

