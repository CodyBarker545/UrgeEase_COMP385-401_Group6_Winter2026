'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/frontend/lib/store'
import { submitAssessment } from '@/frontend/lib/api'

export default function AssessmentPage() {
    const user = useAuthStore((state) => state.user)
    const [form, setForm] = useState({
        Age: "",
        Gender: "",
        Relationship_Status: "",
        Occupation_Status: "",
        Mindless_Use: "",
        Distraction_When_Busy: "",
        Restless_Without_SM: "",
        Distractibility_Score: "",
        Worry_Score: "",
        Concentration_Difficulty: "",
        Social_Comparison: "",
        Validation_Seeking: "",
        Depression_Frequency: "",
        Interest_Fluctuation: "",
        Sleep_Issues: "",
        Daily_Usage_Hours: "",
        Platform_Count: "",
        Avg_Daily_Usage_Hours: "",
        Affects_Academic_Performance: "",
        Sleep_Hours_Per_Night: "",
        Mental_Health_Score: "",
        Conflicts_Over_Social_Media: ""

    })

    type Prediction = {
        dependence_risk_level: string;
        predicted_class: number;
        addiction_risk_level: string;
        addiction_score: number;
        assessment_id: string;
    }
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
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

        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error.message : 'Failed to submit assessment.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReset = () => {
        setForm({
            Age: "",
            Gender: "",
            Relationship_Status: "",
            Occupation_Status: "",
            Mindless_Use: "",
            Distraction_When_Busy: "",
            Restless_Without_SM: "",
            Distractibility_Score: "",
            Worry_Score: "",
            Concentration_Difficulty: "",
            Social_Comparison: "",
            Validation_Seeking: "",
            Depression_Frequency: "",
            Interest_Fluctuation: "",
            Sleep_Issues: "",
            Daily_Usage_Hours: "",
            Platform_Count: "",
            Avg_Daily_Usage_Hours: "",
            Affects_Academic_Performance: "",
            Sleep_Hours_Per_Night: "",
            Mental_Health_Score: "",
            Conflicts_Over_Social_Media: ""
        })
        setPrediction(null)
        setError(null)
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
                    Assessment
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Take the assessment to get your addiction score and dependence level
                </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12"
                style={{
                    borderColor: 'rgba(227, 155, 99, 0.3)',
                    backgroundColor: 'var(--color-card-bg)'
                }}>
                <form className='mx-auto max-w-4xl space-y-6' onSubmit={handleSubmit}>
                    {error && (
                        <div
                            className="rounded-lg border px-4 py-3 text-sm"
                            style={{
                                borderColor: 'rgba(220, 38, 38, 0.4)',
                                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                                color: '#fca5a5'
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div>
                        <label>Age: </label>
                        <input type="number" name='Age' value={form.Age} onChange={handleChange} min={1} required style={{ width: '50px' }} />
                    </div>
                    <div>
                        <label>Gender: </label>
                        <select name='Gender' value={form.Gender} onChange={handleChange} required>
                            <option></option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Non-Binary</option>
                            <option>Prefer not to say</option>
                        </select>
                    </div>
                    <div>
                        <label>Relationship status: </label>
                        <select name='Relationship_Status' value={form.Relationship_Status} onChange={handleChange} required>
                            <option></option>
                            <option>Single</option>
                            <option>Married</option>
                            <option>In a Relationship</option>
                            <option>Complicated</option>
                        </select>
                    </div>
                    <div>
                        <label>Occupation status: </label>
                        <select name='Occupation_Status' value={form.Occupation_Status} onChange={handleChange} required>
                            <option></option>
                            <option>Student</option>
                            <option>Working</option>
                            <option>Retired</option>
                        </select>
                    </div>
                    <div>
                        <label>How often do you find yourself using Social media without a specific purpose? </label>
                        <select name='Mindless_Use' value={form.Mindless_Use} onChange={handleChange} required>
                            <option></option>
                            <option value={1}>Never</option>
                            <option value={2}>Rarely</option>
                            <option value={3}>Sometimes</option>
                            <option value={4}>Often</option>
                            <option value={5}>Always</option>
                        </select>
                    </div>
                    <div>
                        <label>How often do you get distracted by Social media when you are busy doing something? </label>
                        <select name='Distraction_When_Busy' value={form.Distraction_When_Busy} onChange={handleChange} required>
                            <option></option>
                            <option value={1}>Never</option>
                            <option value={2}>Rarely</option>
                            <option value={3}>Sometimes</option>
                            <option value={4}>Often</option>
                            <option value={5}>Always</option>
                        </select>
                    </div>
                    <div>
                        <label>How often do you feel restless if you haven't used Social media in a while? </label>
                        <select name='Restless_Without_SM' value={form.Restless_Without_SM} onChange={handleChange} required>
                            <option></option>
                            <option value={1}>Never</option>
                            <option value={2}>Rarely</option>
                            <option value={3}>Sometimes</option>
                            <option value={4}>Often</option>
                            <option value={5}>Always</option>
                        </select>
                    </div>
                    <div>
                        <label>On a scale of 1 to 5, how easily distracted are you? </label>
                        <input type="number" name='Distractibility_Score' value={form.Distractibility_Score} onChange={handleChange} min={1} max={5} required />
                    </div>
                    <div>
                        <label>On a scale of 1 to 5, how much are you bothered by worries? </label>
                        <input type="number" name='Worry_Score' value={form.Worry_Score} onChange={handleChange} min={1} max={5} required />
                    </div>
                    <div>
                        <label>How often do you find it difficult to concentrate on things? </label>
                        <select name='Concentration_Difficulty' value={form.Concentration_Difficulty} onChange={handleChange} required>
                            <option></option>
                            <option value={1}>Never</option>
                            <option value={2}>Rarely</option>
                            <option value={3}>Sometimes</option>
                            <option value={4}>Often</option>
                            <option value={5}>Always</option>
                        </select>
                    </div>
                    <div>
                        <label>On a scale of 1-5, how often do you compare yourself to other successful people through the use of social media? </label>
                        <input type="number" name='Social_Comparison' value={form.Social_Comparison} onChange={handleChange} min={1} max={5} required />
                    </div>
                    <div>
                        <label>How often do you look to seek validation from features of social media? </label>
                        <select name='Validation_Seeking' value={form.Validation_Seeking} onChange={handleChange} required>
                            <option></option>
                            <option value={1}>Never</option>
                            <option value={2}>Rarely</option>
                            <option value={3}>Sometimes</option>
                            <option value={4}>Often</option>
                            <option value={5}>Always</option>
                        </select>
                    </div>
                    <div>
                        <label>How often do you feel depressed or down? </label>
                        <select name='Depression_Frequency' value={form.Depression_Frequency} onChange={handleChange} required>
                            <option></option>
                            <option value={1}>Never</option>
                            <option value={2}>Rarely</option>
                            <option value={3}>Sometimes</option>
                            <option value={4}>Often</option>
                            <option value={5}>Always</option>
                        </select>
                    </div>
                    <div>
                        <label>On a scale of 1 to 5, how frequently does your interest in daily activities fluctuate? </label>
                        <input type="number" name='Interest_Fluctuation' value={form.Interest_Fluctuation} onChange={handleChange} min={1} max={5} required />
                    </div>
                    <div>
                        <label>On a scale of 1 to 5, how often do you face issues regarding sleep? </label>
                        <input type="number" name='Sleep_Issues' value={form.Sleep_Issues} onChange={handleChange} min={1} max={5} required />
                    </div>
                    <div>
                        <label>How much time do you spend on social media every day? </label>
                        <select name='Daily_Usage_Hours' value={form.Daily_Usage_Hours} onChange={handleChange} required>
                            <option></option>
                            <option value={0.5}>Less than 1 hour</option>
                            <option value={1.5}>1-2 hours</option>
                            <option value={2.5}>2-3 hours</option>
                            <option value={3.5}>3-4 hours</option>
                            <option value={4.5}>4-5 hours</option>
                            <option value={6.0}>5+ hours</option>
                        </select>
                    </div>
                    <div>
                        <label>How many social media platforms do you commonly use? </label>
                        <input type="number" name='Platform_Count' value={form.Platform_Count} onChange={handleChange} required min={0} style={{ width: '50px' }} />
                    </div>
                    <div>
                        <label>How many hours of sleep per night do you get? </label>
                        <input type="number" name='Sleep_Hours_Per_Night' value={form.Sleep_Hours_Per_Night} onChange={handleChange} min={1} required style={{ width: '50px' }} />
                    </div>
                    <div>
                        <label>On a scale of 1-10, rate your overall mental health </label>
                        <input type="number" name='Mental_Health_Score' value={form.Mental_Health_Score} onChange={handleChange} min={1} max={10} required style={{ width: '50px' }} />
                    </div>
                    <div>
                        <label> What is the average time you spend on social media every day? </label>
                        <select name='Avg_Daily_Usage_Hours' value={form.Avg_Daily_Usage_Hours} onChange={handleChange} required>
                            <option></option>
                            <option value={0.5}>Less than 1 hour</option>
                            <option value={1.5}>1-2 hours</option>
                            <option value={2.5}>2-3 hours</option>
                            <option value={3.5}>3-4 hours</option>
                            <option value={4.5}>4-5 hours</option>
                            <option value={6.0}>5+ hours</option>
                        </select>
                    </div>
                    <div>
                        <label>Do you think your social media use has an effect on academic performance? </label>
                        <select name='Affects_Academic_Performance' value={form.Affects_Academic_Performance} onChange={handleChange} required>
                            <option></option>
                            <option>Yes</option>
                            <option>No</option>
                        </select>
                    </div>
                    <div>
                        <label>On a scale of 1-5, rate how much you get into conflicts regarding social media usage </label>
                        <input type="number" name='Conflicts_Over_Social_Media' value={form.Conflicts_Over_Social_Media} onChange={handleChange} min={1} max={5} required style={{ width: '50px' }} />
                    </div>
                    <div>
                        <button className="gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                            style={{
                                backgroundColor: 'var(--color-accent)',
                                color: 'var(--color-text-light)',
                            }} type='submit' disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>

                        <button className="gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                            style={{
                                backgroundColor: 'var(--color-accent)',
                                color: 'var(--color-text-light)',
                                marginLeft: '10px'
                            }} type='reset' onClick={handleReset}>Clear</button>
                    </div>
                </form>
                {prediction && (
                    <div>
                        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)', marginBottom: '20px', textAlign: 'center' }}>Prediction Result</h1>
                        <div style={{
                            display: 'grid',
                            gap: '10px',
                        }}>
                            <p><b>Assessment ID:</b> {prediction.assessment_id}</p>
                            <p><b>Addiction Score:</b> {prediction.addiction_score}</p>
                            <p><b>Addiction Risk:</b> {prediction.addiction_risk_level}</p>
                            <p><b>Dependence Class:</b> {prediction.predicted_class}</p>
                            <p><b>Dependence Risk:</b> {prediction.dependence_risk_level}</p>
                        </div>
                    </div>
                )

                }
            </div>
        </div>
    )
}
