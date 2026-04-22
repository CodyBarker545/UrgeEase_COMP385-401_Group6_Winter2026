import { writeEncryptedStorage, readEncryptedStorage } from './encryption'
import { STORAGE_KEYS } from './constants'

export type BehaviorType = 'phone' | 'scrolling' | 'gaming' | 'other'

export interface UserSettingsState {
  behaviorType?: BehaviorType
  behaviorLabel?: string
  onboardingCompleted?: boolean
  onboardingCompletedAt?: string
  disclaimerAccepted?: boolean
}

export interface WhyDocument {
  text: string
  createdAt?: string
  lastShownAt?: string | null
}

export interface ReplacementActivity {
  id: number
  category: 'physical' | 'cognitive' | 'social'
  name: string
}

export interface EnvironmentResetState {
  completed: boolean
  completedAt?: string
}

export interface TriggerLog {
  timestamp: number
  intensity: number
  emotion: string
  whatHelped: string
  notes?: string
  halt?: ('Hungry' | 'Angry' | 'Lonely' | 'Tired' | 'Bored')[]
  location?: 'Home' | 'Work' | 'Bed' | 'Other'
  precursorEvent?: string
  outcome?: 'Success' | 'Lapse'
  methodUsed?: string
}

export interface OnboardingState {
  userSettings: UserSettingsState
  whyDocument: WhyDocument
  replacementActivities: ReplacementActivity[]
  environmentReset: EnvironmentResetState
  triggerLogs: TriggerLog[]
}

const STORAGE_KEY = STORAGE_KEYS.ONBOARDING

const defaultState: OnboardingState = {
  userSettings: {
    behaviorType: undefined,
    behaviorLabel: undefined,
    onboardingCompleted: false,
    onboardingCompletedAt: undefined,
    disclaimerAccepted: false,
  },
  whyDocument: {
    text: '',
    createdAt: undefined,
    lastShownAt: null,
  },
  replacementActivities: [],
  environmentReset: {
    completed: false,
  },
  triggerLogs: [],
}

// Safely parses onboarding state.
function safeParse(value: string | null): OnboardingState {
  if (!value) {
    return defaultState
  }
  try {
    const parsed = JSON.parse(value)
    return {
      ...defaultState,
      ...parsed,
      userSettings: {
        ...defaultState.userSettings,
        ...parsed.userSettings,
      },
      whyDocument: {
        ...defaultState.whyDocument,
        ...parsed.whyDocument,
      },
      environmentReset: {
        ...defaultState.environmentReset,
        ...parsed.environmentReset,
      },
    }
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      console.error('Failed to parse onboarding state from localStorage:', error)
      console.error('Raw value:', value?.substring(0, 200)) 
    }
    return defaultState
  }
}

// Reads onboarding state from storage.
export function readOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return defaultState
  }
  try {
    const stored = readEncryptedStorage(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY)
    return safeParse(stored)
  } catch (error) {
    console.error('Failed to read from localStorage:', error)
    return defaultState
  }
}

// Saves onboarding state to storage.
export function saveOnboardingState(state: OnboardingState): OnboardingState {
  if (typeof window === 'undefined') {
    return state
  }
  try {
    const serialized = JSON.stringify(state)
    const success = writeEncryptedStorage(STORAGE_KEY, serialized)
    if (!success) {
      window.localStorage.setItem(STORAGE_KEY, serialized)
    }
    return state
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
    return state
  }
}

// Updates part of onboarding state.
export function updateOnboardingState(partial: Partial<OnboardingState>): OnboardingState {
  const current = readOnboardingState()
  const merged: OnboardingState = {
    ...current,
    ...partial,
    userSettings: {
      ...current.userSettings,
      ...partial.userSettings,
    },
    whyDocument: {
      ...current.whyDocument,
      ...partial.whyDocument,
    },
    environmentReset: {
      ...current.environmentReset,
      ...partial.environmentReset,
    },
  }
  return saveOnboardingState(merged)
}

// Adds a trigger log entry.
export function appendTriggerLog(entry: TriggerLog): OnboardingState {
  const current = readOnboardingState()
  const next = {
    ...current,
    triggerLogs: [...current.triggerLogs, entry],
  }
  return saveOnboardingState(next)
}


