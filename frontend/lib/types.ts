
export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

export interface SessionSummary {
  id: string
  mode: 'chat' | 'voice'
  createdAt: string
  lastMessageAt?: string
  messageCount: number
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  mode: 'chat' | 'voice'
}

export interface SendMessageResponse {
  assistantMessage: Message
  crisisFlag?: boolean
}

export interface ResultsSummary {
  sessionsCompleted: number
  addictions: AddictionSummary[]
  unlocked: boolean
  activePlan?: RecoveryPlan | null
}

export interface AddictionSummary {
  id: string
  name: string
  confidence: number
  topTriggers: string[]
}

export interface AddictionDetail {
  id: string
  name: string
  confidence: number
  triggers: TriggerCategory[]
  evidence: EvidenceExcerpt[]
}

export interface TriggerCategory {
  category: 'temporal' | 'emotional' | 'environmental' | 'cognitive'
  triggers: string[]
  count: number
}

export interface RecoveryAction {
  id: string
  title: string
  description: string
  frequency: string
  completed: boolean
}

export interface RecoveryPlan {
  planId: string
  userId: string | null
  assessmentId: string | null
  sessionId: string | null
  createdAt: string | null
  reviewDate: string | null
  status: string | null
  focusArea: string | null
  riskLevel: string | null
  summary: string | null
  goals: string[]
  actions: RecoveryAction[]
}

export interface EvidenceExcerpt {
  id: string
  sessionId: string
  excerpt: string
  timestamp: string
}

export interface AuthResponse {
  ok: boolean
  token?: string
  user?: User
  error?: string
}

export interface SignUpRequest {
  name: string
  email: string
  password: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface CreateSessionRequest {
  mode: 'chat' | 'voice'
}

export interface SendMessageRequest {
  sessionId: string
  mode: 'chat' | 'voice'
  text: string
}

export interface UserPreferences {
  preferredMode: 'chat' | 'voice'
  tone: 'calm' | 'direct'
  theme: 'light' | 'dark' | 'system'
}

export interface OnboardingData {
  completed: boolean
  preferredMode?: 'chat' | 'voice'
  tone?: 'calm' | 'direct'
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface NormalizedAuthError extends ApiError {
  originalError?: unknown
}

export interface SignUpResponse {
  data?: {
    user: unknown
    session: unknown
  }
  error: NormalizedAuthError | null
}

export interface SignInResponse {
  error: NormalizedAuthError | null
}

export const AUTH_TIMEOUT_MS = 15000

export function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        message: 'Request timeout',
        status: 504,
        code: 'TIMEOUT',
      } satisfies ApiError)
    }, timeoutMs)
  })
}

export function normalizeAuthError(error: unknown): NormalizedAuthError {
  if (!error) {
    return { message: 'Unknown authentication error', originalError: error }
  }

  if (typeof error === 'object' && 'message' in error) {
    const candidate = error as { message?: unknown; status?: unknown; code?: unknown }
    return {
      message: typeof candidate.message === 'string' ? candidate.message : 'Authentication error',
      status: typeof candidate.status === 'number' ? candidate.status : undefined,
      code: typeof candidate.code === 'string' ? candidate.code : undefined,
      originalError: error,
    }
  }

  if (typeof error === 'string') {
    return { message: error, originalError: error }
  }

  return { message: 'Authentication error', originalError: error }
}

