'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ─── technique definitions ────────────────────────────────────────────────────
// Preserved exactly from breathing-tool.html. Colors stripped — aesthetics now
// come from the design system tokens, not from the technique.

const TECHNIQUES = {
  '478': {
    name: '4-7-8',
    effect: 'calms nervous system',
    cycles: '4 recommended',
    phases: [
      { label: 'INHALE', duration: 4, scale: 1.35 },
      { label: 'HOLD',   duration: 7, scale: 1.35 },
      { label: 'EXHALE', duration: 8, scale: 0.82 },
    ],
  },
  box: {
    name: 'Box',
    effect: 'reduces anxiety',
    cycles: '4-6 rounds',
    phases: [
      { label: 'INHALE', duration: 4, scale: 1.35 },
      { label: 'HOLD',   duration: 4, scale: 1.35 },
      { label: 'EXHALE', duration: 4, scale: 0.82 },
      { label: 'HOLD',   duration: 4, scale: 0.82 },
    ],
  },
  coherent: {
    name: 'Coherent',
    effect: 'balances heart rate',
    cycles: '5 min session',
    phases: [
      { label: 'INHALE', duration: 5, scale: 1.3  },
      { label: 'EXHALE', duration: 5, scale: 0.82 },
    ],
  },
  calm: {
    name: 'Deep Calm',
    effect: 'activates sleep mode',
    cycles: '6 recommended',
    phases: [
      { label: 'INHALE', duration: 4, scale: 1.35 },
      { label: 'HOLD',   duration: 2, scale: 1.35 },
      { label: 'EXHALE', duration: 6, scale: 0.8  },
      { label: 'HOLD',   duration: 2, scale: 0.8  },
    ],
  },
} as const

type TechKey = keyof typeof TECHNIQUES

// The SVG arc uses strokeDashoffset. The circle has radius 118, so its
// circumference is 2 * π * 118 ≈ 741.4px. At full offset the arc is invisible;
// at offset 0 the full circle is drawn. We animate between these each phase.
const CIRCUMFERENCE = 741.4

// Preserved easing from original: inhale accelerates in, exhale decelerates out,
// hold is linear (the scale isn't changing so easing doesn't matter visually).
function getEasing(label: string): string {
  if (label === 'EXHALE') return 'cubic-bezier(0.4,0,0.2,1)'
  if (label === 'HOLD') return 'linear'
  return 'cubic-bezier(0,0,0.4,1)'
}

const FONT =
  "'Soehne Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

// ─── component ────────────────────────────────────────────────────────────────

export default function BreathingOrb() {
  // ── display state (each change triggers a re-render) ──────────────────────
  const [isRunning, setIsRunning] = useState(false)
  const [currentTech, setCurrentTech] = useState<TechKey>('478')
  const [cycleCount, setCycleCount] = useState(0)
  const [phaseLabel, setPhaseLabel] = useState('')
  const [timerDisplay, setTimerDisplay] = useState(0)
  const [orbScale, setOrbScale] = useState(1)
  const [orbTransition, setOrbTransition] = useState('transform 1s ease')
  const [activeDot, setActiveDot] = useState(-1)

  // ── loop refs (mutable, never trigger re-renders) ─────────────────────────
  // isRunningRef mirrors isRunning state so that callbacks scheduled via
  // setTimeout can check it without capturing a stale closure value.
  const isRunningRef = useRef(false)
  const currentTechRef = useRef<TechKey>('478')
  const phaseIndexRef = useRef(0)
  const cycleCountRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseStartTimeRef = useRef<number>(0)
  const phaseDurationRef = useRef<number>(0)
  const startTimestampRef = useRef<string | null>(null)

  // Direct reference to the SVG arc element — lets animateArc bypass React
  // and write strokeDashoffset at 60fps without causing re-renders.
  const arcRef = useRef<SVGCircleElement | null>(null)

  // ── cleanup on unmount ────────────────────────────────────────────────────
  // This runs when the user navigates away mid-session. It kills all timers
  // so they don't fire against a component that no longer exists. It does NOT
  // write to Supabase — only an explicit END SESSION does that.
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
      if (phaseTimeoutRef.current !== null) clearTimeout(phaseTimeoutRef.current)
      if (countdownRef.current !== null) clearInterval(countdownRef.current)
    }
  }, [])

  // ── arc animation ─────────────────────────────────────────────────────────
  // Runs at ~60fps using requestAnimationFrame. Reads phaseStartTimeRef and
  // phaseDurationRef to compute progress — both are set fresh before each call.
  // Writes directly to the SVG element via arcRef. Never touches React state.
  function animateArc() {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)

    function frame(ts: number) {
      if (!isRunningRef.current || !arcRef.current) return
      const elapsed = ts - phaseStartTimeRef.current
      const progress = Math.min(elapsed / phaseDurationRef.current, 1)
      arcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress))
      if (progress < 1) animFrameRef.current = requestAnimationFrame(frame)
    }

    animFrameRef.current = requestAnimationFrame(frame)
  }

  // ── phase loop ────────────────────────────────────────────────────────────
  // Called once to start the first phase, then schedules itself via setTimeout.
  // Reads only from refs so it behaves correctly even when called from a
  // stale setTimeout closure (the ref values are always current).
  function runPhase() {
    if (!isRunningRef.current) return

    const phases = TECHNIQUES[currentTechRef.current].phases
    const phase = phases[phaseIndexRef.current]

    // Update display state — these are the only React state writes in the loop.
    // State setters are stable references in React, so they're safe here.
    setPhaseLabel(phase.label)
    setTimerDisplay(phase.duration)
    setOrbScale(phase.scale)
    setOrbTransition(`transform ${phase.duration}s ${getEasing(phase.label)}`)
    setActiveDot(phaseIndexRef.current)

    // Start arc. We store the phase start time in a ref so the rAF callback
    // can read it on every frame without a closure problem.
    phaseStartTimeRef.current = performance.now()
    phaseDurationRef.current = phase.duration * 1000
    animateArc()

    // Countdown: one state update per second — cheap, fine for React.
    if (countdownRef.current !== null) clearInterval(countdownRef.current)
    let remaining = phase.duration
    countdownRef.current = setInterval(() => {
      remaining--
      if (remaining <= 0 || !isRunningRef.current) {
        clearInterval(countdownRef.current!)
        countdownRef.current = null
      } else {
        setTimerDisplay(remaining)
      }
    }, 1000)

    // Master clock. When it fires it advances phaseIndex, wraps the cycle,
    // and calls runPhase again — continuing the chain.
    phaseTimeoutRef.current = setTimeout(() => {
      const phases = TECHNIQUES[currentTechRef.current].phases
      phaseIndexRef.current++
      if (phaseIndexRef.current >= phases.length) {
        phaseIndexRef.current = 0
        cycleCountRef.current++
        setCycleCount(cycleCountRef.current)
      }
      runPhase()
    }, phase.duration * 1000)
  }

  // ── session control ───────────────────────────────────────────────────────

  function startBreathing() {
    if (isRunningRef.current) return
    isRunningRef.current = true
    setIsRunning(true)
    phaseIndexRef.current = 0
    cycleCountRef.current = 0
    setCycleCount(0)
    startTimestampRef.current = new Date().toISOString()
    runPhase()
  }

  async function stopBreathing() {
    // Kill all timers before anything else.
    isRunningRef.current = false
    setIsRunning(false)

    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    if (phaseTimeoutRef.current !== null) clearTimeout(phaseTimeoutRef.current)
    if (countdownRef.current !== null) clearInterval(countdownRef.current)
    animFrameRef.current = null
    phaseTimeoutRef.current = null
    countdownRef.current = null

    // Reset visuals. The arc needs a direct write since we bypassed React state
    // for it during the animation.
    setPhaseLabel('')
    setTimerDisplay(0)
    setOrbScale(1)
    setOrbTransition('transform 1s ease')
    setActiveDot(-1)
    if (arcRef.current) {
      arcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE)
    }

    // Supabase write — only if session lasted 30+ seconds (guards against misclicks).
    const endTime = new Date().toISOString()
    const startTime = startTimestampRef.current
    startTimestampRef.current = null

    if (startTime) {
      const durationSeconds = Math.floor(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
      )
      if (durationSeconds >= 30) {
        await supabase.from('meditation_sessions').insert({
          session_start: startTime,
          session_end: endTime,
          technique: currentTechRef.current,
          cycles_completed: cycleCountRef.current,
          duration_seconds: durationSeconds,
        })
      }
    }
  }

  function changeTech(key: TechKey) {
    if (isRunningRef.current) return
    setCurrentTech(key)
    currentTechRef.current = key
  }

  // ── render ────────────────────────────────────────────────────────────────

  const tech = TECHNIQUES[currentTech]
  const phases = tech.phases

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: FONT,
      }}
    >
      {/* ── top: nav + technique selector ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <a href="/" style={{ color: '#888888', letterSpacing: '0.24px' }}>
            ← HOME
          </a>
          <span style={{ color: '#888888', letterSpacing: '0.24px', fontSize: '13px' }}>
            {cycleCount > 0 ? `${cycleCount} CYCLE${cycleCount !== 1 ? 'S' : ''}` : ''}
          </span>
        </div>

        {/* Technique selector — ghost buttons, disabled (dimmed) while running */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(Object.keys(TECHNIQUES) as TechKey[]).map(key => (
            <button
              key={key}
              onClick={() => changeTech(key)}
              style={{
                backgroundColor: currentTech === key ? '#1d1d1d' : 'transparent',
                border: '1px solid #383838',
                borderRadius: '10px',
                padding: '8px 16px',
                color: currentTech === key ? '#ffffff' : '#888888',
                cursor: isRunning ? 'default' : 'pointer',
                fontFamily: FONT,
                fontSize: '14px',
                letterSpacing: '0.24px',
                opacity: isRunning ? 0.4 : 1,
                transition: 'opacity 0.4s ease',
              }}
            >
              {TECHNIQUES[key].name}
            </button>
          ))}
        </div>

        {/* Technique description — fades out when running */}
        <p
          style={{
            color: '#888888',
            letterSpacing: '0.24px',
            fontSize: '13px',
            opacity: isRunning ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          {tech.effect} · {tech.cycles}
        </p>
      </div>

      {/* ── middle: orb + phase info ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Orb container — the SVG arc overlays the orb via absolute positioning */}
        <div
          style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Arc SVG — rotated -90deg so progress starts from the top */}
          <svg
            width="240"
            height="240"
            viewBox="0 0 240 240"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotate(-90deg)',
              pointerEvents: 'none',
            }}
          >
            {/* Track: always-visible faint circle */}
            <circle
              cx="120"
              cy="120"
              r="118"
              fill="none"
              stroke="#383838"
              strokeWidth="1"
            />
            {/* Progress arc: animateArc writes to this element directly */}
            <circle
              ref={arcRef}
              cx="120"
              cy="120"
              r="118"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
            />
          </svg>

          {/* Orb — CSS transition drives the expand/contract animation.
              JavaScript only sets the target scale once per phase; the browser
              interpolates all the frames in between. */}
          <div
            onClick={isRunning ? undefined : startBreathing}
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              backgroundColor: '#1d1d1d',
              border: '1px solid #383838',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isRunning ? 'default' : 'pointer',
              transform: `scale(${orbScale})`,
              transition: orbTransition,
              flexShrink: 0,
            }}
          >
            {!isRunning && (
              <span
                style={{
                  color: '#888888',
                  letterSpacing: '0.24px',
                  fontSize: '13px',
                }}
              >
                BEGIN
              </span>
            )}
          </div>
        </div>

        {/* Phase label + countdown */}
        <div style={{ textAlign: 'center', minHeight: '48px' }}>
          {isRunning && (
            <>
              <p
                style={{
                  color: '#ffffff',
                  letterSpacing: '0.24px',
                  marginBottom: '8px',
                }}
              >
                {phaseLabel}
              </p>
              <p style={{ color: '#888888', letterSpacing: '0.24px' }}>
                {timerDisplay > 0 ? timerDisplay : ''}
              </p>
            </>
          )}
        </div>

        {/* Phase dots — one dot per phase in the selected technique */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            opacity: isRunning ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          {phases.map((_, i) => (
            <div
              key={i}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor:
                  i === activeDot
                    ? '#ffffff'
                    : i < activeDot
                    ? '#888888'
                    : '#383838',
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── bottom: stop button ── */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'center' }}>
        {isRunning && (
          <button
            onClick={stopBreathing}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #383838',
              borderRadius: '10px',
              padding: '8px 19px',
              color: '#888888',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: '14px',
              letterSpacing: '0.24px',
            }}
          >
            END SESSION
          </button>
        )}
      </div>
    </div>
  )
}
