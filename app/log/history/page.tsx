import { supabase } from '@/lib/supabase'
import { todayISO, formatDate, formatDateShort } from '@/lib/dates'
import type {
  Week,
  StrengthSession,
  RunningLog,
  AthleticSession,
  MeditationSession,
  SqlLearningLog,
  BookRead,
  WritingPiece,
  PhaseMarker,
} from '@/lib/types'
import Banner from '@/components/Banner'

// ── local types ───────────────────────────────────────────────────────────────

type WeekActivity = {
  strengthCount: number
  runningKm: number
  athleticCount: number
  meditationCount: number
  sqlMinutes: number
  booksFinished: { title: string }[]
  writingFinished: { title: string; type: string | null }[]
}

type TimelineItem =
  | { kind: 'week'; week: Week; activity: WeekActivity }
  | { kind: 'marker'; marker: PhaseMarker }

// ── week card ─────────────────────────────────────────────────────────────────

function ReviewField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: '19px' }}>
      <div
        style={{
          color: '#888888',
          fontSize: '13px',
          letterSpacing: '0.24px',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: '#ffffff',
          letterSpacing: '0.24px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.4',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function WeekCard({ week, activity }: { week: Week; activity: WeekActivity }) {
  const reviewed = !!week.reviewed_at

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
          color: '#ffffff',
          letterSpacing: '0.24px',
          marginBottom: reviewed ? '26px' : '19px',
        }}
      >
        WEEK {week.week_number} OF 13 · {formatDateShort(week.start_date)} — {formatDateShort(week.end_date)}
      </div>

      {reviewed && (
        <>
          {week.identity_score != null && (
            <div
              style={{
                color: '#ffffff',
                letterSpacing: '0.24px',
                marginBottom: '26px',
              }}
            >
              {week.identity_score} / 10
            </div>
          )}

          <ReviewField label="Closing the loop" value={week.identity_note} />
          <ReviewField label="Sleep" value={week.sleep_note} />
          <ReviewField label="Create / consume" value={week.create_consume_note} />
          <ReviewField label="Raiis" value={week.raiis_note} />
          <ReviewField label="Blocker" value={week.blocker_note} />
          <ReviewField label="Next week" value={week.next_week_priorities} />

          <div style={{ borderTop: '1px solid #383838', margin: '19px 0' }} />
        </>
      )}

      {/* Activity summary — always shown */}
      <div
        style={{
          color: '#888888',
          letterSpacing: '0.24px',
          fontSize: '13px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <span>STRENGTH {activity.strengthCount}</span>
        <span>RUNNING {activity.runningKm.toFixed(1)} KM</span>
        <span>ATHLETIC {activity.athleticCount}</span>
        <span>MEDITATION {activity.meditationCount}</span>
        <span>SQL {activity.sqlMinutes} MIN</span>
      </div>

      {activity.booksFinished.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {activity.booksFinished.map((b, i) => (
            <div
              key={i}
              style={{ color: '#ffffff', letterSpacing: '0.24px', fontSize: '13px' }}
            >
              {b.title} · finished
            </div>
          ))}
        </div>
      )}

      {activity.writingFinished.length > 0 && (
        <div
          style={{ marginTop: activity.booksFinished.length > 0 ? '8px' : '16px' }}
        >
          {activity.writingFinished.map((w, i) => (
            <div
              key={i}
              style={{ color: '#ffffff', letterSpacing: '0.24px', fontSize: '13px' }}
            >
              {w.title}{w.type ? ` · ${w.type.replace(/_/g, ' ')}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── phase marker row ──────────────────────────────────────────────────────────

const MARKER_SUBTITLES: Partial<Record<number, string>> = {
  0: 'The cycle begins.',
  30: 'Halfway through Phase 1.',
  60: 'Phase 2 complete.',
  90: 'The cycle ends.',
}

function PhaseMarkerRow({ marker }: { marker: PhaseMarker }) {
  const subtitle = MARKER_SUBTITLES[marker.day_number]
  const hasContentBelow = !!marker.reflection_text || !marker.completed_at

  return (
    <div
      style={{
        borderTop: '1px solid #383838',
        borderBottom: '1px solid #383838',
        padding: '32px 0',
        marginBottom: '16px',
      }}
    >
      <div style={{ color: '#ffffff', letterSpacing: '0.24px', marginBottom: '8px' }}>
        [ DAY {marker.day_number} · {formatDate(marker.marker_date)} ]
      </div>

      {subtitle && (
        <div
          style={{
            color: '#888888',
            letterSpacing: '0.24px',
            fontSize: '13px',
            marginBottom: hasContentBelow ? '16px' : '0',
          }}
        >
          {subtitle}
        </div>
      )}

      {marker.reflection_text && (
        <div
          style={{
            backgroundColor: '#1d1d1d',
            border: '1px solid #383838',
            borderRadius: '10px',
            padding: '26px',
            color: '#ffffff',
            letterSpacing: '0.24px',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4',
            marginBottom: !marker.completed_at ? '16px' : '0',
          }}
        >
          {marker.reflection_text}
        </div>
      )}

      {!marker.completed_at && (
        <a
          href={`/markers/${marker.day_number}`}
          style={{ color: '#888888', letterSpacing: '0.24px', fontSize: '13px' }}
        >
          Open reflection →
        </a>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const today = todayISO()

  // Nine queries fire in parallel. We fetch every row from each relevant table
  // once, then aggregate in JS — far cheaper than one query per week.
  const [
    { data: allWeeks },
    { data: allMarkers },
    { data: strengthSessions },
    { data: runningLogs },
    { data: athleticSessions },
    { data: meditationSessions },
    { data: sqlLogs },
    { data: booksRead },
    { data: writingPieces },
  ] = await Promise.all([
    supabase
      .from('weeks')
      .select('*')
      .order('week_number', { ascending: false }) as unknown as Promise<{ data: Week[] | null }>,

    supabase
      .from('phase_markers')
      .select('*') as unknown as Promise<{ data: PhaseMarker[] | null }>,

    supabase
      .from('strength_sessions')
      .select('week_id') as unknown as Promise<{ data: Pick<StrengthSession, 'week_id'>[] | null }>,

    supabase
      .from('running_logs')
      .select('week_id, distance_km') as unknown as Promise<{ data: Pick<RunningLog, 'week_id' | 'distance_km'>[] | null }>,

    supabase
      .from('athletic_sessions')
      .select('week_id') as unknown as Promise<{ data: Pick<AthleticSession, 'week_id'>[] | null }>,

    supabase
      .from('meditation_sessions')
      .select('session_start') as unknown as Promise<{ data: Pick<MeditationSession, 'session_start'>[] | null }>,

    supabase
      .from('sql_learning_log')
      .select('log_date, minutes_spent') as unknown as Promise<{ data: Pick<SqlLearningLog, 'log_date' | 'minutes_spent'>[] | null }>,

    supabase
      .from('books_read')
      .select('title, finished_date')
      .not('finished_date', 'is', null) as unknown as Promise<{ data: Pick<BookRead, 'title' | 'finished_date'>[] | null }>,

    supabase
      .from('writing_pieces')
      .select('title, type, finished_date') as unknown as Promise<{ data: Pick<WritingPiece, 'title' | 'type' | 'finished_date'>[] | null }>,
  ])

  // Only show weeks that have started — future weeks are hidden.
  const visibleWeeks = (allWeeks ?? []).filter(w => w.start_date <= today)

  const markers = allMarkers ?? []

  // Banner: today is a phase marker day with no reflection submitted yet.
  const todayMarker = markers.find(m => m.marker_date === today && !m.completed_at) ?? null

  // ── aggregation ─────────────────────────────────────────────────────────────
  //
  // Tables with week_id: build a Map<week_id, count/sum> in one pass.
  // Tables without week_id (meditation, sql): filter by date range per week.

  const strengthMap = new Map<number, number>()
  for (const s of strengthSessions ?? []) {
    if (s.week_id != null)
      strengthMap.set(s.week_id, (strengthMap.get(s.week_id) ?? 0) + 1)
  }

  const runningMap = new Map<number, number>()
  for (const r of runningLogs ?? []) {
    if (r.week_id != null)
      runningMap.set(r.week_id, (runningMap.get(r.week_id) ?? 0) + Number(r.distance_km))
  }

  const athleticMap = new Map<number, number>()
  for (const a of athleticSessions ?? []) {
    if (a.week_id != null)
      athleticMap.set(a.week_id, (athleticMap.get(a.week_id) ?? 0) + 1)
  }

  const allMeditations = meditationSessions ?? []
  const allSqlLogs = sqlLogs ?? []
  const allBooks = booksRead ?? []
  const allWriting = writingPieces ?? []

  function activityForWeek(week: Week): WeekActivity {
    return {
      strengthCount: strengthMap.get(week.id) ?? 0,
      runningKm: runningMap.get(week.id) ?? 0,
      athleticCount: athleticMap.get(week.id) ?? 0,
      meditationCount: allMeditations.filter(m => {
        const d = m.session_start.slice(0, 10)
        return d >= week.start_date && d <= week.end_date
      }).length,
      sqlMinutes: allSqlLogs
        .filter(s => s.log_date >= week.start_date && s.log_date <= week.end_date)
        .reduce((sum, s) => sum + s.minutes_spent, 0),
      booksFinished: allBooks.filter(
        b => b.finished_date != null &&
          b.finished_date >= week.start_date &&
          b.finished_date <= week.end_date
      ),
      writingFinished: allWriting.filter(
        w => w.finished_date >= week.start_date && w.finished_date <= week.end_date
      ),
    }
  }

  // ── build timeline ──────────────────────────────────────────────────────────
  //
  // Walk weeks newest-first. After each week card, insert any phase marker
  // whose date falls within that week's range. Day 45 is deferred — excluded.

  const timelineMarkers = markers.filter(m => m.day_number !== 45)
  const items: TimelineItem[] = []

  for (const week of visibleWeeks) {
    items.push({ kind: 'week', week, activity: activityForWeek(week) })

    for (const marker of timelineMarkers) {
      if (marker.marker_date >= week.start_date && marker.marker_date <= week.end_date) {
        items.push({ kind: 'marker', marker })
      }
    }
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
      {todayMarker && <Banner dayNumber={todayMarker.day_number} />}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '32px',
        }}
      >
        <p style={{ color: '#ffffff' }}>HISTORY</p>
        <a href="/" style={{ color: '#888888' }}>← HOME</a>
      </div>

      {items.length === 0 && (
        <p style={{ color: '#888888' }}>No weeks logged yet.</p>
      )}

      {items.map(item =>
        item.kind === 'week' ? (
          <WeekCard key={`week-${item.week.id}`} week={item.week} activity={item.activity} />
        ) : (
          <PhaseMarkerRow key={`marker-${item.marker.id}`} marker={item.marker} />
        )
      )}
    </main>
  )
}
