'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/frontend/contexts/AuthContext'
import { createClientSupabase } from '@/frontend/lib/supabase'
import { readOnboardingState, updateOnboardingState, ReplacementActivity } from '@/frontend/lib/onboarding'
import { validateWhyDocument, validateReplacementActivity } from '@/frontend/lib/validation'
import { getErrorMessage, SUCCESS_MESSAGES } from '@/frontend/lib/error-messages'
import { EXERCISE, STORAGE_KEYS } from '@/frontend/lib/constants'
import {
  Settings,
  Heart,
  RefreshCw,
  Shield,
  Download,
  Trash2,
  Eye,
  EyeOff,
  CheckSquare,
  Phone,
  FileText,
  ArrowLeft,
} from 'lucide-react'

// Shows account and app settings.
export default function SettingsPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [whyDocument, setWhyDocument] = useState('')
  const [replacementBehaviors, setReplacementBehaviors] = useState<string[]>([])
  const [privacyMode, setPrivacyMode] = useState(false)
  const [loadingState, setLoadingState] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteFinal, setShowDeleteFinal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Handles load settings.
  const loadSettings = useCallback(async () => {
    if (!user) return

    try {
      const supabase = createClientSupabase()
      const { data: userData } = await supabase
        .from('users')
        .select('why_document')
        .eq('id', user.id)
        .single()

      if (userData?.why_document) {
        setWhyDocument(userData.why_document)
      } else {
        const onboardingState = readOnboardingState()
        if (onboardingState?.whyDocument?.text) {
          setWhyDocument(onboardingState.whyDocument.text)
        }
      }
      const { data: replacementData } = await supabase
        .from('users')
        .select('replacement_behaviors')
        .eq('id', user.id)
        .single()

      if (replacementData?.replacement_behaviors) {
        try {
          const parsed = JSON.parse(replacementData.replacement_behaviors)
          if (Array.isArray(parsed)) {
            setReplacementBehaviors(parsed)
          }
        } catch (e) {
          console.error('Error parsing replacement behaviors:', e)
        }
      } else {
        const onboardingState = readOnboardingState()
        if (onboardingState?.replacementActivities?.length) {
          setReplacementBehaviors(onboardingState.replacementActivities.map(a => a.name))
        }
      }
      const savedPrivacyMode = localStorage.getItem('urgease_privacy_mode')
      setPrivacyMode(savedPrivacyMode === 'true')
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoadingState(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user, loadSettings])

  
  // Handles handle save why.
  const handleSaveWhy = async () => {
    if (!user) return
    const validation = validateWhyDocument(whyDocument)
    if (!validation.valid) {
      alert(validation.error || getErrorMessage('VALIDATION_FAILED'))
      return
    }
    
    setSaving(true)
    const previousWhy = whyDocument
    const sanitizedWhy = validation.sanitized || whyDocument

    try {
      const supabase = createClientSupabase()
      const { error } = await supabase
        .from('users')
        .update({ why_document: sanitizedWhy, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        throw error
      }
      await updateOnboardingState({
        whyDocument: {
          text: sanitizedWhy,
          createdAt: new Date().toISOString(),
          lastShownAt: null,
        },
      })
      
      alert(SUCCESS_MESSAGES.SAVE_SUCCESS)
      setWhyDocument(sanitizedWhy) 
    } catch (error) {
      console.error('Error saving Why document:', error)
      setWhyDocument(previousWhy)
      alert(getErrorMessage('SAVE_FAILED'))
    } finally {
      setSaving(false)
    }
  }

  // Handles handle update replacement.
  const handleUpdateReplacement = async (index: number, newValue: string) => {
    if (!user) return
    
    const trimmedValue = newValue.trim()
    if (!trimmedValue) {
      const updated = replacementBehaviors.filter((_, i) => i !== index)
      setReplacementBehaviors(updated)
      try {
        const supabase = createClientSupabase()
        await supabase
          .from('users')
          .update({ 
            replacement_behaviors: JSON.stringify(updated),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error removing empty replacement:', error)
        setReplacementBehaviors(replacementBehaviors)
      }
      return
    }
    const validation = validateReplacementActivity(trimmedValue)
    if (!validation.valid) {
      alert(validation.error || getErrorMessage('VALIDATION_FAILED'))
      const updated = [...replacementBehaviors]
      updated[index] = replacementBehaviors[index] 
      setReplacementBehaviors(updated)
      return
    }

    const sanitizedValue = validation.sanitized || trimmedValue
    const previous = [...replacementBehaviors]
    const updated = [...replacementBehaviors]
    updated[index] = sanitizedValue
    setReplacementBehaviors(updated)

    try {
      const supabase = createClientSupabase()
      const { error } = await supabase
        .from('users')
        .update({ 
          replacement_behaviors: JSON.stringify(updated),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }
      const activities: ReplacementActivity[] = updated.map((name, idx) => ({
        id: idx + 1,
        category: 'physical' as const,
        name,
      }))
      await updateOnboardingState({
        replacementActivities: activities,
      })
    } catch (error) {
      console.error('Error updating replacement behavior:', error)
      setReplacementBehaviors(previous)
      alert(getErrorMessage('UPDATE_FAILED'))
    }
  }

  // Handles handle add replacement.
  const handleAddReplacement = () => {
    if (replacementBehaviors.length >= EXERCISE.REPLACEMENT_ACTIVITIES_MAX) {
      alert(`Maximum ${EXERCISE.REPLACEMENT_ACTIVITIES_MAX} replacement activities allowed.`)
      return
    }
    setReplacementBehaviors([...replacementBehaviors, ''])
  }

  // Handles handle remove replacement.
  const handleRemoveReplacement = async (index: number) => {
    if (!user) return

    const previousBehaviors = [...replacementBehaviors]
    const updated = replacementBehaviors.filter((_, i) => i !== index)
    setReplacementBehaviors(updated)

    try {
      const supabase = createClientSupabase()
      
      const { error } = await supabase
        .from('users')
        .update({ 
          replacement_behaviors: JSON.stringify(updated),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      const activities: ReplacementActivity[] = updated.map((name, idx) => ({
        id: idx + 1,
        category: 'physical' as const,
        name,
      }))
      await updateOnboardingState({
        replacementActivities: activities,
      })
    } catch (error) {
      console.error('Error removing replacement behavior:', error)
      setReplacementBehaviors(previousBehaviors)
      alert(getErrorMessage('DELETE_FAILED'))
    }
  }

  // Handles handle toggle privacy mode.
  const handleTogglePrivacyMode = () => {
    const newValue = !privacyMode
    setPrivacyMode(newValue)
    localStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, String(newValue))
  }

  // Handles handle export data.
  const handleExportData = async () => {
    if (!user || exporting) return

    setExporting(true)
    try {
      const supabase = createClientSupabase()
      const onboardingState = readOnboardingState()
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        userProfile: userData,
        onboardingState,
        triggerLogs: onboardingState?.triggerLogs || [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `urgease-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert(getErrorMessage('DATA_EXPORT_FAILED'))
    } finally {
      setExporting(false)
    }
  }

  
  // Handles handle delete account.
  const handleDeleteAccount = async () => {
    if (!user || deleteInput !== 'DELETE') return

    try {
      const supabase = createClientSupabase()

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) {
        console.error('Error deleting account:', error)
        alert(getErrorMessage('ACCOUNT_DELETE_FAILED'))
        return
      }
      localStorage.removeItem('urgease_onboarding')
      localStorage.removeItem('urgease_privacy_mode')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert(getErrorMessage('ACCOUNT_DELETE_FAILED'))
    }
  }

  if (loading || loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-text-dark)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <Settings size={24} style={{ color: 'var(--color-accent)' }} />
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Account & Privacy Settings
            </h1>
          </div>
        </div>

        
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Identity & Motivation
            </h2>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
            <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-dark)' }}>
              Edit My "Why"
            </label>
            <textarea
              value={whyDocument}
              onChange={(e) => setWhyDocument(e.target.value)}
              placeholder="What are you fighting for? What reason keeps you strong?"
              className="w-full px-4 py-3 rounded-lg border resize-none"
              style={{
                background: 'var(--color-background)',
                borderColor: 'rgba(227, 155, 99, 0.2)',
                color: 'var(--color-text-dark)',
                minHeight: '120px',
              }}
              rows={5}
            />
            <button
              onClick={handleSaveWhy}
              disabled={saving}
              className="mt-4 px-6 py-2 rounded-full font-semibold transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-light)',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border mt-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
            <label className="block mb-4 text-sm font-medium" style={{ color: 'var(--color-text-dark)' }}>
              Replacement Behaviors
            </label>
            <div className="space-y-3">
              {replacementBehaviors.map((behavior, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={behavior}
                    onChange={(e) => {
                      const updated = [...replacementBehaviors]
                      updated[index] = e.target.value
                      setReplacementBehaviors(updated)
                    }}
                    onBlur={(e) => handleUpdateReplacement(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    placeholder={`Activity ${index + 1}`}
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{
                      background: 'var(--color-background)',
                      borderColor: behavior.trim() === '' 
                        ? '#dc2626' 
                        : 'rgba(227, 155, 99, 0.2)',
                      color: 'var(--color-text-dark)',
                    }}
                    aria-label={`Replacement activity ${index + 1}`}
                  />
                  <button
                    onClick={() => handleRemoveReplacement(index)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    style={{ color: '#dc2626' }}
                    aria-label={`Remove replacement activity ${index + 1}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {replacementBehaviors.length < EXERCISE.REPLACEMENT_ACTIVITIES_MAX && (
                <button
                  onClick={handleAddReplacement}
                  className="w-full px-4 py-2 rounded-lg border-2 border-dashed transition-colors"
                  style={{
                    borderColor: 'rgba(227, 155, 99, 0.3)',
                    color: 'var(--color-accent)',
                  }}
                >
                  + Add Replacement Activity
                </button>
              )}
            </div>
          </div>
        </div>

        
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Privacy & Security
            </h2>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
            <div className="space-y-4">
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'rgba(227, 155, 99, 0.2)',
                  color: 'var(--color-text-dark)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Download size={18} />
                  <span>{exporting ? 'Exporting...' : 'Download My Data'}</span>
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  JSON Export
                </span>
              </button>

              <div className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
                <div className="flex items-center gap-3">
                  {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                  <span style={{ color: 'var(--color-text-dark)' }}>Privacy Mode</span>
                </div>
                <button
                  onClick={handleTogglePrivacyMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    privacyMode ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      privacyMode ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:bg-red-50"
                style={{
                  borderColor: '#dc2626',
                  color: '#dc2626',
                }}
              >
                <Trash2 size={18} />
                <span>Delete All Data & Account</span>
              </button>
            </div>
          </div>
        </div>

        
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Environmental Reset
            </h2>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:bg-gray-50"
              style={{
                borderColor: 'rgba(227, 155, 99, 0.2)',
                color: 'var(--color-text-dark)',
              }}
            >
              <CheckSquare size={18} />
              <span>Review Environment Reset Checklist</span>
            </button>
          </div>
        </div>

        
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Support & Legal
            </h2>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-dark)' }}>
                  Crisis Resources
                </h3>
                <div className="space-y-2 text-sm">
                  <a
                    href="tel:988"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    988 Suicide & Crisis Lifeline (US)
                  </a>
                  <a
                    href="tel:1-800-273-8255"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    National Suicide Prevention Lifeline: 1-800-273-8255
                  </a>
                  <a
                    href="tel:1-833-456-4566"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    TalkSuicide Canada: 1-833-456-4566
                  </a>
                  <a
                    href="tel:811"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Alberta Health Services (AHS): 811
                  </a>
                </div>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
                <a
                  href="/privacy"
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: 'var(--color-text-dark)' }}
                >
                  <FileText size={18} />
                  <span>Privacy Policy</span>
                </a>
                <a
                  href="/terms"
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors mt-2"
                  style={{ color: 'var(--color-text-dark)' }}
                >
                  <FileText size={18} />
                  <span>Terms of Service</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-dark)' }}>
              Delete Account?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              This will permanently delete all your data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'rgba(227, 155, 99, 0.2)',
                  color: 'var(--color-text-dark)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setShowDeleteFinal(true)
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  background: '#dc2626',
                  color: 'white',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteFinal && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#dc2626' }}>
              Final Confirmation
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Type <strong>DELETE</strong> to confirm you want to permanently delete your account and all data.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 rounded-lg border mb-4"
              style={{
                borderColor: 'rgba(227, 155, 99, 0.2)',
                color: 'var(--color-text-dark)',
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteFinal(false)
                  setDeleteInput('')
                }}
                className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'rgba(227, 155, 99, 0.2)',
                  color: 'var(--color-text-dark)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE'}
                className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#dc2626',
                  color: 'white',
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


