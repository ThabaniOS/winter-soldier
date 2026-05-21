'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Week } from '@/lib/types'

const FONT = "'Soehne Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Status = 'idle' | 'submitting'

// ── shared primitives ─────────────────────────────────────────────────────────

const textareaStyle: React.CSSProperties = {
  backgroundColor: '#1d1d1d',
  color: '#ffffff',
  border: '1px solid #383838',
  borderRadius: '10px',
  padding: '16px 19px',
  fontFamily: FONT,
  fontSize: '16px',
  letterSpacing: '0.24px',
  width: '100%',
  resize: 'vertical',
  minHeight: '100px',
  outline: 'none',
}

function FieldBlock({ prompt, children }: { prompt: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '26px' }}>
      <div style={{ color: '#888888', fontSize: '13px', letterSpacing: '0.24px', textTransform: 'uppercase', marginBottom: '8px' }}>
        {prompt}
      </div>
      {children}
    </div>
  )
}

// ── read-only card ────────────────────────────────────────────────────────────

function AnswerCard({ prompt, value }: { prompt: string; value: string | null }) {
  return (
    <div
      style={{
        backgroundColor: '#1d1d1d',
        border: '1px solid #383838',
        borderRadius: '10px',
        padding: '26px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          color: '#888888',
          fontSize: '13px',
          letterSpacing: '0.24px',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        {prompt}
      </div>
      <div style={{ color: '#ffffff', letterSpacing: '0.24px', whiteSpace: 'pre-wrap' }}>
        {value && value.trim() !== '' ? value : '—'}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function ReviewForm({ week }: { week: Week }) {
  const already = !!week.reviewed_at
  const [editing, setEditing] = useState(!already)

  const [score, setScore] = useState<number | null>(week.identity_score ?? null)
  const [identityNote, setIdentityNote] = useState(week.identity_note ?? '')
  const [sleepNote, setSleepNote] = useState(week.sleep_note ?? '')
  const [createConsumeNote, setCreateConsumeNote] = useState(week.create_consume_note ?? '')
  const [raiisNote, setRaiisNote] = useState(week.raiis_note ?? '')
  const [blockerNote, setBlockerNote] = useState(week.blocker_note ?? '')
  const [nextWeek, setNextWeek] = useState(week.next_week_priorities ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const dayIndex = new Date().getDay()
  const isReviewDay = dayIndex === 0 || dayIndex === 6

  async function handleSubmit() {
    if (!score) {
      setError('Identity score is required.')
      return
    }

    setStatus('submitting')
    setError(null)

    const { error: err } = await supabase
      .from('weeks')
      .update({
        identity_score: score,
        identity_note: identityNote.trim() || null,
        sleep_note: sleepNote.trim() || null,
        create_consume_note: createConsumeNote.trim() || null,
        raiis_note: raiisNote.trim() || null,
        blocker_note: blockerNote.trim() || null,
        next_week_priorities: nextWeek.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', week.id)

    if (err) {
      setError(err.message)
      setStatus('idle')
      return
    }

    setEditing(false)
    setStatus('idle')
    router.refresh()
  }

  // ── read-only view ──────────────────────────────────────────────────────────

  if (!editing) {
    return (
      <div>
        <div
          style={{
            backgroundColor: '#1d1d1d',
            border: '1px solid #383838',
            borderRadius: '10px',
            padding: '26px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              color: '#888888',
              fontSize: '13px',
              letterSpacing: '0.24px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Identity score
          </div>
          <div style={{ color: '#ffffff', letterSpacing: '0.24px' }}>
            {score != null ? `${score} / 10` : '—'}
          </div>
        </div>

        <AnswerCard
          prompt="Did I close the loop this week?"
          value={identityNote}
        />
        <AnswerCard
          prompt="How did I sleep this week?"
          value={sleepNote}
        />
        <AnswerCard
          prompt="Did I create more than I consumed?"
          value={createConsumeNote}
        />
        <AnswerCard
          prompt="What did I do this week to move Raiis forward?"
          value={raiisNote}
        />
        <AnswerCard
          prompt="What's blocking me?"
          value={blockerNote}
        />
        <AnswerCard
          prompt="Three things for next week"
          value={nextWeek}
        />

        <div style={{ marginTop: '32px' }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              color: '#888888',
              fontFamily: FONT,
              fontSize: '13px',
              letterSpacing: '0.24px',
              cursor: 'pointer',
            }}
          >
            REVIEW SUBMITTED · click to append
          </button>
        </div>
      </div>
    )
  }

  // ── edit form ───────────────────────────────────────────────────────────────

  return (
    <div>
      {!isReviewDay && (
        <div
          style={{
            border: '1px solid #383838',
            borderRadius: '10px',
            padding: '16px 19px',
            marginBottom: '26px',
            color: '#888888',
            fontSize: '13px',
            letterSpacing: '0.24px',
          }}
        >
          It&apos;s {DAY_NAMES[dayIndex]}. You&apos;re submitting this week&apos;s review early.
        </div>
      )}

      {error && (
        <div
          style={{
            border: '1px solid #383838',
            borderRadius: '10px',
            padding: '16px 19px',
            marginBottom: '26px',
            color: '#ffffff',
            fontSize: '13px',
            letterSpacing: '0.24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Identity score */}
      <div style={{ marginBottom: '26px' }}>
        <div
          style={{
            color: '#888888',
            fontSize: '13px',
            letterSpacing: '0.24px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Identity score
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <button
              key={n}
              onClick={() => setScore(n)}
              className="score-btn"
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #383838',
                borderRadius: '10px',
                backgroundColor: score === n ? '#1d1d1d' : 'transparent',
                color: score === n ? '#ffffff' : '#888888',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: '16px',
                letterSpacing: '0.24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                flexShrink: 0,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <FieldBlock prompt="Did I close the loop this week?">
        <textarea
          style={textareaStyle}
          value={identityNote}
          onChange={e => setIdentityNote(e.target.value)}
          placeholder="one sentence"
        />
      </FieldBlock>

      <FieldBlock prompt="How did I sleep this week?">
        <textarea
          style={textareaStyle}
          value={sleepNote}
          onChange={e => setSleepNote(e.target.value)}
        />
      </FieldBlock>

      <FieldBlock prompt="Did I create more than I consumed?">
        <textarea
          style={textareaStyle}
          value={createConsumeNote}
          onChange={e => setCreateConsumeNote(e.target.value)}
        />
      </FieldBlock>

      <FieldBlock prompt="What did I do this week to move Raiis forward?">
        <textarea
          style={textareaStyle}
          value={raiisNote}
          onChange={e => setRaiisNote(e.target.value)}
        />
      </FieldBlock>

      <FieldBlock prompt="What's blocking me?">
        <textarea
          style={textareaStyle}
          value={blockerNote}
          onChange={e => setBlockerNote(e.target.value)}
        />
      </FieldBlock>

      <FieldBlock prompt="Three things for next week">
        <textarea
          style={textareaStyle}
          value={nextWeek}
          onChange={e => setNextWeek(e.target.value)}
        />
      </FieldBlock>

      <div style={{ display: 'flex', alignItems: 'center', gap: '19px', marginTop: '8px' }}>
        <button
          onClick={handleSubmit}
          disabled={status === 'submitting'}
          className="ghost-action-btn"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #383838',
            borderRadius: '10px',
            padding: '16px 26px',
            color: status === 'submitting' ? '#888888' : '#ffffff',
            fontFamily: FONT,
            fontSize: '16px',
            letterSpacing: '0.24px',
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'submitting' ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
        </button>

        {already && (
          <button
            onClick={() => setEditing(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              color: '#888888',
              fontFamily: FONT,
              fontSize: '13px',
              letterSpacing: '0.24px',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
        )}
      </div>
    </div>
  )
}
