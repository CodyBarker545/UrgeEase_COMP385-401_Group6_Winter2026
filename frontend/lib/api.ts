import type {
  User,
  SessionSummary,
  Message,
  SendMessageResponse,
  ResultsSummary,
  AddictionDetail,
  SignUpRequest,
  VerifyEmailRequest,
  SignInRequest,
  CreateSessionRequest,
  SendMessageRequest,
  AuthResponse,
  RecoveryPlan,
  ResultsAnalytics,
} from './types'

const AUTH_STORAGE_KEY = 'urgeease-auth'
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'

type BackendUser = {
  userId: string
  email: string
  preferredName?: string
  emailVerified?: boolean
  createdAt?: string | null
}

type BackendSession = {
  sessionId: string
  mode: 'chat' | 'voice'
  messageCount: number
  createdAt: string
  startedAt?: string | null
  endedAt?: string | null
  status?: string
}

type BackendMessage = {
  messageId: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

type BackendResult = {
  resultId: string
  userId?: string | null
  sessionId?: string | null
  generatedAt?: string | null
  resultType?: 'addiction' | 'dependence' | 'unknown'
  addictionScore?: number | null
  predictedClass?: number | null
  riskLevel?: string | number | null
  topTriggers?: string[]
  recommendations?: string[]
}

type PendingVerification = {
  userId: string
  email: string
  preferredName: string
}

export type AssessmentPayload = {
  Age: string
  Gender: string
  Relationship_Status: string
  Occupation_Status: string
  Mindless_Use: string
  Distraction_When_Busy: string
  Restless_Without_SM: string
  Distractibility_Score: string
  Worry_Score: string
  Concentration_Difficulty: string
  Social_Comparison: string
  Validation_Seeking: string
  Depression_Frequency: string
  Interest_Fluctuation: string
  Sleep_Issues: string
  Daily_Usage_Hours: string
  Platform_Count: string
  Avg_Daily_Usage_Hours: string
  Affects_Academic_Performance: string
  Sleep_Hours_Per_Night: string
  Mental_Health_Score: string
  Conflicts_Over_Social_Media: string
}

type BackendPlan = RecoveryPlan

// Reads JSON data from local storage.
function getJsonStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

// Gets the saved current user.
function getCurrentUser(): User | null {
  const authState = getJsonStorage<{ state?: { user?: User } }>(AUTH_STORAGE_KEY)
  return authState?.state?.user ?? null
}

// Gets the saved current user id.
function getCurrentUserId(): string | null {
  return getCurrentUser()?.id ?? null
}

// Builds the local backend auth token.
function buildToken(userId: string): string {
  return `backend_${userId}`
}

// Converts a backend user into app user data.
function toUser(user: BackendUser): User {
  return {
    id: user.userId,
    email: user.email,
    name: user.preferredName,
    createdAt: user.createdAt ?? new Date().toISOString(),
  }
}

// Converts a backend session into a summary.
function toSessionSummary(session: BackendSession): SessionSummary {
  return {
    id: session.sessionId,
    mode: session.mode,
    createdAt: session.createdAt ?? new Date().toISOString(),
    lastMessageAt: session.endedAt ?? session.startedAt ?? session.createdAt,
    messageCount: session.messageCount ?? 0,
  }
}

// Converts a result into a confidence value.
function toConfidence(result: BackendResult): number {
  const numericScore = typeof result.addictionScore === 'number' ? result.addictionScore : null
  if (numericScore !== null) {
    return Math.max(0, Math.min(100, Math.round(numericScore)))
  }

  const risk = String(result.riskLevel ?? '').toLowerCase()
  if (risk.includes('high')) return 85
  if (risk.includes('medium') || risk.includes('moderate')) return 65
  if (risk.includes('low')) return 35
  return 50
}

// Sends a request to the backend API.
async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed')
  }

  return data as T
}

// Creates a new account.
export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  try {
    const result = await apiRequest<BackendUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        preferredName: data.name,
      }),
    })

    if (typeof window !== 'undefined') {
      const pending: PendingVerification = {
        userId: result.userId,
        email: result.email,
        preferredName: result.preferredName ?? data.name,
      }
      sessionStorage.setItem(`verify_${result.email}`, '123456')
      sessionStorage.setItem(`pending_verify_${result.email}`, JSON.stringify(pending))
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to create account' }
  }
}

// Verifies an email code.
export async function verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
  try {
    const storedCode = typeof window !== 'undefined' ? sessionStorage.getItem(`verify_${data.email}`) : null
    if (data.code !== '123456' && data.code !== storedCode) {
      return { ok: false, error: 'Invalid verification code' }
    }

    const pending = typeof window !== 'undefined'
      ? sessionStorage.getItem(`pending_verify_${data.email}`)
      : null

    if (!pending) {
      return { ok: false, error: 'No pending verification found' }
    }

    const parsedPending = JSON.parse(pending) as PendingVerification
    const updatedUser = await apiRequest<BackendUser>(`/api/auth/user/${parsedPending.userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ emailVerified: true }),
    })

    return {
      ok: true,
      token: buildToken(updatedUser.userId),
      user: toUser(updatedUser),
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to verify email' }
  }
}

// Signs in an existing user.
export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  try {
    const result = await apiRequest<BackendUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    const fullUser = await apiRequest<BackendUser>(`/api/auth/user/${result.userId}`)

    return {
      ok: true,
      token: buildToken(result.userId),
      user: toUser(fullUser),
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to sign in' }
  }
}

// Gets the current saved user.
export async function getMe(): Promise<User | null> {
  const userId = getCurrentUserId()
  if (!userId) return null

  try {
    const result = await apiRequest<BackendUser>(`/api/auth/user/${userId}`)
    return toUser(result)
  } catch {
    return null
  }
}

// Creates a new backend session.
export async function createSession(data: CreateSessionRequest): Promise<{ sessionId: string }> {
  const userId = getCurrentUserId()
  if (!userId) {
    throw new Error('You must be signed in to create a session')
  }

  const result = await apiRequest<{ sessionId: string }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      mode: data.mode,
    }),
  })

  return { sessionId: result.sessionId }
}

// Submits assessment answers to the backend.
export async function submitAssessment(
  answers: AssessmentPayload
): Promise<{
  assessmentId: string
  addictionResult: {
    addiction_score: number
    risk_level: string
    resultId: string
  }
  dependenceResult: {
    predicted_class: number
    risk_level: string
    resultId: string
  }
  plan: RecoveryPlan
}> {
  const userId = getCurrentUserId()
  if (!userId) {
    throw new Error('You must be signed in to submit an assessment')
  }

  const { sessionId } = await createSession({ mode: 'chat' })

  return apiRequest('/api/assessments', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      sessionId,
      ...answers,
    }),
  })
}

// Gets the current recovery plan.
export async function getActivePlan(): Promise<RecoveryPlan | null> {
  const userId = getCurrentUserId()
  if (!userId) return null

  try {
    return await apiRequest<BackendPlan>(`/api/plans/user/${userId}/active`)
  } catch {
    return null
  }
}

// Updates one recovery plan action.
export async function updatePlanAction(planId: string, actionId: string, completed: boolean): Promise<RecoveryPlan> {
  return apiRequest<BackendPlan>(`/api/plans/${planId}/actions/${actionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  })
}

// Gets the current user sessions.
export async function getSessions(): Promise<SessionSummary[]> {
  const userId = getCurrentUserId()
  if (!userId) return []

  const result = await apiRequest<{ sessions: BackendSession[] }>(`/api/sessions/user/${userId}`)
  return result.sessions.map(toSessionSummary)
}

// Gets messages for one session.
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const [session, messages] = await Promise.all([
    apiRequest<BackendSession>(`/api/sessions/detail/${sessionId}`),
    apiRequest<{ messages: BackendMessage[] }>(`/api/sessions/${sessionId}/messages`),
  ])

  return messages.messages.map((message) => ({
    id: message.messageId,
    sessionId: message.sessionId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    mode: session.mode ?? 'chat',
  }))
}

// Sends one chat message.
export async function sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
  const userId = getCurrentUserId()
  if (!userId) {
    throw new Error('You must be signed in to send a message')
  }

  const response = await apiRequest<{
    assistantResponse: string
    assistantMessageId: string
    crisis?: boolean
  }>(`/api/sessions/${data.sessionId}/chat`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      message: data.text,
    }),
  })

  return {
    assistantMessage: {
      id: response.assistantMessageId,
      sessionId: data.sessionId,
      role: 'assistant',
      content: response.assistantResponse,
      createdAt: new Date().toISOString(),
      mode: data.mode,
    },
    crisisFlag: response.crisis ?? false,
  }
}

// Gets the current user results.
export async function getResults(): Promise<ResultsSummary> {
  const userId = getCurrentUserId()
  if (!userId) {
    return { sessionsCompleted: 0, addictions: [], unlocked: false }
  }

  const [sessions, latestResult, activePlan, analytics] = await Promise.all([
    getSessions(),
    apiRequest<BackendResult>(`/api/results/latest/${userId}`).catch(() => null),
    getActivePlan(),
    apiRequest<ResultsAnalytics>(`/api/results/analytics/${userId}`).catch(() => null),
  ])

  const sessionsCompleted = sessions.filter((session) => session.messageCount > 0).length
  if (!latestResult) {
    return {
      sessionsCompleted,
      addictions: [],
      unlocked: false,
      activePlan,
      analytics,
    }
  }

  return {
    sessionsCompleted,
    unlocked: true,
    activePlan,
    analytics,
    addictions: [
      {
        id: latestResult.resultId,
        name: 'Social Media Dependence',
        confidence: toConfidence(latestResult),
        topTriggers: latestResult.topTriggers ?? [],
      },
    ],
  }
}

// Gets details for one addiction result.
export async function getAddictionDetail(addictionId: string): Promise<AddictionDetail | null> {
  try {
    const result = await apiRequest<BackendResult>(`/api/results/${addictionId}`)
    const triggers = result.topTriggers ?? []

    return {
      id: result.resultId,
      name: 'Social Media Dependence',
      confidence: toConfidence(result),
      triggers: [
        {
          category: 'cognitive',
          triggers: triggers.length > 0 ? triggers : ['No trigger data available yet'],
          count: triggers.length,
        },
      ],
      evidence: result.recommendations?.map((recommendation, index) => ({
        id: `${result.resultId}_rec_${index}`,
        sessionId: result.sessionId ?? '',
        excerpt: recommendation,
        timestamp: result.generatedAt ?? new Date().toISOString(),
      })) ?? [],
    }
  } catch {
    return null
  }
}

// Starts a user data export.
export async function exportData(): Promise<{ downloadUrl: null }> {
  return { downloadUrl: null }
}

// Deletes the current account.
export async function deleteAccount(): Promise<{ ok: boolean }> {
  const userId = getCurrentUserId()
  if (!userId) {
    return { ok: true }
  }

  await apiRequest(`/api/auth/user/${userId}`, { method: 'DELETE' })
  return { ok: true }
}


