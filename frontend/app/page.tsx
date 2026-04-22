'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      {}
      <div id="contact" className="sr-only" aria-hidden="true"></div>

      {}
      <Navbar />

      {}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Private • Judgment-free • AI-supported
            </motion.span>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Private, judgment-free support when urges hit.
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              UrgeEase is an offline recovery support tool for social media and pornography addiction, with chat support and results that help you understand triggers over time.
            </motion.p>
            <motion.div
              id="beta-signup"
              className="hero-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link
                href="/auth/sign-up"
                className="btn-primary btn-large btn-cta"
              >
                Get started
              </Link>
              <Link
                href="/auth/sign-in"
                className="btn-secondary btn-large btn-cta"
                style={{ marginLeft: '12px' }}
              >
                Sign in
              </Link>
              <p className="hero-note">
                Email verification • Anonymous by default • Not a substitute for professional care
              </p>
            </motion.div>
          </motion.div>
          <div className="hero-graphic">
            
            <div className="hero-wave-viz infinite-wave">
              <svg className="wave-svg" viewBox="0 0 1200 320" preserveAspectRatio="none">
                <defs>
                  
                  <linearGradient id="urgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#7BA3B8', stopOpacity: 0 }} />
                    <stop offset="6%" style={{ stopColor: '#7BA3B8', stopOpacity: 0.5 }} />
                    <stop offset="12%" style={{ stopColor: '#7BA3B8', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#9DB5C4', stopOpacity: 1 }} />
                    <stop offset="88%" style={{ stopColor: '#D4C5A9', stopOpacity: 1 }} />
                    <stop offset="94%" style={{ stopColor: '#D4C5A9', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: '#D4C5A9', stopOpacity: 0 }} />
                  </linearGradient>
                  
                  <linearGradient id="intensityFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#9DB5C4', stopOpacity: 0.06 }} />
                    <stop offset="100%" style={{ stopColor: '#9DB5C4', stopOpacity: 0 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                
                <path className="intensity-fill" d="M 50 286 
                       L 200 286
                       C 350 286, 450 270, 500 180
                       C 550 90, 580 70, 600 70
                       C 620 70, 650 90, 700 180
                       C 750 270, 850 286, 1000 286
                       L 1150 286
                       L 1150 320 L 50 320 Z" fill="url(#intensityFill)" />

                
                <path className="urge-story" d="M 50 286
                       L 200 286
                       C 350 286, 450 270, 500 180
                       C 550 90, 580 70, 600 70
                       C 620 70, 650 90, 700 180
                       C 750 270, 850 286, 1000 286
                       L 1150 286" fill="none" stroke="url(#urgeGradient)" strokeWidth="4"
                    strokeLinecap="round" />

                
                <circle className="presence-dot" r="11" fill="#E39B63" filter="url(#glow)">
                  <animateMotion dur="20s" repeatCount="indefinite" calcMode="spline"
                      keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0; 0.3; 0.7; 1">
                    <mpath href="#journeyPath" />
                  </animateMotion>
                </circle>

                <path id="journeyPath" d="M 50 286
                       L 200 286
                       C 350 286, 450 270, 500 180
                       C 550 90, 580 70, 600 70
                       C 620 70, 650 90, 700 180
                       C 750 270, 850 286, 1000 286
                       L 1150 286" fill="none" stroke="none" />
              </svg>
              
              <div className="wave-axes" aria-hidden="true">
                <div className="y-axis">
                  <span className="axis-label y-label">Intensity</span>
                  <div className="y-axis-line"></div>
                  <div className="y-ticks">
                    <span className="tick high">High</span>
                    <span className="tick mid">Med</span>
                    <span className="tick low">Low</span>
                  </div>
                </div>
                <div className="x-axis">
                  <div className="x-axis-line"></div>
                  <span className="axis-label x-label">Time →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="light-section stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">Offline Chat</div>
              <p className="stat-description">
                Use text chat for short, private support when urges show up.
              </p>
            </div>
            <div className="stat-card">
              <div className="stat-number">Triggers</div>
              <p className="stat-description">
                UrgeEase helps you notice patterns across time, emotion, environment, and thoughts.
              </p>
            </div>
            <div className="stat-card">
              <div className="stat-number">3–5 sessions</div>
              <p className="stat-description">
                After a few conversations, you&apos;ll see a results view with likely addictions and triggers.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section id="how-it-works" className="dark-section why-section">
        <div className="container">
          <h2 className="section-title centered">How UrgeEase helps</h2>
          <p className="story-text centered">
            A calm flow for the moments urges show up—designed to help you pause, feel a little safer, and notice what&apos;s going on.
          </p>

          <div className="journey-steps">
            
            <div className="journey-step">
              <div className="step-visual">
                <div className="micro-viz viz-fullscreen">
                  <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                    <rect x="55" y="35" width="90" height="130" rx="12" fill="none" stroke="#7BA3B8" strokeWidth="2" opacity="0.4" />
                    <rect x="60" y="40" width="80" height="120" rx="8" fill="#E39B63" opacity="0.15">
                      <animate attributeName="opacity" values="0;0.25;0.25;0" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <circle cx="100" cy="100" r="8" fill="#E39B63" opacity="0.8">
                      <animate attributeName="r" values="0;8;8" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0.8;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="100" cy="100" r="25" fill="none" stroke="#E39B63" strokeWidth="2" opacity="0">
                      <animate attributeName="r" values="8;40;40" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="100" cy="100" r="50" fill="none" stroke="#E39B63" strokeWidth="1" opacity="0">
                      <animate attributeName="r" values="8;60;60" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
              </div>
              <div className="step-content">
                <h4>Arrive in one place</h4>
                <p>
                  When you open UrgeEase, you land in a focused space away from feeds and tabs—just you and a calm prompt.
                </p>
              </div>
            </div>

            
            <div className="journey-step">
              <div className="step-visual">
                <div className="micro-viz viz-breathe">
                  <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                    <circle cx="100" cy="95" r="35" fill="#7BA3B8" opacity="0.15">
                      <animate attributeName="r" values="25;50;50;25" dur="19s" keyTimes="0;0.21;0.58;1" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0 0 1 1; 0.4 0 0.2 1" />
                      <animate attributeName="opacity" values="0.25;0.1;0.1;0.25" dur="19s" keyTimes="0;0.21;0.58;1" repeatCount="indefinite" />
                    </circle>
                    <circle cx="100" cy="95" r="35" fill="none" stroke="#7BA3B8" strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values="25;50;50;25" dur="19s" keyTimes="0;0.21;0.58;1" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0 0 1 1; 0.4 0 0.2 1" />
                    </circle>
                    <circle cx="100" cy="95" r="4" fill="#E39B63" opacity="0.8" />
                    <text x="60" y="165" textAnchor="middle" fill="#E39B63" fontSize="14" fontWeight="600" opacity="0.8">4</text>
                    <text x="60" y="178" textAnchor="middle" fill="#7BA3B8" fontSize="9" opacity="0.6">inhale</text>
                    <text x="100" y="165" textAnchor="middle" fill="#E39B63" fontSize="14" fontWeight="600" opacity="0.8">7</text>
                    <text x="100" y="178" textAnchor="middle" fill="#7BA3B8" fontSize="9" opacity="0.6">hold</text>
                    <text x="140" y="165" textAnchor="middle" fill="#E39B63" fontSize="14" fontWeight="600" opacity="0.8">8</text>
                    <text x="140" y="178" textAnchor="middle" fill="#7BA3B8" fontSize="9" opacity="0.6">exhale</text>
                  </svg>
                </div>
              </div>
              <div className="step-content">
                <h4>Notice, then breathe</h4>
                <p>
                  A brief pause to notice the urge without fighting it, with gentle guidance for breathing and grounding.
                </p>
              </div>
            </div>

            
            <div className="journey-step">
              <div className="step-visual">
                <div className="micro-viz viz-wave">
                  <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                    <path id="wavePath" d="M 20 140 Q 50 140 70 100 Q 90 50 100 50 Q 110 50 130 100 Q 150 140 180 140" fill="none" stroke="#7BA3B8" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                    <path d="M 20 140 Q 50 140 70 100 Q 90 50 100 50 Q 110 50 130 100 Q 150 140 180 140 L 180 160 L 20 160 Z" fill="#7BA3B8" opacity="0.08" />
                    <circle r="7" fill="#E39B63" opacity="0.9">
                      <animateMotion dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1">
                        <mpath href="#wavePath" />
                      </animateMotion>
                    </circle>
                    <text x="100" y="38" textAnchor="middle" fill="#E39B63" fontSize="10" fontWeight="500" opacity="0.7">peak</text>
                    <text x="30" y="155" textAnchor="start" fill="#7BA3B8" fontSize="9" opacity="0.5">start</text>
                    <text x="170" y="155" textAnchor="end" fill="#7BA3B8" fontSize="9" opacity="0.5">it passes</text>
                    <path d="M 155 140 L 175 140" stroke="#7BA3B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                    <path d="M 170 136 L 175 140 L 170 144" fill="none" stroke="#7BA3B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </div>
              </div>
              <div className="step-content">
                <h4>Ride the wave</h4>
                <p>
                  Short urge-surfing guidance helps you watch the urge rise and fall, so you can stay with it instead of acting on it.
                </p>
              </div>
            </div>

            
            <div className="journey-step">
              <div className="step-visual">
                <div className="micro-viz viz-actions">
                  <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                    <rect x="30" y="45" width="50" height="35" rx="6" fill="#E39B63" opacity="0.15" stroke="#E39B63" strokeWidth="1.5">
                      <animate attributeName="opacity" values="0;0.15;0.15" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <text x="55" y="67" textAnchor="middle" fill="#E39B63" fontSize="9" fontWeight="500" opacity="0">
                      Physical
                      <animate attributeName="opacity" values="0;0.8;0.8" dur="3s" repeatCount="indefinite" />
                    </text>
                    <rect x="90" y="45" width="50" height="35" rx="6" fill="#7BA3B8" opacity="0.15" stroke="#7BA3B8" strokeWidth="1.5">
                      <animate attributeName="opacity" values="0;0.15;0.15" dur="3s" begin="0.3s" repeatCount="indefinite" />
                    </rect>
                    <text x="115" y="67" textAnchor="middle" fill="#7BA3B8" fontSize="9" fontWeight="500" opacity="0">
                      Cognitive
                      <animate attributeName="opacity" values="0;0.8;0.8" dur="3s" begin="0.3s" repeatCount="indefinite" />
                    </text>
                    <rect x="150" y="45" width="50" height="35" rx="6" fill="#E39B63" opacity="0.15" stroke="#E39B63" strokeWidth="1.5">
                      <animate attributeName="opacity" values="0;0.15;0.15" dur="3s" begin="0.6s" repeatCount="indefinite" />
                    </rect>
                    <text x="175" y="67" textAnchor="middle" fill="#E39B63" fontSize="9" fontWeight="500" opacity="0">
                      Social
                      <animate attributeName="opacity" values="0;0.8;0.8" dur="3s" begin="0.6s" repeatCount="indefinite" />
                    </text>
                    <circle cx="100" cy="130" r="22" fill="#E39B63" opacity="0">
                      <animate attributeName="opacity" values="0;0;0.2;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="100" cy="130" r="22" fill="none" stroke="#E39B63" strokeWidth="2" opacity="0">
                      <animate attributeName="opacity" values="0;0;0.8;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <path d="M 88 130 L 96 138 L 114 120" fill="none" stroke="#E39B63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0">
                      <animate attributeName="opacity" values="0;0;0.9;0.9" dur="3s" repeatCount="indefinite" />
                    </path>
                    <text x="100" y="170" textAnchor="middle" fill="#7BA3B8" fontSize="10" opacity="0">
                      &quot;I did this&quot;
                      <animate attributeName="opacity" values="0;0;0.6;0.6" dur="3s" repeatCount="indefinite" />
                    </text>
                  </svg>
                </div>
              </div>
              <div className="step-content">
                <h4>Choose a next step</h4>
                <p>
                  Simple, pre-chosen actions—physical, cognitive, or social—help you shift your attention without shame.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="light-section defusion-section">
        <div className="container">
          <h2 className="section-title dark-title centered">
            Evidence-based techniques, delivered calmly
          </h2>
          <p className="defusion-intro centered">
            Small shifts like noticing thoughts, breathing, and urge-surfing can create space between impulse and action.
          </p>
          
          <div className="defusion-visual">
            <div className="thought-state thought-fused">
              <span className="state-label">The urge feels like:</span>
              <div className="thought-bubble urgent">
                <span className="thought-text">&quot;I need to check my phone&quot;</span>
              </div>
              <div className="state-indicator">
                <span className="indicator-icon">⚡</span>
                <span className="indicator-text">Feels like a command</span>
              </div>
            </div>

            <div className="defusion-arrow">
              <svg viewBox="0 0 60 24" fill="none">
                <path d="M0 12H50M50 12L40 4M50 12L40 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="arrow-label">Creating space</span>
            </div>

            <div className="thought-state thought-defused">
              <span className="state-label">Reframe it as:</span>
              <div className="thought-bubble observed">
                <span className="thought-prefix">I&apos;m noticing the thought that</span>
                <span className="thought-text">&quot;I need to check my phone&quot;</span>
              </div>
              <div className="state-indicator">
                <span className="indicator-icon">◯</span>
                <span className="indicator-text">Now it&apos;s just a thought</span>
              </div>
            </div>
          </div>

          <div className="defusion-space">
            <div className="space-visual">
              <div className="space-line"></div>
              <div className="space-dot"></div>
              <div className="space-label">Space to choose</div>
              <div className="space-dot"></div>
              <div className="space-line"></div>
            </div>
            <p className="defusion-explanation">This small shift creates space between thought and action.<br/>That&apos;s cognitive defusion—and it&apos;s why the pause matters.</p>
          </div>
        </div>
      </section>

      
      <section className="light-section where-going-section">
        <div className="container">
          <p className="where-going-label">Your private anchor</p>
          <div className="where-going-split">
            <div className="where-going-title">
              <h2 className="large-title">Remember why <span className="gradient-text">you&apos;re doing this.</span></h2>
            </div>
            <div className="where-going-intro">
              <p>
                During onboarding, you capture a short personal &quot;why&quot; and the situations that tend to pull you off track.
                When things get hard, these show up as gentle reminders—kept private and focused on what matters to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="dark-section roadmap-section">
        <div className="container">
          <div className="roadmap-grid">
            <div className="roadmap-item">
              <div className="roadmap-icon">
                <svg viewBox="0 0 32 32" fill="none" stroke="#E39B63" strokeWidth="1.5">
                  <circle cx="16" cy="16" r="12" />
                  <path d="M16 10v12M10 16h12" />
                </svg>
              </div>
              <h4 className="roadmap-title">Onboarding in 3 steps</h4>
              <p className="roadmap-description">
                Create an account, verify your email, and start with text chat support.
              </p>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-icon">
                <svg viewBox="0 0 32 32" fill="none" stroke="#E39B63" strokeWidth="1.5">
                  <rect x="4" y="8" width="24" height="16" rx="2" />
                  <path d="M10 16h12M10 20h8" />
                </svg>
              </div>
              <h4 className="roadmap-title">Voice mode planned</h4>
              <p className="roadmap-description">
                Voice support is planned for a future version. The current demo focuses on stable text chat.
              </p>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-icon">
                <svg viewBox="0 0 32 32" fill="none" stroke="#E39B63" strokeWidth="1.5">
                  <path d="M16 4l12 8v12l-12 8-12-8V12l12-8z" />
                  <circle cx="16" cy="16" r="4" />
                </svg>
              </div>
              <h4 className="roadmap-title">Results Dashboard</h4>
              <p className="roadmap-description">
                See identified addictions and trigger categories—temporal, emotional, environmental, and cognitive—with supporting excerpts.
              </p>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-icon">
                <svg viewBox="0 0 32 32" fill="none" stroke="#E39B63" strokeWidth="1.5">
                  <circle cx="16" cy="16" r="12" />
                  <path d="M8 16h16M16 8v16" />
                  <circle cx="16" cy="16" r="6" />
                </svg>
              </div>
              <h4 className="roadmap-title">Crisis-aware safety</h4>
              <p className="roadmap-description">
                If messages indicate crisis risk, UrgeEase can surface emergency resources and a dedicated crisis page immediately.
              </p>
            </div>
          </div>

          <p className="roadmap-footer">
            Built to support difficult moments—without judgment, pressure, or gamified streaks.
          </p>
        </div>
      </section>

      
      <section className="light-section faq-section">
        <div className="container">
          <h2 className="section-title dark-title centered">Frequently Asked Questions</h2>
          <div className="faq-accordion">
            <details className="faq-item">
              <summary className="faq-question">What problems is UrgeEase designed for?</summary>
              <p className="faq-answer">
                UrgeEase is designed for compulsive social media use and pornography addiction patterns—including urges, triggers, and relapse cycles.
              </p>
            </details>
            <details className="faq-item">
              <summary className="faq-question">Is this a replacement for therapy?</summary>
              <p className="faq-answer">
                No. UrgeEase is support—not a medical provider or a replacement for therapy. If you&apos;re in danger or in crisis, please use emergency resources or local emergency services.
              </p>
            </details>
            <details className="faq-item">
              <summary className="faq-question">How does privacy work?</summary>
              <p className="faq-answer">
                By default, conversations are stored locally on your device. Cloud sync is planned for future versions and will only be enabled with your explicit consent.
              </p>
            </details>
            <details className="faq-item">
              <summary className="faq-question">What interaction modes are available?</summary>
              <p className="faq-answer">
                The current demo supports text chat. Voice support and a video avatar are planned but are not available in this version.
              </p>
            </details>
            <details className="faq-item">
              <summary className="faq-question">When do I get results?</summary>
              <p className="faq-answer">
                After about 3–5 sessions, you&apos;ll see a dashboard summarizing likely addictions and trigger categories, with brief evidence excerpts.
              </p>
            </details>
          </div>
        </div>
      </section>

      
      <section className="dark-section testimonials-section">
        <div className="container">
          <h2 className="section-title centered">What UrgeEase is built to provide</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">
                &quot;A calmer place to pause before I react.&quot; <span style={{ fontSize: '12px', opacity: 0.7 }}>(Demo copy)</span>
              </p>
              <div className="testimonial-author">
                <span className="author-name">— What we aim for</span>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                &quot;It helped me notice my triggers without feeling judged.&quot;{' '}
                <span style={{ fontSize: '12px', opacity: 0.7 }}>(Demo copy)</span>
              </p>
              <div className="testimonial-author">
                <span className="author-name">— What we aim for</span>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                &quot;A short chat when I need a calm next step.&quot;{' '}
                <span style={{ fontSize: '12px', opacity: 0.7 }}>(Demo copy)</span>
              </p>
              <div className="testimonial-author">
                <span className="author-name">— What we aim for</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <footer className="recovery-footer">
        <div className="container container-full-height">
          <div className="footer-massive-title" aria-hidden="true">UrgeEase</div>

          <div className="footer-bottom-bar">
            <p className="copyright">
              © 2026 UrgeEase. Educational capstone project. Not a substitute for professional mental health care.
            </p>
            <div className="footer-links-row">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms</a>
              <a href="mailto:hello@urgeease.com">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

