'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { AlertCircle, ArrowRight, BarChart3, ClipboardCheck, RotateCcw, Send, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { submitAssessment } from '@/frontend/lib/api'
import { useAuthStore } from '@/frontend/lib/store'
import { Button } from '@/frontend/components/ui/button'

const initialForm = {
  Age: '',
  Gender: '',
  Relationship_Status: '',
  Occupation_Status: '',
  Mindless_Use: '',
  Distraction_When_Busy: '',
  Restless_Without_SM: '',
  Distractibility_Score: '',
  Worry_Score: '',
  Concentration_Difficulty: '',
  Social_Comparison: '',
  Validation_Seeking: '',
  Depression_Frequency: '',
  Interest_Fluctuation: '',
  Sleep_Issues: '',
  Daily_Usage_Hours: '',
  Platform_Count: '',
  Avg_Daily_Usage_Hours: '',
  Affects_Academic_Performance: '',
  Sleep_Hours_Per_Night: '',
  Mental_Health_Score: '',
  Conflicts_Over_Social_Media: '',
}

type FormState = typeof initialForm
type FieldName = keyof FormState

type Prediction = {
  dependence_risk_level: string
  predicted_class: number
  addiction_risk_level: string
  addiction_score: number
  assessment_id: string
}

type PlanSummary = {
  focusArea: string | null
  actionCount: number
}

type SelectField = {
  type: 'select'
  name: FieldName
  label: string
  placeholder: string
  options: Array<{ label: string; value: string }>
}

type NumberField = {
  type: 'number'
  name: FieldName
  label: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

type Field = SelectField | NumberField

const frequencyOptions = [
  { label: 'Never', value: '1' },
  { label: 'Rarely', value: '2' },
  { label: 'Sometimes', value: '3' },
  { label: 'Often', value: '4' },
  { label: 'Always', value: '5' },
]

const usageOptions = [
  { label: 'Less than 1 hour', value: '0.5' },
  { label: '1-2 hours', value: '1.5' },
  { label: '2-3 hours', value: '2.5' },
  { label: '3-4 hours', value: '3.5' },
  { label: '4-5 hours', value: '4.5' },
  { label: '5+ hours', value: '6.0' },
]

const sections: Array<{ title: string; description: string; fields: Field[] }> = [
  {
    title: 'Profile',
    description: 'Basic details help calibrate the assessment context.',
    fields: [
      { type: 'number', name: 'Age', label: 'Age', min: 1, placeholder: '18' },
      {
        type: 'select',
        name: 'Gender',
        label: 'Gender',
        placeholder: 'Select gender',
        options: [
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
          { label: 'Non-binary', value: 'Non-Binary' },
          { label: 'Prefer not to say', value: 'Prefer not to say' },
        ],
      },
      {
        type: 'select',
        name: 'Relationship_Status',
        label: 'Relationship status',
        placeholder: 'Select status',
        options: [
          { label: 'Single', value: 'Single' },
          { label: 'Married', value: 'Married' },
          { label: 'In a relationship', value: 'In a Relationship' },
          { label: 'Complicated', value: 'Complicated' },
        ],
      },
      {
        type: 'select',
        name: 'Occupation_Status',
        label: 'Occupation status',
        placeholder: 'Select occupation',
        options: [
          { label: 'Student', value: 'Student' },
          { label: 'Working', value: 'Working' },
          { label: 'Retired', value: 'Retired' },
        ],
      },
    ],
  },
  {
    title: 'Social Media Behavior',
    description: 'Reflect on how social media shows up during your day.',
    fields: [
      {
        type: 'select',
        name: 'Mindless_Use',
        label: 'Using social media without a specific purpose',
        placeholder: 'Choose frequency',
        options: frequencyOptions,
      },
      {
        type: 'select',
        name: 'Distraction_When_Busy',
        label: 'Getting distracted by social media while busy',
        placeholder: 'Choose frequency',
        options: frequencyOptions,
      },
      {
        type: 'select',
        name: 'Restless_Without_SM',
        label: "Feeling restless when you haven't used social media",
        placeholder: 'Choose frequency',
        options: frequencyOptions,
      },
      {
        type: 'select',
        name: 'Concentration_Difficulty',
        label: 'Difficulty concentrating on tasks',
        placeholder: 'Choose frequency',
        options: frequencyOptions,
      },
      {
        type: 'select',
        name: 'Validation_Seeking',
        label: 'Seeking validation through social media features',
        placeholder: 'Choose frequency',
        options: frequencyOptions,
      },
      {
        type: 'number',
        name: 'Social_Comparison',
        label: 'Comparing yourself to successful people online',
        min: 1,
        max: 5,
        placeholder: '1-5',
      },
      {
        type: 'number',
        name: 'Conflicts_Over_Social_Media',
        label: 'Conflicts related to social media usage',
        min: 1,
        max: 5,
        placeholder: '1-5',
      },
    ],
  },
  {
    title: 'Wellbeing',
    description: 'Rate focus, sleep, mood, and general mental health.',
    fields: [
      { type: 'number', name: 'Distractibility_Score', label: 'Ease of distraction', min: 1, max: 5, placeholder: '1-5' },
      { type: 'number', name: 'Worry_Score', label: 'How much worries bother you', min: 1, max: 5, placeholder: '1-5' },
      {
        type: 'select',
        name: 'Depression_Frequency',
        label: 'Feeling depressed or down',
        placeholder: 'Choose frequency',
        options: frequencyOptions,
      },
      { type: 'number', name: 'Interest_Fluctuation', label: 'Interest in daily activities fluctuates', min: 1, max: 5, placeholder: '1-5' },
      { type: 'number', name: 'Sleep_Issues', label: 'Issues regarding sleep', min: 1, max: 5, placeholder: '1-5' },
      { type: 'number', name: 'Sleep_Hours_Per_Night', label: 'Hours of sleep per night', min: 1, step: 0.5, placeholder: '7' },
      { type: 'number', name: 'Mental_Health_Score', label: 'Overall mental health rating', min: 1, max: 10, placeholder: '1-10' },
    ],
  },
  {
    title: 'Usage Pattern',
    description: 'Estimate your daily usage and platform habits.',
    fields: [
      {
        type: 'select',
        name: 'Daily_Usage_Hours',
        label: 'Time spent on social media each day',
        placeholder: 'Select time range',
        options: usageOptions,
      },
      { type: 'number', name: 'Platform_Count', label: 'Social media platforms commonly used', min: 0, placeholder: '3' },
      {
        type: 'select',
        name: 'Affects_Academic_Performance',
        label: 'Social media affects academic performance',
        placeholder: 'Select an answer',
        options: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
        ],
      },
    ],
  },
]

const fieldClass =
  'h-10 w-full rounded-lg border border-black/10 bg-white/70 px-3 text-sm text-[var(--color-text-dark)] shadow-sm transition focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(227,155,99,0.18)] dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10'

export default function AssessmentPage() {
  const user = useAuthStore((state) => state.user)
  const [form, setForm] = useState<FormState>(initialForm)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'Daily_Usage_Hours' ? { Avg_Daily_Usage_Hours: value } : {}),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setError('A signed-in user is required to submit the assessment.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const assessment = await submitAssessment(form)
      setPrediction({
        dependence_risk_level: assessment.dependenceResult.risk_level,
        predicted_class: assessment.dependenceResult.predicted_class,
        addiction_risk_level: assessment.addictionResult.risk_level,
        addiction_score: assessment.addictionResult.addiction_score,
        assessment_id: assessment.assessmentId,
      })
      setPlanSummary({
        focusArea: assessment.plan.focusArea,
        actionCount: assessment.plan.actions.length,
      })
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : 'Failed to submit assessment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm(initialForm)
    setPrediction(null)
    setPlanSummary(null)
    setError(null)
  }

  const renderField = (field: Field) => (
    <label key={field.name} className="block space-y-1">
      <span className="flex min-h-8 items-end text-[13px] font-semibold leading-4 text-[var(--color-text-dark)]">
        {field.label}
      </span>
      {field.type === 'select' ? (
        <select
          className={fieldClass}
          name={field.name}
          value={form[field.name]}
          onChange={handleChange}
          required
        >
          <option value="">{field.placeholder}</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={fieldClass}
          type="number"
          name={field.name}
          value={form[field.name]}
          onChange={handleChange}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          required
        />
      )}
    </label>
  )

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[96rem] flex-col space-y-4">
      <section className="rounded-xl border border-black/10 bg-[var(--color-card-bg)] p-5 shadow-subtle dark:border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(227,155,99,0.35)] bg-[rgba(227,155,99,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              <ClipboardCheck className="h-4 w-4" />
              Assessment
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-[var(--color-text-dark)] md:text-3xl">
              Social media wellbeing assessment
            </h1>
            <p className="mt-2 text-sm leading-5 text-[var(--color-text-muted)]">
              Estimate your addiction score, dependence level, and personalized recovery plan.
            </p>
          </div>

          <div className="w-full rounded-lg border border-black/10 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5 lg:w-80">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Scale guide
            </p>
            <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">
              Use your best estimate. For scaled questions, 1 is low and 5 is high.
            </p>
          </div>
        </div>
      </section>

      <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <form id="assessment-form" className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <p>{error}</p>
            </div>
          )}

          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-black/10 bg-[var(--color-card-bg)] p-4 shadow-sm dark:border-white/10"
            >
              <div className="mb-4 flex flex-col gap-1 border-b border-black/10 pb-3 dark:border-white/10">
                <h2 className="text-lg font-semibold text-[var(--color-text-dark)]">{section.title}</h2>
                <p className="text-sm text-[var(--color-text-muted)]">{section.description}</p>
              </div>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map(renderField)}
              </div>
            </section>
          ))}
        </form>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-xl border border-black/10 bg-[var(--color-card-bg)] p-5 shadow-subtle dark:border-white/10">
            <p className="text-sm font-semibold text-[var(--color-text-dark)]">Submit assessment</p>
            <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">
              Your results and plan will appear here after submission.
            </p>
            <div className="mt-4 flex gap-3">
              <Button type="button" variant="outline" onClick={handleReset} className="h-9 flex-1 gap-2 px-3 text-sm">
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </Button>
              <Button type="submit" form="assessment-form" disabled={submitting} className="h-9 flex-1 gap-2 px-3 text-sm">
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </section>

          {planSummary && (
            <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-subtle">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-dark)]">
                    Your plan is ready
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                    We made a plan to help you with
                    {planSummary.focusArea ? ` ${planSummary.focusArea}` : ' your top trigger areas'}.
                    {planSummary.actionCount > 0
                      ? ` It includes ${planSummary.actionCount} practical ${planSummary.actionCount === 1 ? 'step' : 'steps'}.`
                      : ' It is ready when you are.'}
                  </p>
                </div>
              </div>
              <Button asChild className="mt-4 h-9 w-full gap-2 px-3 text-sm">
                <Link href="/app/plan">
                  View my plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </section>
          )}

          {prediction && (
            <section className="rounded-xl border border-[rgba(227,155,99,0.35)] bg-[rgba(227,155,99,0.10)] p-5 shadow-subtle">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-dark)]">Prediction result</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">ID: {prediction.assessment_id}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  ['Addiction score', prediction.addiction_score],
                  ['Addiction risk', prediction.addiction_risk_level],
                  ['Dependence class', prediction.predicted_class],
                  ['Dependence risk', prediction.dependence_risk_level],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-black/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
                    <p className="text-xl font-semibold text-[var(--color-text-dark)]">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
