'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { appendTriggerLog, readOnboardingState } from '@/lib/onboarding'
import { createClientSupabase } from '@/lib/supabase'
import PostPanicReEngagement from './PostPanicReEngagement'
import { Phone, MessageCircle, X, LogOut } from 'lucide-react'
import { TIMING, EXERCISE } from '@/lib/constants'
import { validatePrecursorEvent } from '@/lib/validation'
import { getErrorMessage } from '@/lib/error-messages'
import { isIOSPWA } from '@/lib/type-guards'

interface PanicFlowProps {
  isOpen: boolean
  onClose: () => void
  behaviorLabel?: string
  whyDocument?: string
  userId?: string
}
type PanicMethod = 
  | 'physiological-sigh'
  | 'cold-water'
  | 'grounding-54321'
  | 'math-sabotage'
  | '10-minute-contract'
  | 'urge-surfing'
  | 'physical-energy'
  | 'reverse-visualization'
  | 'identity-flashcard'
  | 'environmental-reset'

const PANIC_METHODS: PanicMethod[] = [
  'physiological-sigh',
  'cold-water',
  'grounding-54321',
  'math-sabotage',
  '10-minute-contract',
  'urge-surfing',
  'physical-energy',
  'reverse-visualization',
  'identity-flashcard',
  'environmental-reset',
]
const COLORS = {
  teal: {
    light: '#B8E6E6',
    medium: '#7FD4D4',
    dark: '#4AB3B3',
  },
  orange: {
    light: '#FFE5D4',
    medium: '#FFC8A3',
    dark: '#E39B63',
  },
  background: '#F0F9F9',
  text: '#2C3E50',
  medicalBlue: '#2563EB',
  medicalBlueLight: '#DBEAFE',
  neutralGrey: '#6B7280',
}


// Runs the panic support flow.
export default function PanicFlow({ isOpen, onClose, behaviorLabel, whyDocument, userId }: PanicFlowProps) {
  const [showReEngagement, setShowReEngagement] = useState(false)
  const [showCrisisMenu, setShowCrisisMenu] = useState(false)
  useEffect(() => {
    if (!isOpen) {
      setShowReEngagement(false)
      setShowCrisisMenu(false)
    }
  }, [isOpen])
  const [step, setStep] = useState<'sos' | 'method' | 'log' | 'success'>('sos')
  const [selectedMethod, setSelectedMethod] = useState<PanicMethod | null>(null)
  const [pressProgress, setPressProgress] = useState(0)
  const [isPressing, setIsPressing] = useState(false)
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pressStartRef = useRef<number | null>(null)
  const contractIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const surfingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const coldWaterIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [halt, setHalt] = useState<('Hungry' | 'Angry' | 'Lonely' | 'Tired' | 'Bored')[]>([])
  const [intensity, setIntensity] = useState(6)
  const [location, setLocation] = useState<'Home' | 'Work' | 'Bed' | 'Other'>('Home')
  const [precursorEvent, setPrecursorEvent] = useState('')
  const [outcome, setOutcome] = useState<'Success' | 'Lapse'>('Success')
  const [breathCount, setBreathCount] = useState(0)
  const [coldWaterCountdown, setColdWaterCountdown] = useState(30)
  const [groundingAnswers, setGroundingAnswers] = useState<Record<number, string>>({})
  const [mathProblems, setMathProblems] = useState<Array<{ a: number; b: number; answer: number }>>([])
  const [mathAnswers, setMathAnswers] = useState<Record<number, string>>({})
  const [contractTime, setContractTime] = useState(600) 
  const [surfingTaps, setSurfingTaps] = useState(0)
  const [surfingTime, setSurfingTime] = useState(90)
  const [repCount, setRepCount] = useState(0)
  const [visualizationText, setVisualizationText] = useState('')
  const [environmentConfirm, setEnvironmentConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('sos')
      setPressProgress(0)
      setIsPressing(false)
      const randomMethod = PANIC_METHODS[Math.floor(Math.random() * PANIC_METHODS.length)]
      setSelectedMethod(randomMethod)
      resetMethodStates()
      setHalt([])
      setIntensity(6)
      setLocation('Home')
      setPrecursorEvent('')
      setOutcome('Success')
    }
  }, [isOpen])

  // Resets all panic method state.
  const resetMethodStates = () => {
    setBreathCount(0)
    setColdWaterCountdown(EXERCISE.COLD_WATER_COUNTDOWN_SECONDS)
    setGroundingAnswers({})
    setMathAnswers({})
    setContractTime(EXERCISE.CONTRACT_DURATION_SECONDS)
    setSurfingTaps(0)
    setSurfingTime(EXERCISE.URGE_SURFING_DURATION_SECONDS)
    setRepCount(0)
    setVisualizationText('')
    setEnvironmentConfirm(false)
  }
  // Starts the long press timer.
  const handlePressStart = useCallback(() => {
    setIsPressing(true)
    pressStartRef.current = Date.now()
    setPressProgress(0)

    const interval = setInterval(() => {
      if (pressStartRef.current) {
        const elapsed = Date.now() - pressStartRef.current
        const progress = Math.min((elapsed / 2000) * 100, 100)
        setPressProgress(progress)

        if (elapsed >= 2000) {
          clearInterval(interval)
          activatePanicButton()
        }
      }
    }, 16) 

    pressTimerRef.current = interval as unknown as NodeJS.Timeout
  }, [])

  // Stops the long press timer.
  const handlePressEnd = useCallback(() => {
    setIsPressing(false)
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current)
      pressTimerRef.current = null
    }
    pressStartRef.current = null
    setPressProgress(0)
  }, [])

  
  // Moves from SOS into the selected method.
  const activatePanicButton = () => {
    setStep('method')
    resetMethodStates()
    initializeMethod()
  }

  
  // Sets up state for the selected panic method.
  const initializeMethod = () => {
    if (!selectedMethod) return

    switch (selectedMethod) {
      case 'math-sabotage':
        const problems: Array<{ a: number; b: number; answer: number }> = []
        let start = EXERCISE.MATH_START_VALUE
        for (let i = 0; i < EXERCISE.MATH_PROBLEMS_COUNT; i++) {
          const subtract = EXERCISE.MATH_SUBTRACTION_VALUE
          problems.push({ a: start, b: subtract, answer: start - subtract })
          start = start - subtract
        }
        setMathProblems(problems)
        break
      case '10-minute-contract':
        setContractTime(EXERCISE.CONTRACT_DURATION_SECONDS)
        break
      case 'urge-surfing':
        setSurfingTime(EXERCISE.URGE_SURFING_DURATION_SECONDS)
        break
      case 'cold-water':
        setColdWaterCountdown(EXERCISE.COLD_WATER_COUNTDOWN_SECONDS)
        break
    }
  }
  useEffect(() => {
    if (step === 'method' && selectedMethod === '10-minute-contract') {
      if (contractIntervalRef.current) {
        clearInterval(contractIntervalRef.current)
      }
      
      contractIntervalRef.current = setInterval(() => {
        setContractTime((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        if (contractIntervalRef.current) {
          clearInterval(contractIntervalRef.current)
          contractIntervalRef.current = null
        }
      }
    } else {
      if (contractIntervalRef.current) {
        clearInterval(contractIntervalRef.current)
        contractIntervalRef.current = null
      }
    }
  }, [step, selectedMethod])

  useEffect(() => {
    if (step === 'method' && selectedMethod === 'urge-surfing') {
      if (surfingIntervalRef.current) {
        clearInterval(surfingIntervalRef.current)
      }
      
      surfingIntervalRef.current = setInterval(() => {
        setSurfingTime((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        if (surfingIntervalRef.current) {
          clearInterval(surfingIntervalRef.current)
          surfingIntervalRef.current = null
        }
      }
    } else {
      if (surfingIntervalRef.current) {
        clearInterval(surfingIntervalRef.current)
        surfingIntervalRef.current = null
      }
    }
  }, [step, selectedMethod])

  useEffect(() => {
    if (step === 'method' && selectedMethod === 'cold-water') {
      if (coldWaterIntervalRef.current) {
        clearInterval(coldWaterIntervalRef.current)
      }
      
      coldWaterIntervalRef.current = setInterval(() => {
        setColdWaterCountdown((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        if (coldWaterIntervalRef.current) {
          clearInterval(coldWaterIntervalRef.current)
          coldWaterIntervalRef.current = null
        }
      }
    } else {
      if (coldWaterIntervalRef.current) {
        clearInterval(coldWaterIntervalRef.current)
        coldWaterIntervalRef.current = null
      }
    }
  }, [step, selectedMethod])

  // Moves from the method step to logging.
  const handleMethodComplete = () => {
    setStep('log')
  }

  // Saves the panic log and shows success.
  const handleLogSubmit = () => {
    try {
      appendTriggerLog({
        timestamp: Date.now(),
        intensity,
        emotion: halt.join(', ') || 'Unknown',
        whatHelped: selectedMethod || 'Unknown method',
        notes: precursorEvent,
        halt,
        location,
        precursorEvent,
        outcome,
        methodUsed: selectedMethod || undefined,
      })
      setStep('success')
    } catch (error) {
      console.error('Failed to save trigger log:', error)
      setStep('success')
    }
  }

  // Skips the log step and shows success.
  const handleSkipLog = () => {
    setStep('success')
  }

  // Closes the flow after success.
  const handleSuccessClose = () => {
    onClose()
    setStep('sos')
    resetMethodStates()
    if (userId) {
      setShowReEngagement(true)
    }
  }

  // Opens the crisis options menu.
  const handleCrisisMenuOpen = () => {
    setShowCrisisMenu(true)
    if (userId) {
    }
  }

  // Leaves the app from the crisis menu.
  const handleExitApp = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      if (isIOSPWA()) {
        window.close()
      } else {
        window.location.href = 'about:blank'
      }
    }
  }
  // Renders the SOS start button.
  const renderSOSButton = () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '400px',
      gap: '24px'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 600, 
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        Pattern Interrupter
      </h2>
      <p style={{ 
        fontSize: '16px', 
        color: COLORS.text, 
        opacity: 0.7,
        textAlign: 'center',
        maxWidth: '320px'
      }}>
        Hold for 2 seconds to activate
      </p>
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: 'none',
          background: isPressing
            ? `linear-gradient(135deg, ${COLORS.teal.dark} 0%, ${COLORS.orange.dark} 100%)`
            : `linear-gradient(135deg, ${COLORS.teal.medium} 0%, ${COLORS.orange.medium} 100%)`,
          color: '#fff',
          fontSize: '48px',
          fontWeight: 700,
          cursor: isPressing ? 'pointer' : 'grab',
          boxShadow: isPressing
            ? `0 0 40px rgba(74, 179, 179, 0.6), inset 0 0 60px rgba(255, 255, 255, 0.2)`
            : `0 8px 24px rgba(0, 0, 0, 0.2)`,
          transform: isPressing ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.1s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `conic-gradient(from 0deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${pressProgress}%, transparent ${pressProgress}%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ position: 'relative', zIndex: 1 }}>SOS</span>
        </div>
      </button>
      {isPressing && (
        <div style={{
          width: '200px',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginTop: '-16px'
        }}>
          <div style={{
            width: `${pressProgress}%`,
            height: '100%',
            background: '#fff',
            transition: 'width 0.1s linear',
          }} />
        </div>
      )}
    </div>
  )
  // Renders the selected panic method.
  const renderMethod = () => {
    if (!selectedMethod) return null

    switch (selectedMethod) {
      case 'physiological-sigh':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              The Physiological Sigh
            </h3>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
              Take 2 quick inhales through your nose, then 1 long exhale through your mouth.
            </p>
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border: `4px solid ${COLORS.teal.medium}`,
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              background: COLORS.teal.light,
              animation: breathCount % 3 === 0 ? 'pulse 2s ease-in-out' : 'none',
            }}>
              {breathCount % 3 === 0 ? '↗↗' : breathCount % 3 === 1 ? '↘' : '○'}
            </div>
            <p style={{ fontSize: '18px', fontWeight: 600, color: COLORS.teal.dark, marginBottom: '16px' }}>
              Round {Math.floor(breathCount / EXERCISE.BREATHS_PER_ROUND) + 1} of {EXERCISE.PHYSIOLOGICAL_SIGH_ROUNDS}
            </p>
            <button
              onClick={() => {
                setBreathCount(prev => prev + 1)
                if (breathCount >= EXERCISE.TOTAL_BREATHS - 1) {
                  setTimeout(() => handleMethodComplete(), 500)
                }
              }}
              aria-label="Continue breathing exercise"
              style={{
                padding: '12px 32px',
                background: COLORS.teal.medium,
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {breathCount % 3 === 0 ? 'Inhale (2x)' : breathCount % 3 === 1 ? 'Exhale (long)' : 'Next Round'}
            </button>
          </div>
        )

      case 'cold-water':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              Cold Water Reset
            </h3>
            <p style={{ fontSize: '18px', fontWeight: 600, color: COLORS.teal.dark, marginBottom: '8px' }}>
              {coldWaterCountdown}
            </p>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
              Splash ice-cold water on your face NOW to trigger the Mammalian Dive Reflex.
            </p>
            {coldWaterCountdown === 0 && (
              <button
                onClick={handleMethodComplete}
                style={{
                  padding: '12px 32px',
                  background: COLORS.teal.medium,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'grounding-54321':
        const senses = [
          { num: 5, sense: 'things you see', key: 5 },
          { num: 4, sense: 'things you feel', key: 4 },
          { num: 3, sense: 'things you hear', key: 3 },
          { num: 2, sense: 'things you smell', key: 2 },
          { num: 1, sense: 'thing you taste', key: 1 },
        ]
        const currentSense = senses.find(s => !groundingAnswers[s.key]) || senses[senses.length - 1]
        const allAnswered = Object.keys(groundingAnswers).length === EXERCISE.GROUNDING_SENSES_COUNT

        return (
          <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text, textAlign: 'center' }}>
              5-4-3-2-1 Grounding
            </h3>
            {!allAnswered ? (
              <>
                <p style={{ fontSize: '18px', fontWeight: 600, color: COLORS.teal.dark, marginBottom: '8px', textAlign: 'center' }}>
                  {currentSense.num} {currentSense.sense}
                </p>
                <input
                  type="text"
                  value={groundingAnswers[currentSense.key] || ''}
                  onChange={(e) => setGroundingAnswers(prev => ({ ...prev, [currentSense.key]: e.target.value }))}
                  placeholder={`Type ${currentSense.num} ${currentSense.sense}...`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: `2px solid ${COLORS.teal.medium}`,
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                />
                <button
                  onClick={() => {
                    if (groundingAnswers[currentSense.key]) {
                      if (allAnswered) {
                        handleMethodComplete()
                      }
                    }
                  }}
                  disabled={!groundingAnswers[currentSense.key]}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: groundingAnswers[currentSense.key] ? COLORS.teal.medium : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: groundingAnswers[currentSense.key] ? 'pointer' : 'not-allowed',
                  }}
                >
                  {currentSense.key === 1 ? 'Complete' : 'Next'}
                </button>
              </>
            ) : (
              <button
                onClick={handleMethodComplete}
                aria-label="Complete 5-4-3-2-1 grounding exercise"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.teal.medium,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'math-sabotage':
        const allMathAnswered = mathProblems.length > 0 && mathProblems.every((_, i) => mathAnswers[i] && Number(mathAnswers[i]) === mathProblems[i].answer)
        const currentMathIndex = mathProblems.findIndex((_, i) => !mathAnswers[i] || Number(mathAnswers[i]) !== mathProblems[i].answer)

        return (
          <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text, textAlign: 'center' }}>
              Cognitive Math Sabotage
            </h3>
            {mathProblems.length > 0 && !allMathAnswered && (
              <>
                <p style={{ fontSize: '18px', fontWeight: 600, color: COLORS.teal.dark, marginBottom: '16px', textAlign: 'center' }}>
                  {mathProblems[currentMathIndex]?.a} - {mathProblems[currentMathIndex]?.b} = ?
                </p>
                <input
                  type="number"
                  value={mathAnswers[currentMathIndex] || ''}
                  onChange={(e) => setMathAnswers(prev => ({ ...prev, [currentMathIndex]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '24px',
                    textAlign: 'center',
                    border: `2px solid ${COLORS.teal.medium}`,
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                />
                {Number(mathAnswers[currentMathIndex]) === mathProblems[currentMathIndex]?.answer && (
                  <p style={{ color: COLORS.teal.dark, textAlign: 'center', marginBottom: '16px' }}>✓ Correct!</p>
                )}
              </>
            )}
            {allMathAnswered && (
              <button
                onClick={handleMethodComplete}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.teal.medium,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case '10-minute-contract':
        const minutes = Math.floor(contractTime / 60)
        const seconds = contractTime % 60
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              10-Minute Contract
            </h3>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
              The chemical peak of an urge lasts less than 10 minutes. Stay here with me until the clock hits zero.
            </p>
            <div style={{
              fontSize: '64px',
              fontWeight: 700,
              color: COLORS.orange.dark,
              marginBottom: '24px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            {contractTime === 0 && (
              <button
                onClick={handleMethodComplete}
                style={{
                  padding: '12px 32px',
                  background: COLORS.teal.medium,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'urge-surfing':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              Urge Surfing
            </h3>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
              Tap the screen to stay on the board as the wave peaks and subsides.
            </p>
            <div style={{ marginBottom: '24px' }}>
              <svg width="300" height="200" viewBox="0 0 300 200" style={{ maxWidth: '100%' }}>
                <path
                  d={`M 0 100 Q 75 ${100 - Math.sin((90 - surfingTime) / 90 * Math.PI) * 40} 150 100 T 300 100`}
                  stroke={COLORS.teal.medium}
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx={150}
                  cy={100 - Math.sin((90 - surfingTime) / 90 * Math.PI) * 40}
                  r="8"
                  fill={COLORS.orange.dark}
                />
              </svg>
            </div>
            <p style={{ fontSize: '18px', fontWeight: 600, color: COLORS.teal.dark, marginBottom: '8px' }}>
              {surfingTime}s remaining
            </p>
            <p style={{ fontSize: '14px', color: COLORS.text, opacity: 0.7 }}>
              Taps: {surfingTaps}
            </p>
            <div
              onClick={() => setSurfingTaps(prev => prev + 1)}
              style={{
                padding: '24px',
                background: COLORS.teal.light,
                borderRadius: '12px',
                cursor: 'pointer',
                marginTop: '16px',
              }}
            >
              <p style={{ fontSize: '16px', fontWeight: 600, color: COLORS.teal.dark }}>Tap to stay on board</p>
            </div>
            {surfingTime === 0 && (
              <button
                onClick={handleMethodComplete}
                style={{
                  marginTop: '16px',
                  padding: '12px 32px',
                  background: COLORS.teal.medium,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'physical-energy':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              Physical Energy Burst
            </h3>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
              Do 15 pushups or 20 jumping jacks
            </p>
            <div style={{
              fontSize: '64px',
              fontWeight: 700,
              color: COLORS.orange.dark,
              marginBottom: '24px',
            }}>
              {repCount}
            </div>
            <button
              onClick={() => {
                setRepCount(prev => {
                  const newCount = prev + 1
                  if (newCount >= 20) {
                    setTimeout(() => handleMethodComplete(), 500)
                  }
                  return newCount
                })
              }}
              style={{
                padding: '12px 32px',
                background: COLORS.orange.medium,
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Rep Counter
            </button>
          </div>
        )

      case 'reverse-visualization':
        return (
          <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text, textAlign: 'center' }}>
              Reverse Visualization
            </h3>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '16px', textAlign: 'center' }}>
              Describe the most boring, non-stimulating object in the room in 50 words.
            </p>
            <textarea
              value={visualizationText}
              onChange={(e) => setVisualizationText(e.target.value)}
              placeholder="Type your description here..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                fontSize: '16px',
                border: `2px solid ${COLORS.teal.medium}`,
                borderRadius: '8px',
                marginBottom: '8px',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: '14px', color: COLORS.text, opacity: 0.6, marginBottom: '16px', textAlign: 'right' }}>
              {visualizationText.split(/\s+/).filter(w => w.length > 0).length} / 50 words
            </p>
            <button
              onClick={handleMethodComplete}
              disabled={visualizationText.split(/\s+/).filter(w => w.length > 0).length < 50}
              style={{
                width: '100%',
                padding: '12px',
                background: visualizationText.split(/\s+/).filter(w => w.length > 0).length >= EXERCISE.REVERSE_VISUALIZATION_MIN_WORDS ? COLORS.teal.medium : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: visualizationText.split(/\s+/).filter(w => w.length > 0).length >= 50 ? 'pointer' : 'not-allowed',
              }}
            >
              Continue
            </button>
          </div>
        )

      case 'identity-flashcard':
        return (
          <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              Identity Flashcard
            </h3>
            <div style={{
              padding: '24px',
              background: COLORS.orange.light,
              borderRadius: '12px',
              marginBottom: '24px',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <p style={{ fontSize: '18px', color: COLORS.text, lineHeight: 1.6 }}>
                {whyDocument || "Remember why you're doing this. Your future self is counting on you."}
              </p>
            </div>
            <button
              onClick={handleMethodComplete}
              style={{
                padding: '12px 32px',
                background: COLORS.orange.medium,
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Commit to my future self
            </button>
          </div>
        )

      case 'environmental-reset':
        return (
          <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
              Environmental Reset
            </h3>
            <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
              Pick up your phone and walk into a different room or outside.
            </p>
            <input
              type="text"
              value={environmentConfirm ? 'I am here' : ''}
              onChange={(e) => setEnvironmentConfirm(e.target.value.toLowerCase() === 'i am here')}
              placeholder="Type 'I am here' when you have changed your environment"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: `2px solid ${COLORS.teal.medium}`,
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            />
            {environmentConfirm && (
              <button
                onClick={handleMethodComplete}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.teal.medium,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }
  // Renders the panic log form.
  const renderLog = () => (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', color: COLORS.text, textAlign: 'center' }}>
        Post-Urge Clinical Log
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: COLORS.text }}>
          HALT Check (select all that apply):
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(['Hungry', 'Angry', 'Lonely', 'Tired', 'Bored'] as const).map((item) => (
            <button
              key={item}
              onClick={() => {
                setHalt(prev => 
                  prev.includes(item) 
                    ? prev.filter(h => h !== item)
                    : [...prev, item]
                )
              }}
              style={{
                padding: '8px 16px',
                background: halt.includes(item) ? COLORS.teal.medium : COLORS.teal.light,
                color: halt.includes(item) ? '#fff' : COLORS.text,
                border: `2px solid ${COLORS.teal.medium}`,
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: COLORS.text }}>
          Intensity: {intensity}/10
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: COLORS.text }}>
          Location/Context:
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value as typeof location)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: `2px solid ${COLORS.teal.medium}`,
            borderRadius: '8px',
          }}
        >
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Bed">Bed</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: COLORS.text }}>
          Precursor Event (what were you doing 5 minutes before?):
        </label>
        <input
          type="text"
          value={precursorEvent}
          onChange={(e) => setPrecursorEvent(e.target.value)}
          placeholder="E.g., Scrolling social media, feeling stressed..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: `2px solid ${COLORS.teal.medium}`,
            borderRadius: '8px',
          }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: COLORS.text }}>
          Outcome:
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setOutcome('Success')}
            style={{
              flex: 1,
              padding: '12px',
              background: outcome === 'Success' ? COLORS.teal.medium : COLORS.teal.light,
              color: outcome === 'Success' ? '#fff' : COLORS.text,
              border: `2px solid ${COLORS.teal.medium}`,
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Success
          </button>
          <button
            onClick={() => setOutcome('Lapse')}
            style={{
              flex: 1,
              padding: '12px',
              background: outcome === 'Lapse' ? COLORS.orange.medium : COLORS.orange.light,
              color: outcome === 'Lapse' ? '#fff' : COLORS.text,
              border: `2px solid ${COLORS.orange.medium}`,
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Lapse
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleLogSubmit}
          aria-label="Save trigger log"
          style={{
            flex: 1,
            padding: '12px',
            background: COLORS.teal.medium,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save Log
        </button>
        <button
          onClick={handleSkipLog}
          aria-label="Skip saving trigger log"
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            color: COLORS.text,
            border: `2px solid ${COLORS.teal.medium}`,
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  )
  // Renders the success screen.
  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>
        ✅ You Interrupted the Urge
      </h3>
      <p style={{ fontSize: '16px', color: COLORS.text, opacity: 0.8, marginBottom: '24px' }}>
        Nice work. Keep using the panic button whenever you need your pause.
      </p>
      <button
        onClick={handleSuccessClose}
        style={{
          padding: '12px 32px',
          background: COLORS.teal.medium,
          color: '#fff',
          border: 'none',
          borderRadius: '24px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Return to Dashboard
      </button>
    </div>
  )

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        paddingBottom: '80px', 
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '32px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: 'calc(90vh - 80px)', 
          overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: COLORS.text, opacity: 0.7 }}>
              Urgent Help
            </span>
            
            {step === 'sos' && (
              <button
                onClick={handleSuccessClose}
                aria-label="Close panic flow"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: COLORS.text,
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            )}
          </div>
          <div>
            {step === 'sos' && renderSOSButton()}
            {step === 'method' && renderMethod()}
            {step === 'log' && renderLog()}
            {step === 'success' && renderSuccess()}
          </div>
        </div>
      </div>

      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${COLORS.medicalBlueLight}`,
        zIndex: 2001,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleCrisisMenuOpen}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.medicalBlue,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.medicalBlueLight
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Phone size={16} />
          <span>Need more support? Get help now</span>
        </button>
      </div>

      
      {showCrisisMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowCrisisMenu(false)}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '600px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: COLORS.text,
              }}>
                Crisis Support Resources
              </h3>
              <button
                onClick={() => setShowCrisisMenu(false)}
                aria-label="Close crisis resources menu"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.neutralGrey,
                }}
              >
                <X size={20} />
              </button>
            </div>

            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{
                border: `1px solid ${COLORS.medicalBlueLight}`,
                borderRadius: '12px',
                padding: '16px',
                background: COLORS.medicalBlueLight,
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: COLORS.medicalBlue,
                    marginBottom: '4px',
                  }}>
                    Call or Text 9-8-8
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: COLORS.neutralGrey,
                    lineHeight: 1.4,
                  }}>
                    24/7 National Suicide Prevention & Mental Health Support
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href="tel:988"
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: COLORS.medicalBlue,
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <Phone size={16} />
                    Call 9-8-8
                  </a>
                  <a
                    href="sms:988"
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: '#fff',
                      color: COLORS.medicalBlue,
                      border: `1px solid ${COLORS.medicalBlue}`,
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = COLORS.medicalBlueLight
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff'
                    }}
                  >
                    <MessageCircle size={16} />
                    Text 9-8-8
                  </a>
                </div>
              </div>

              
              <div style={{
                border: `1px solid ${COLORS.medicalBlueLight}`,
                borderRadius: '12px',
                padding: '16px',
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: '4px',
                }}>
                  Call 1-800-668-6868
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: COLORS.neutralGrey,
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}>
                  Support for young people across Canada
                </p>
                <a
                  href="tel:18006686868"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: COLORS.medicalBlue,
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <Phone size={16} />
                  Call Kids Help Phone
                </a>
              </div>

              
              <div style={{
                border: `1px solid ${COLORS.medicalBlueLight}`,
                borderRadius: '12px',
                padding: '16px',
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: '4px',
                }}>
                  Call 1-855-242-3310
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: COLORS.neutralGrey,
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}>
                  Immediate mental health support for all Indigenous peoples in Canada
                </p>
                <a
                  href="tel:18552423310"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: COLORS.medicalBlue,
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <Phone size={16} />
                  Call Hope for Wellness
                </a>
              </div>

              
              <div style={{
                border: `1px solid ${COLORS.medicalBlueLight}`,
                borderRadius: '12px',
                padding: '16px',
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: '4px',
                }}>
                  Call 8-1-1 or 2-1-1
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: COLORS.neutralGrey,
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}>
                  Non-emergency health advice and local community services
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href="tel:811"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: COLORS.medicalBlue,
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <Phone size={16} />
                    Call 8-1-1
                  </a>
                  <a
                    href="tel:211"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: COLORS.medicalBlue,
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <Phone size={16} />
                    Call 2-1-1
                  </a>
                </div>
              </div>

              
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${COLORS.medicalBlueLight}`,
              }}>
                <button
                  onClick={handleExitApp}
                  aria-label="Exit app and clear session data"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: COLORS.neutralGrey,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <LogOut size={16} />
                  Exit App
                </button>
                <p style={{
                  fontSize: '11px',
                  color: COLORS.neutralGrey,
                  marginTop: '8px',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}>
                  Closes the app and clears session data for privacy
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReEngagement && userId && (
        <PostPanicReEngagement
          userId={userId}
          onDismiss={() => setShowReEngagement(false)}
        />
      )}
    </>
  )
}


