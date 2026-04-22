'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Monitor, Download, Trash2, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore, usePreferencesStore } from '@/frontend/lib/store'
import { exportData, deleteAccount } from '@/frontend/lib/api'

// Shows account and app settings.
export default function SettingsPage() {
  const router = useRouter()
  const { setTheme: applyTheme } = useTheme()
  const logout = useAuthStore((state) => state.logout)
  const preferences = usePreferencesStore((state) => state.preferences)
  const setThemePreference = usePreferencesStore((state) => state.setTheme)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Handles handle export.
  const handleExport = async () => {
    setExporting(true)
    try {
      await exportData()
      alert('Data export initiated. In a real app, this would download your data.')
    } catch (error) {
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // Handles handle delete.
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
      router.push('/')
    } catch (error) {
      alert('Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  // Logs the user out.
  const handleLogout = () => {
    logout()
    router.push('/auth/sign-in')
  }

  // Changes the saved theme setting.
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme)
    applyTheme(theme)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          Settings
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Manage your account and preferences
        </p>
      </div>

      
      <div
        className="rounded-lg border-2 p-6"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'var(--color-card-bg)',
        }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--color-text-dark)' }}>
          Theme
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((theme) => {
            const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
            const isActive = preferences.theme === theme
            return (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 capitalize transition-all ${
                  isActive ? 'border-opacity-100' : 'border-opacity-30'
                }`}
                style={{
                  borderColor: isActive ? 'var(--color-accent)' : 'rgba(227, 155, 99, 0.3)',
                  backgroundColor: isActive ? 'rgba(227, 155, 99, 0.1)' : 'transparent',
                }}
              >
                <Icon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-dark)' }}>{theme}</span>
              </button>
            )
          })}
        </div>
      </div>

      
      <div
        className="rounded-lg border-2 p-6"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'var(--color-card-bg)',
        }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--color-text-dark)' }}>
          Privacy & Data
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all disabled:opacity-50"
            style={{
              borderColor: 'rgba(227, 155, 99, 0.2)',
              backgroundColor: 'transparent',
            }}
          >
            <div>
              <div className="font-medium" style={{ color: 'var(--color-text-dark)' }}>Export Data</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Download all your conversations and data
              </div>
            </div>
            <Download className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all"
            style={{
              borderColor: 'rgba(220, 38, 38, 0.3)',
              backgroundColor: 'transparent',
            }}
          >
            <div>
              <div className="font-medium" style={{ color: '#dc2626' }}>Delete Account</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Permanently delete all your data
              </div>
            </div>
            <Trash2 className="h-5 w-5" style={{ color: '#dc2626' }} />
          </button>
        </div>
      </div>

      
      <button
        onClick={handleLogout}
        className="w-full rounded-lg border-2 px-4 py-3 text-left font-medium transition-all"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'var(--color-card-bg)',
          color: 'var(--color-text-dark)',
        }}
      >
        <div className="flex items-center justify-between">
          <span>Sign Out</span>
          <LogOut className="h-5 w-5" />
        </div>
      </button>

      
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: 'var(--color-card-bg)' }}
          >
            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Delete Account
            </h3>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              This will permanently delete all your data, including conversations and results. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: 'rgba(227, 155, 99, 0.3)',
                  color: 'var(--color-text-dark)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'var(--color-text-light)',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

