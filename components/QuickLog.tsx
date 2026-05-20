'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/dates'
import type { BookRead } from '@/lib/types'

type FormKey = 'strength' | 'run' | 'athletic' | 'sport' | 'sql' | 'book' | 'writing'
type Status = 'idle' | 'submitting' | 'logged'

export type CurrentBook = Pick<BookRead, 'id' | 'title' | 'started_date'> | null

// ─── helpers ─────────────────────────────────────────────────────────────────

async function resolveWeekId(date: string): Promise<number | null> {
  const { data } = await supabase
    .from('weeks')
    .select('id')
    .lte('start_date', date)
    .gte('end_date', date)
    .maybeSingle()
  return (data as { id: number } | null)?.id ?? null
}

const FONT =
  "'Soehne Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

// ─── shared primitives ────────────────────────────────────────────────────────

function FormRow({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="log-toggle-btn"
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          backgroundColor: isOpen ? '#1d1d1d' : 'transparent',
          border: '1px solid #383838',
          borderBottom: isOpen ? 'none' : '1px solid #383838',
          borderRadius: isOpen ? '10px 10px 0 0' : '10px',
          padding: '19px 26px',
          color: '#ffffff',
          cursor: 'pointer',
          fontFamily: FONT,
          fontSize: '16px',
          letterSpacing: '0.24px',
        }}
      >
        [ {isOpen ? '−' : '+'} ] {label}
      </button>

      {isOpen && (
        <div
          style={{
            backgroundColor: '#000000',
            border: '1px solid #383838',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '26px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          color: '#888888',
          fontSize: '13px',
          letterSpacing: '0.24px',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1d1d1d',
  color: '#ffffff',
  border: '1px solid #383838',
  borderRadius: '10px',
  padding: '8px 19px',
  fontFamily: FONT,
  fontSize: '16px',
  letterSpacing: '0.24px',
  width: '100%',
  outline: 'none',
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...inputStyle, cursor: 'pointer', ...props.style }}>
      {children}
    </select>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize: 'vertical',
        minHeight: '80px',
        ...props.style,
      }}
    />
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        backgroundColor: '#1d1d1d',
        borderRadius: '10px',
        padding: '16px 19px',
        marginBottom: '16px',
        color: '#ffffff',
        letterSpacing: '0.24px',
      }}
    >
      {message}
    </div>
  )
}

function SubmitBtn({ status, onSubmit }: { status: Status; onSubmit: () => void }) {
  if (status === 'logged') {
    return (
      <p style={{ color: '#888888', letterSpacing: '0.24px', marginTop: '8px' }}>
        LOGGED
      </p>
    )
  }
  return (
    <button
      onClick={onSubmit}
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
        marginTop: '8px',
      }}
    >
      {status === 'submitting' ? 'LOGGING...' : 'LOG'}
    </button>
  )
}

// ─── Strength form ────────────────────────────────────────────────────────────

type SetRow = { id: number; lift: string; liftOther: string; weight: string; reps: string }

function StrengthForm({ onDone }: { onDone: () => void }) {
  const nextId = useRef(1)
  const [date, setDate] = useState(todayISO())
  const [sessionType, setSessionType] = useState('')
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<SetRow[]>([
    { id: 1, lift: '', liftOther: '', weight: '', reps: '' },
  ])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  function addSet() {
    setSets(prev => [
      ...prev,
      { id: ++nextId.current, lift: '', liftOther: '', weight: '', reps: '' },
    ])
  }

  function updateSet(id: number, field: keyof Omit<SetRow, 'id'>, value: string) {
    setSets(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)))
  }

  function removeSet(id: number) {
    setSets(prev => prev.filter(s => s.id !== id))
  }

  async function handleSubmit() {
    if (!date) { setError('Date is required.'); return }
    const validSets = sets.filter(s => s.reps)
    if (validSets.length === 0) { setError('At least one set with reps is required.'); return }

    setStatus('submitting')
    setError(null)

    try {
      const weekId = await resolveWeekId(date)

      const { data: session, error: sessionErr } = await supabase
        .from('strength_sessions')
        .insert({
          week_id: weekId,
          session_date: date,
          session_type: sessionType || null,
          notes: notes || null,
        })
        .select('id')
        .single()

      if (sessionErr) throw new Error(sessionErr.message)

      const { error: logsErr } = await supabase.from('strength_logs').insert(
        sets.map((s, i) => ({
          session_id: (session as { id: number }).id,
          lift_name: s.lift === 'OTHER' ? (s.liftOther.trim() || 'other') : s.lift,
          weight: s.weight ? Number(s.weight) : null,
          reps: s.reps ? Number(s.reps) : null,
          set_number: i + 1,
          notes: null,
        }))
      )

      if (logsErr) throw new Error(logsErr.message)

      setStatus('logged')
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}

      <Field label="DATE">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>

      <Field label="SESSION TYPE (optional)">
        <Select value={sessionType} onChange={e => setSessionType(e.target.value)}>
          <option value="">—</option>
          <option value="push">PUSH</option>
          <option value="pull">PULL</option>
          <option value="legs">LEGS</option>
          <option value="upper">UPPER</option>
          <option value="lower">LOWER</option>
          <option value="full">FULL</option>
        </Select>
      </Field>

      <div style={{ borderTop: '1px solid #383838', margin: '19px 0' }} />

      {sets.map((set, i) => (
        <div key={set.id} style={{ marginBottom: '19px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ color: '#888888', fontSize: '13px', letterSpacing: '0.24px' }}>
              SET {i + 1}
            </span>
            {sets.length > 1 && (
              <button
                onClick={() => removeSet(set.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888888',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: '13px',
                  letterSpacing: '0.24px',
                  padding: '0',
                }}
              >
                REMOVE
              </button>
            )}
          </div>

          <Field label="LIFT">
            <Select value={set.lift} onChange={e => updateSet(set.id, 'lift', e.target.value)}>
              <option value="">—</option>
              <option value="bench_press">BENCH PRESS</option>
              <option value="hack_squat">HACK SQUAT</option>
              <option value="pull_ups">PULL UPS</option>
              <option value="push_ups">PUSH UPS</option>
              <option value="OTHER">OTHER</option>
            </Select>
          </Field>

          {set.lift === 'OTHER' && (
            <Field label="LIFT NAME">
              <Input
                type="text"
                value={set.liftOther}
                onChange={e => updateSet(set.id, 'liftOther', e.target.value)}
                placeholder="e.g. overhead press"
              />
            </Field>
          )}

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#888888', fontSize: '13px', letterSpacing: '0.24px', marginBottom: '6px' }}>
                WEIGHT kg (optional)
              </div>
              <Input
                type="number"
                value={set.weight}
                onChange={e => updateSet(set.id, 'weight', e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#888888', fontSize: '13px', letterSpacing: '0.24px', marginBottom: '6px' }}>
                REPS
              </div>
              <Input
                type="number"
                value={set.reps}
                onChange={e => updateSet(set.id, 'reps', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addSet}
        style={{
          background: 'none',
          border: '1px solid #383838',
          borderRadius: '10px',
          padding: '8px 19px',
          color: '#888888',
          cursor: 'pointer',
          fontFamily: FONT,
          fontSize: '14px',
          letterSpacing: '0.24px',
          marginBottom: '19px',
        }}
      >
        + ADD SET
      </button>

      <div style={{ borderTop: '1px solid #383838', margin: '19px 0' }} />

      <Field label="NOTES (optional)">
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="anything worth noting"
        />
      </Field>

      <SubmitBtn status={status} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── Run form ─────────────────────────────────────────────────────────────────

function RunForm({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [distanceKm, setDistanceKm] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!date) { setError('Date is required.'); return }
    if (!distanceKm || Number(distanceKm) <= 0) { setError('Distance is required.'); return }

    setStatus('submitting')
    setError(null)

    try {
      const weekId = await resolveWeekId(date)
      const { error: err } = await supabase
        .from('running_logs')
        .insert({ week_id: weekId, run_date: date, distance_km: Number(distanceKm), notes: notes || null })

      if (err) throw new Error(err.message)

      setStatus('logged')
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}
      <Field label="DATE">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label="DISTANCE (km)">
        <Input
          type="number"
          value={distanceKm}
          onChange={e => setDistanceKm(e.target.value)}
          placeholder="0.0"
          min="0"
          step="0.1"
        />
      </Field>
      <Field label="NOTES (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="route, pace, feeling" />
      </Field>
      <SubmitBtn status={status} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── Athletic form ────────────────────────────────────────────────────────────

function AthleticForm({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [activity, setActivity] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!date) { setError('Date is required.'); return }

    setStatus('submitting')
    setError(null)

    try {
      const weekId = await resolveWeekId(date)
      const { error: err } = await supabase
        .from('athletic_sessions')
        .insert({ week_id: weekId, session_date: date, activity: activity || null, notes: notes || null })

      if (err) throw new Error(err.message)

      setStatus('logged')
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}
      <Field label="DATE">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label="ACTIVITY (optional)">
        <Input
          type="text"
          value={activity}
          onChange={e => setActivity(e.target.value)}
          placeholder="e.g. boxing, yoga, pilates"
        />
      </Field>
      <Field label="NOTES (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="duration, intensity, anything notable" />
      </Field>
      <SubmitBtn status={status} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── Sport form ───────────────────────────────────────────────────────────────

function SportForm({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [sport, setSport] = useState<'golf' | 'padel' | ''>('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!date) { setError('Date is required.'); return }
    if (!sport) { setError('Sport is required.'); return }

    setStatus('submitting')
    setError(null)

    try {
      const { error: err } = await supabase
        .from('sport_sessions')
        .insert({ session_date: date, sport, notes: notes || null })

      if (err) throw new Error(err.message)

      setStatus('logged')
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}
      <Field label="DATE">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label="SPORT">
        <Select value={sport} onChange={e => setSport(e.target.value as 'golf' | 'padel' | '')}>
          <option value="">—</option>
          <option value="golf">GOLF</option>
          <option value="padel">PADEL</option>
        </Select>
      </Field>
      <Field label="NOTES (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="score, venue, who with" />
      </Field>
      <SubmitBtn status={status} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── SQL form ─────────────────────────────────────────────────────────────────

type SqlResource = 'mode' | 'datalemur' | 'supabase' | 'other' | ''

function SqlForm({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [minutesSpent, setMinutesSpent] = useState('')
  const [resource, setResource] = useState<SqlResource>('')
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!date) { setError('Date is required.'); return }
    if (!minutesSpent || Number(minutesSpent) <= 0) { setError('Minutes spent is required.'); return }

    setStatus('submitting')
    setError(null)

    try {
      const { error: err } = await supabase.from('sql_learning_log').insert({
        log_date: date,
        minutes_spent: Number(minutesSpent),
        resource: resource || null,
        topic: topic || null,
        notes: notes || null,
      })

      if (err) throw new Error(err.message)

      setStatus('logged')
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}
      <Field label="DATE">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label="MINUTES SPENT">
        <Input
          type="number"
          value={minutesSpent}
          onChange={e => setMinutesSpent(e.target.value)}
          placeholder="0"
          min="1"
        />
      </Field>
      <Field label="RESOURCE (optional)">
        <Select value={resource} onChange={e => setResource(e.target.value as SqlResource)}>
          <option value="">—</option>
          <option value="mode">MODE</option>
          <option value="datalemur">DATALEMUR</option>
          <option value="supabase">SUPABASE</option>
          <option value="other">OTHER</option>
        </Select>
      </Field>
      <Field label="TOPIC (optional)">
        <Input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. window functions, joins"
        />
      </Field>
      <Field label="NOTES (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="what you worked on, what clicked" />
      </Field>
      <SubmitBtn status={status} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── Book form ────────────────────────────────────────────────────────────────

function BookForm({ currentBook, onDone }: { currentBook: CurrentBook; onDone: () => void }) {
  const [mode, setMode] = useState<'finish' | 'start'>(currentBook ? 'finish' : 'start')
  const [finishDate, setFinishDate] = useState(todayISO())
  const [finishNotes, setFinishNotes] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newStartDate, setNewStartDate] = useState(todayISO())
  const [newNotes, setNewNotes] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const toggleBtnBase: React.CSSProperties = {
    border: '1px solid #383838',
    borderRadius: '10px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontFamily: FONT,
    fontSize: '14px',
    letterSpacing: '0.24px',
  }

  async function handleSubmit() {
    setError(null)

    if (mode === 'finish') {
      if (!currentBook) { setError('No book in progress.'); return }
      if (!finishDate) { setError('Date is required.'); return }

      setStatus('submitting')
      try {
        const { error: err } = await supabase
          .from('books_read')
          .update({ finished_date: finishDate, notes: finishNotes || null })
          .eq('id', currentBook.id)

        if (err) throw new Error(err.message)

        setStatus('logged')
        setTimeout(onDone, 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
        setStatus('idle')
      }
    } else {
      if (!newTitle.trim()) { setError('Title is required.'); return }
      if (!newStartDate) { setError('Start date is required.'); return }

      setStatus('submitting')
      try {
        const { error: err } = await supabase.from('books_read').insert({
          title: newTitle.trim(),
          started_date: newStartDate,
          notes: newNotes || null,
        })

        if (err) throw new Error(err.message)

        setStatus('logged')
        setTimeout(onDone, 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
        setStatus('idle')
      }
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '26px' }}>
        <button
          onClick={() => setMode('finish')}
          style={{
            ...toggleBtnBase,
            backgroundColor: mode === 'finish' ? '#1d1d1d' : 'transparent',
            color: mode === 'finish' ? '#ffffff' : '#888888',
          }}
        >
          FINISH CURRENT BOOK
        </button>
        <button
          onClick={() => setMode('start')}
          style={{
            ...toggleBtnBase,
            backgroundColor: mode === 'start' ? '#1d1d1d' : 'transparent',
            color: mode === 'start' ? '#ffffff' : '#888888',
          }}
        >
          START NEW BOOK
        </button>
      </div>

      {mode === 'finish' ? (
        currentBook ? (
          <>
            <div
              style={{ color: '#888888', letterSpacing: '0.24px', fontSize: '14px', marginBottom: '16px' }}
            >
              Finishing: {currentBook.title}
            </div>
            <Field label="DATE FINISHED">
              <Input type="date" value={finishDate} onChange={e => setFinishDate(e.target.value)} />
            </Field>
            <Field label="NOTES (optional)">
              <Textarea value={finishNotes} onChange={e => setFinishNotes(e.target.value)} placeholder="thoughts on the book" />
            </Field>
            <SubmitBtn status={status} onSubmit={handleSubmit} />
          </>
        ) : (
          <p style={{ color: '#888888', letterSpacing: '0.24px' }}>No book currently in progress.</p>
        )
      ) : (
        <>
          <Field label="TITLE">
            <Input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="book title"
            />
          </Field>
          <Field label="DATE STARTED">
            <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
          </Field>
          <Field label="NOTES (optional)">
            <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="why this book" />
          </Field>
          <SubmitBtn status={status} onSubmit={handleSubmit} />
        </>
      )}
    </div>
  )
}

// ─── Writing form ─────────────────────────────────────────────────────────────

type WritingType = 'journal' | 'linkedin_post' | 'thabani_os_post' | 'other' | ''

function WritingForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<WritingType>('')
  const [finishedDate, setFinishedDate] = useState(todayISO())
  const [linkOrLocation, setLinkOrLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!finishedDate) { setError('Date is required.'); return }

    setStatus('submitting')
    setError(null)

    try {
      const { error: err } = await supabase.from('writing_pieces').insert({
        title: title.trim(),
        type: type || null,
        finished_date: finishedDate,
        link_or_location: linkOrLocation || null,
        notes: notes || null,
      })

      if (err) throw new Error(err.message)

      setStatus('logged')
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div>
      {error && <ErrorBox message={error} />}
      <Field label="TITLE">
        <Input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="piece title"
        />
      </Field>
      <Field label="TYPE (optional)">
        <Select value={type} onChange={e => setType(e.target.value as WritingType)}>
          <option value="">—</option>
          <option value="journal">JOURNAL</option>
          <option value="linkedin_post">LINKEDIN POST</option>
          <option value="thabani_os_post">THABANI OS POST</option>
          <option value="other">OTHER</option>
        </Select>
      </Field>
      <Field label="DATE FINISHED">
        <Input type="date" value={finishedDate} onChange={e => setFinishedDate(e.target.value)} />
      </Field>
      <Field label="LINK / LOCATION (optional)">
        <Input
          type="text"
          value={linkOrLocation}
          onChange={e => setLinkOrLocation(e.target.value)}
          placeholder="URL or file path"
        />
      </Field>
      <Field label="NOTES (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="context, audience, anything worth noting" />
      </Field>
      <SubmitBtn status={status} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── QuickLog (export) ────────────────────────────────────────────────────────

export default function QuickLog({ currentBook }: { currentBook: CurrentBook }) {
  const [openForm, setOpenForm] = useState<FormKey | null>(null)
  const router = useRouter()

  function toggle(key: FormKey) {
    setOpenForm(prev => (prev === key ? null : key))
  }

  function handleDone() {
    setOpenForm(null)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <FormRow
        label="STRENGTH SESSION"
        isOpen={openForm === 'strength'}
        onToggle={() => toggle('strength')}
      >
        <StrengthForm onDone={handleDone} />
      </FormRow>

      <FormRow label="RUN" isOpen={openForm === 'run'} onToggle={() => toggle('run')}>
        <RunForm onDone={handleDone} />
      </FormRow>

      <FormRow
        label="ATHLETIC SESSION"
        isOpen={openForm === 'athletic'}
        onToggle={() => toggle('athletic')}
      >
        <AthleticForm onDone={handleDone} />
      </FormRow>

      <FormRow
        label="SPORT SESSION"
        isOpen={openForm === 'sport'}
        onToggle={() => toggle('sport')}
      >
        <SportForm onDone={handleDone} />
      </FormRow>

      <FormRow label="SQL LEARNING" isOpen={openForm === 'sql'} onToggle={() => toggle('sql')}>
        <SqlForm onDone={handleDone} />
      </FormRow>

      <FormRow
        label="FINISHED BOOK"
        isOpen={openForm === 'book'}
        onToggle={() => toggle('book')}
      >
        <BookForm currentBook={currentBook} onDone={handleDone} />
      </FormRow>

      <FormRow
        label="FINISHED WRITING PIECE"
        isOpen={openForm === 'writing'}
        onToggle={() => toggle('writing')}
      >
        <WritingForm onDone={handleDone} />
      </FormRow>
    </div>
  )
}
