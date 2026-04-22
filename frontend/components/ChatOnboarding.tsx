'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { createClientSupabase } from '@/lib/supabase'
import { updateOnboardingState, ReplacementActivity } from '@/lib/onboarding'
import { validateReplacementActivity, validateWhyDocument } from '@/lib/validation'
import { getErrorMessage } from '@/lib/error-messages'

interface ChatOnboardingProps {
  userId: string
  onComplete: () => void
  initialMode?: 'onboarding' | 'replacement-prompts'
  onPanicClick?: () => void
}

interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

interface ConversationStep {
  id: string
  question: string
  quickReplies?: string[]
  field: 'challenge' | 'why' | 'replacement' | 'environment'
  isComplete: boolean
}

const CONVERSATION_STEPS: ConversationStep[] = [
  {
    id: 'welcome',
    question: "Hi! I'm your UrgeEase Recovery Partner. I'm here to help personalize your experience. Let's start by understanding what you're working on. What's your main challenge?",
    quickReplies: ['Pornography', 'Compulsive Scrolling', 'Both', 'Something else'],
    field: 'challenge',
    isComplete: false,
  },
  {
    id: 'why',
    question: "To make the Panic Button truly effective, I need to know what you're fighting for. If you could tell your future self one reason to stay strong, what would it be?",
    field: 'why',
    isComplete: false,
  },
  {
    id: 'replacement',
    question: "Great! Now let's build your toolkit. What are 5 activities you can do instead when the urge hits? (You can add them one at a time)",
    field: 'replacement',
    isComplete: false,
  },
  {
    id: 'environment',
    question: "Last question: Have you done an environment reset? This means removing triggers from your immediate space (like moving your phone, blocking sites, etc.)",
    quickReplies: ['Yes, I have', 'Not yet', 'I need help with this'],
    field: 'environment',
    isComplete: false,
  },
]


// Runs the chat onboarding experience.
export default function ChatOnboarding({ userId, onComplete, initialMode = 'onboarding', onPanicClick }: ChatOnboardingProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [mode, setMode] = useState<'onboarding' | 'replacement-prompts'>(initialMode)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversationData, setConversationData] = useState<{
    challenge?: string
    why?: string
    replacements: string[]
    environment?: string
  }>({
    replacements: [],
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Updates layout state after the window resizes.
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      const heightDiff = windowHeight - viewportHeight
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0)
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    } else {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])
  useEffect(() => {
    if (messages.length === 0) {
      let welcomeMessage: Message
      
      if (mode === 'replacement-prompts') {
        welcomeMessage = {
          id: '1',
          role: 'assistant',
          content: "Let's update your replacement activities! What activities help you when the urge hits? You can add new ones or modify existing ones. (Type them one at a time, or type 'done' when finished)",
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
        // Handles load replacements.
        const loadReplacements = async () => {
          try {
            const supabase = createClientSupabase()
            const { data } = await supabase
              .from('users')
              .select('replacement_behaviors')
              .eq('id', userId)
              .single()
            
            if (data?.replacement_behaviors) {
              try {
                const existing = JSON.parse(data.replacement_behaviors)
                if (Array.isArray(existing) && existing.length > 0) {
                  setConversationData(prev => ({ ...prev, replacements: existing }))
                  setTimeout(() => {
                    const followUpMessage: Message = {
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: `I see you currently have ${existing.length} replacement activity${existing.length !== 1 ? 'ies' : ''}. Would you like to add more or modify them?`,
                      timestamp: new Date(),
                    }
                    setMessages(prev => [...prev, followUpMessage])
                  }, 1000)
                }
              } catch (e) {
                console.error('Error parsing replacement behaviors:', e)
              }
            }
          } catch (error) {
            console.error('Error loading replacement behaviors:', error)
          }
        }
        
        loadReplacements()
      } else {
        welcomeMessage = {
          id: '1',
          role: 'assistant',
          content: CONVERSATION_STEPS[0].question,
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
      }
    }
  }, [mode, userId, messages.length]) 

  // Updates profile.
  const updateProfile = useCallback(async (field: string, value: any) => {
    try {
      const supabase = createClientSupabase()
      const { error } = await supabase
        .from('users')
        .update({
          [field]: value,
          personalization_status: currentStep === CONVERSATION_STEPS.length - 1 ? 'completed' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Failed to update profile:', error)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }, [userId, currentStep])

  // Handles add assistant message.
  const addAssistantMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  // Handles handle send message.
  const handleSendMessage = useCallback(async (text?: string, isQuickReply = false) => {
    const messageText = text || inputValue.trim()
    if (!messageText) return
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    if (mode === 'replacement-prompts') {
      if (messageText.toLowerCase().trim() === 'done' || messageText.toLowerCase().trim() === "i'm done" || messageText.toLowerCase().trim() === "that's all") {
        setIsTyping(false)
        addAssistantMessage("Perfect! Your replacement activities have been updated. They'll be available in your Panic Button. Is there anything else I can help you with?")
        setTimeout(() => {
          onComplete()
        }, 2000)
        return
      }
      const validation = validateReplacementActivity(messageText)
      if (!validation.valid) {
        setIsTyping(false)
        addAssistantMessage(validation.error || 'Please enter a valid activity name (2-100 characters).')
        return
      }
      
      const sanitizedActivity = validation.sanitized || messageText
      const newReplacements = [...conversationData.replacements, sanitizedActivity]
      setConversationData(prev => ({ ...prev, replacements: newReplacements }))
      
      const activities: ReplacementActivity[] = newReplacements.map((name, idx) => ({
        id: idx + 1,
        category: 'physical' as const,
        name,
      }))
      await updateProfile('replacement_behaviors', JSON.stringify(newReplacements))
      await updateOnboardingState({
        replacementActivities: activities,
      })
      
      setIsTyping(false)
      addAssistantMessage(`Perfect! I've saved "${sanitizedActivity}". You now have ${newReplacements.length} replacement activit${newReplacements.length !== 1 ? 'ies' : 'y'}. Would you like to add another, or type "done" when you're finished.`)
      return
    }

    const step = CONVERSATION_STEPS[currentStep]
    if (!step) {
      setIsTyping(false)
      return
    }
    let nextStep = currentStep
    let response = ''

    switch (step.field) {
      case 'challenge':
        setConversationData(prev => ({ ...prev, challenge: messageText }))
        await updateProfile('main_challenge', messageText)
        response = "Thank you for sharing. I understand this is important to you. Let's continue."
        nextStep = 1
        break

      case 'why':
        const whyValidation = validateWhyDocument(messageText)
        if (!whyValidation.valid) {
          setIsTyping(false)
          addAssistantMessage(whyValidation.error || 'Please enter a valid reason (10-2000 characters).')
          return
        }
        
        const sanitizedWhy = whyValidation.sanitized || messageText
        setConversationData(prev => ({ ...prev, why: sanitizedWhy }))
        await updateProfile('why_document', sanitizedWhy)
        await updateOnboardingState({
          whyDocument: {
            text: sanitizedWhy,
            createdAt: new Date().toISOString(),
            lastShownAt: null,
          },
        })
        response = "That's powerful. I'll make sure you see this when you need it most. Now let's build your toolkit."
        nextStep = 2
        break

      case 'replacement':
        const newReplacements = [...conversationData.replacements, messageText]
        setConversationData(prev => ({ ...prev, replacements: newReplacements }))
        
        if (newReplacements.length < 5) {
          response = `Great! That's ${newReplacements.length} of 5. What's another activity you can do?`
        } else {
          const activities = newReplacements.map((name, idx) => ({
            id: idx + 1,
            category: 'physical' as const,
            name,
          }))
          await updateProfile('replacement_behaviors', JSON.stringify(newReplacements))
          await updateOnboardingState({
            replacementActivities: activities,
          })
          response = "Perfect! You now have 5 powerful alternatives ready. One last thing..."
          nextStep = 3
        }
        break

      case 'environment':
        setConversationData(prev => ({ ...prev, environment: messageText }))
        const envCompleted = messageText.toLowerCase().includes('yes') || messageText.toLowerCase().includes('i have')
        await updateProfile('environment_reset', envCompleted ? 'completed' : 'pending')
        await updateProfile('personalization_status', 'completed')
        await updateOnboardingState({
          environmentReset: {
            completed: envCompleted,
            completedAt: envCompleted ? new Date().toISOString() : undefined,
          },
          userSettings: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
          },
        })
        response = "Excellent! Your UrgeEase partner is now fully personalized. You're all set. Let's get you to your dashboard."
        nextStep = CONVERSATION_STEPS.length
        break
    }

    setIsTyping(false)
    addAssistantMessage(response)

    if (nextStep < CONVERSATION_STEPS.length) {
      setTimeout(() => {
        setCurrentStep(nextStep)
        addAssistantMessage(CONVERSATION_STEPS[nextStep].question)
      }, 1500)
    } else {
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
  }, [inputValue, currentStep, conversationData, updateProfile, addAssistantMessage, onComplete, mode])

  // Handles handle quick reply.
  const handleQuickReply = useCallback((reply: string) => {
    const messageText = reply.trim()
    if (!messageText) return
    if (mode === 'replacement-prompts') {
      handleSendMessage(messageText)
      return
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    setTimeout(async () => {
      const step = CONVERSATION_STEPS[currentStep]
      if (!step) {
        setIsTyping(false)
        return
      }
      let nextStep = currentStep
      let response = ''

      switch (step.field) {
        case 'challenge':
          setConversationData(prev => ({ ...prev, challenge: messageText }))
          await updateProfile('main_challenge', messageText)
          response = "Thank you for sharing. I understand this is important to you. Let's continue."
          nextStep = 1
          break

        case 'why':
          const quickWhyValidation = validateWhyDocument(messageText)
          if (!quickWhyValidation.valid) {
            setIsTyping(false)
            addAssistantMessage(quickWhyValidation.error || 'Please enter a valid reason (10-2000 characters).')
            return
          }
          
          const quickSanitizedWhy = quickWhyValidation.sanitized || messageText
          setConversationData(prev => ({ ...prev, why: quickSanitizedWhy }))
          await updateProfile('why_document', quickSanitizedWhy)
          await updateOnboardingState({
            whyDocument: {
              text: quickSanitizedWhy,
              createdAt: new Date().toISOString(),
              lastShownAt: null,
            },
          })
          response = "That's powerful. I'll make sure you see this when you need it most. Now let's build your toolkit."
          nextStep = 2
          break

        case 'replacement':
          const quickReplacementValidation = validateReplacementActivity(messageText)
          if (!quickReplacementValidation.valid) {
            setIsTyping(false)
            addAssistantMessage(quickReplacementValidation.error || 'Please enter a valid activity name (2-100 characters).')
            return
          }
          
          const quickSanitizedReplacement = quickReplacementValidation.sanitized || messageText
          const newReplacements = [...conversationData.replacements, quickSanitizedReplacement]
          setConversationData(prev => ({ ...prev, replacements: newReplacements }))
          if (newReplacements.length < 5) {
            response = `Great! That's ${newReplacements.length} of 5. What's another activity you can do?`
          } else {
            const activities: ReplacementActivity[] = newReplacements.map((name, idx) => ({
              id: idx + 1,
              category: 'physical' as const,
              name,
            }))
            await updateProfile('replacement_behaviors', JSON.stringify(newReplacements))
            await updateOnboardingState({
              replacementActivities: activities,
            })
            response = "Perfect! You now have 5 powerful alternatives ready. One last thing..."
            nextStep = 3
          }
          break

        case 'environment':
          setConversationData(prev => ({ ...prev, environment: messageText }))
          const envCompleted = messageText.toLowerCase().includes('yes') || messageText.toLowerCase().includes('i have')
          await updateProfile('environment_reset', envCompleted ? 'completed' : 'pending')
          await updateProfile('personalization_status', 'completed')
          await updateOnboardingState({
            environmentReset: {
              completed: envCompleted,
              completedAt: envCompleted ? new Date().toISOString() : undefined,
            },
            userSettings: {
              onboardingCompleted: true,
              onboardingCompletedAt: new Date().toISOString(),
            },
          })
          response = "Excellent! Your UrgeEase partner is now fully personalized. You're all set. Let's get you to your dashboard."
          nextStep = CONVERSATION_STEPS.length
          break
      }

      setIsTyping(false)
      addAssistantMessage(response)

      if (nextStep < CONVERSATION_STEPS.length) {
        setTimeout(() => {
          setCurrentStep(nextStep)
          addAssistantMessage(CONVERSATION_STEPS[nextStep].question)
        }, 1500)
      } else {
        setTimeout(() => {
          onComplete()
        }, 2000)
      }
    }, 1000 + Math.random() * 1000)
  }, [currentStep, conversationData, updateProfile, addAssistantMessage, onComplete, mode, handleSendMessage])

  // Handles keyboard input for the chat box.
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const currentQuickReplies = CONVERSATION_STEPS[currentStep]?.quickReplies

  return (
    <div className="dashboard-page chat-style">
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          onTouchStart={(e) => {
            e.preventDefault()
          }}
        />
      )}
      {!sidebarOpen && (
        <button className="chat-sidebar-toggle-mobile" type="button" aria-label="Expand sidebar" onClick={() => setSidebarOpen(true)}>
          <Image 
            src="/images/sidebar-open-arrow.png" 
            alt="Open sidebar"
            width={20}
            height={20}
            className="toggle-icon"
          />
        </button>
      )}
      <div className={`chat-layout ${sidebarOpen ? '' : 'collapsed'}`}>
        <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="chat-logo-area">
            <div className="chat-logo-icon">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="16" stroke="#E39B63" strokeWidth="2" />
                <circle cx="20" cy="20" r="8" fill="#E39B63" />
                <path d="M20 4L22 12L20 8L18 12L20 4Z" fill="#E39B63" />
                <path d="M20 36L22 28L20 32L18 28L20 36Z" fill="#E39B63" />
                <path d="M4 20L12 22L8 20L12 18L4 20Z" fill="#E39B63" />
                <path d="M36 20L28 22L32 20L28 18L36 20Z" fill="#E39B63" />
              </svg>
            </div>
            {sidebarOpen && <div className="chat-logo-text">UrgeEase</div>}
            <button className="chat-sidebar-toggle" type="button" aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Image 
                src={sidebarOpen ? '/images/sidebar-close.png' : '/images/sidebar-open-arrow.png'} 
                alt={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                width={20}
                height={20}
                className="toggle-icon"
                onError={(e) => {
                  console.error('Failed to load sidebar toggle image')
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
          </div>

          <div className="chat-section interactive">
            {sidebarOpen && <p className="chat-section-label">Core tools</p>}
            <button 
              type="button" 
              className="chat-section-item"
              onClick={() => {
                if (onPanicClick) {
                  onPanicClick()
                } else {
                  router.push('/dashboard')
                }
              }}
            >
              <span className="chat-section-item-icon">⚡</span>
              {sidebarOpen && (
                <>
                  Panic button
                  <span className="chat-section-item-meta">One tap emergency</span>
                </>
              )}
            </button>
            <button 
              type="button" 
              className="chat-section-item active"
            >
              <span className="chat-section-item-icon">🤖</span>
              {sidebarOpen && 'AI Recovery Partner'}
            </button>
            <button type="button" className="chat-section-item">
              <span className="chat-section-item-icon">🌀</span>
              {sidebarOpen && 'Defusion guidance'}
            </button>
            <button type="button" className="chat-section-item">
              <span className="chat-section-item-icon">💨</span>
              {sidebarOpen && 'Breathing exercises'}
            </button>
            <button type="button" className="chat-section-item">
              <span className="chat-section-item-icon">📝</span>
              {sidebarOpen && 'Trigger logging'}
            </button>
              <button type="button" className="chat-section-item">
                <span className="chat-section-item-icon">📊</span>
                {sidebarOpen && 'Insights dashboard'}
              </button>
              <button 
                type="button" 
                className="chat-section-item"
                onClick={() => router.push('/settings')}
              >
                <span className="chat-section-item-icon">⚙️</span>
                {sidebarOpen && 'Settings'}
              </button>
            </div>

            {sidebarOpen && (
              <>
                <div className="chat-separator" />

              <div className="chat-account">
                <span className="chat-account-label">Account</span>
                <p className="chat-account-email">{user?.email || 'No email'}</p>
                <button 
                  className="chat-account-btn btn-secondary" 
                  type="button"
                  onClick={async () => {
                    try {
                      await signOut()
                      router.push('/')
                    } catch (error) {
                      console.error('Failed to sign out:', error)
                      router.push('/')
                    }
                  }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </aside>
        <main className="chat-main">
          <div className="flex flex-col h-full overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(227, 155, 99, 0.2)', background: 'rgba(232, 228, 222, 0.8)', backdropFilter: 'blur(12px)' }}>
              <h1 className="text-sm font-semibold" style={{ color: 'var(--color-text-dark)' }}>UrgeEase Partner</h1>
              <button
                onClick={onComplete}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ 
                  color: 'var(--color-text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-dark)'
                  e.currentTarget.style.background = 'rgba(227, 155, 99, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Skip to Dashboard
              </button>
            </div>

            
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3"
                style={{
                  background: message.role === 'assistant' 
                    ? 'var(--color-card-bg)' 
                    : 'var(--color-accent)',
                  color: message.role === 'assistant' 
                    ? 'var(--color-text-dark)' 
                    : 'var(--color-text-light)',
                  boxShadow: message.role === 'assistant' 
                    ? '0 2px 8px rgba(0, 0, 0, 0.06)' 
                    : '0 2px 8px rgba(227, 155, 99, 0.2)',
                }}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--color-card-bg)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
            </div>

            
            {currentQuickReplies && currentQuickReplies.length > 0 && !isTyping && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {currentQuickReplies.map((reply) => (
                    <motion.button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-full text-sm transition-colors"
                      style={{
                        background: 'var(--color-card-bg)',
                        border: '2px solid rgba(227, 155, 99, 0.2)',
                        color: 'var(--color-text-dark)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                        e.currentTarget.style.background = 'rgba(227, 155, 99, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(227, 155, 99, 0.2)'
                        e.currentTarget.style.background = 'var(--color-card-bg)'
                      }}
                    >
                      {reply}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            
            <div
              className="px-4 py-4 border-t"
              style={{ 
                paddingBottom: `calc(1rem + ${keyboardHeight}px)`,
                background: 'var(--color-card-bg)',
                borderColor: 'rgba(227, 155, 99, 0.2)',
              }}
            >
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 pr-12 rounded-full text-[15px] transition-all"
                    style={{
                      background: 'var(--color-background)',
                      border: '2px solid rgba(227, 155, 99, 0.2)',
                      color: 'var(--color-text-dark)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(227, 155, 99, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(227, 155, 99, 0.2)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    disabled={isTyping}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                    style={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-text-light)',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = 'var(--color-accent-dark)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = 'var(--color-accent)'
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


