import { supabase } from '@/lib/supabase'
import {
  todayISO,
  formatDateShort,
  daysSince,
  daysIn,
  currentMonthRange,
  isSundayReviewOpen,
} from '@/lib/dates'
import type {
  Week,
  StrengthSession,
  RunningLog,
  AthleticSession,
  SportSession,
  MeditationSession,
  SqlLearningLog,
  BookRead,
  PhaseMarker,
} from '@/lib/types'
import BucketCard from '@/components/BucketCard'
import Banner from '@/components/Banner'

export default async function Home() {
  const today = todayISO()

  // Query 1: find the week row where today falls between start_date and end_date.
  // .lte('start_date', today) means start_date <= today
  // .gte('end_date', today) means end_date >= today
  // .single() expects exactly one row — there will always be one during the cycle.
  const { data: week } = await supabase
    .from('weeks')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .single() as unknown as { data: Week | null }

  if (!week) {
    return (
      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        <p style={{ color: '#888888' }}>No active cycle.</p>
      </main>
    )
  }

  const { first: monthStart, last: monthEnd } = currentMonthRange()
  const reviewOpen = isSundayReviewOpen()

  // Queries 2–9 run in parallel with Promise.all.
  // Each item in the array is a Supabase query promise — they all fire at the same time.
  const [
    { data: strengthSessions },
    { data: runningLogs },
    { data: athleticSessions },
    { data: sportSessions },
    { data: meditationSessions },
    { data: sqlLogs },
    { data: currentBook },
    { data: phaseMarker },
  ] = await Promise.all([
    // TypeScript: each query is cast to its known Row type so we get full type safety downstream.
    // Supabase returns { data, error } — we destructure only data.

    // Query 2: strength sessions this week, filtered by week_id.
    supabase
      .from('strength_sessions')
      .select('id, session_date')
      .eq('week_id', week.id)
      .order('session_date', { ascending: false }) as unknown as Promise<{ data: Pick<StrengthSession, 'id' | 'session_date'>[] | null }>,

    // Query 3: running logs this week. We only need distance_km to sum.
    supabase
      .from('running_logs')
      .select('distance_km')
      .eq('week_id', week.id) as unknown as Promise<{ data: Pick<RunningLog, 'distance_km'>[] | null }>,

    // Query 4: most recent athletic session this week.
    // .order + .limit(1) gives us only the latest row.
    supabase
      .from('athletic_sessions')
      .select('activity, session_date')
      .eq('week_id', week.id)
      .order('session_date', { ascending: false })
      .limit(1) as unknown as Promise<{ data: Pick<AthleticSession, 'activity' | 'session_date'>[] | null }>,

    // Query 5: sport sessions this month. No week_id on this table —
    // we filter by session_date falling within the current calendar month.
    supabase
      .from('sport_sessions')
      .select('id')
      .gte('session_date', monthStart)
      .lte('session_date', monthEnd) as unknown as Promise<{ data: Pick<SportSession, 'id'>[] | null }>,

    // Query 6: meditation sessions this week. No week_id here either —
    // we compare session_start (a TIMESTAMPTZ) against the week's date boundaries.
    supabase
      .from('meditation_sessions')
      .select('id')
      .gte('session_start', `${week.start_date}T00:00:00`)
      .lte('session_start', `${week.end_date}T23:59:59`) as unknown as Promise<{ data: Pick<MeditationSession, 'id'>[] | null }>,

    // Query 7: SQL learning logs this week, ordered newest first so
    // sqlLogs[0].resource gives us the most recently used resource.
    supabase
      .from('sql_learning_log')
      .select('minutes_spent, resource')
      .gte('log_date', week.start_date)
      .lte('log_date', week.end_date)
      .order('log_date', { ascending: false }) as unknown as Promise<{ data: Pick<SqlLearningLog, 'minutes_spent' | 'resource'>[] | null }>,

    // Query 8: the book currently being read — the row where finished_date IS NULL.
    // .maybeSingle() returns null if no book is in progress, without throwing an error.
    supabase
      .from('books_read')
      .select('title, started_date')
      .is('finished_date', null)
      .order('started_date', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: Pick<BookRead, 'title' | 'started_date'> | null }>,

    // Query 9: check if today is a phase marker date that hasn't been completed yet.
    // .maybeSingle() because most days this returns null — that's expected.
    supabase
      .from('phase_markers')
      .select('day_number')
      .eq('marker_date', today)
      .is('completed_at', null)
      .maybeSingle() as unknown as Promise<{ data: Pick<PhaseMarker, 'day_number'> | null }>,
  ])

  // Derive display values from raw query results
  const strengthCount = strengthSessions?.length ?? 0
  const lastStrengthSession = strengthSessions?.[0] ?? null

  const totalKm = runningLogs?.reduce((sum, r) => sum + Number(r.distance_km), 0) ?? 0

  const lastAthletic = athleticSessions?.[0] ?? null

  const sportCount = sportSessions?.length ?? 0

  const meditationCount = meditationSessions?.length ?? 0

  const totalSqlMinutes = sqlLogs?.reduce((sum, r) => sum + r.minutes_spent, 0) ?? 0
  const latestResource = sqlLogs?.[0]?.resource ?? null

  return (
    <main
      style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '32px',
        fontFamily: "'Soehne Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {phaseMarker && <Banner dayNumber={phaseMarker.day_number} />}

      {/* Week banner */}
      <p style={{ color: '#ffffff', letterSpacing: '0.24px' }}>
        WEEK {week.week_number} OF 13 · {formatDateShort(week.start_date)} — {formatDateShort(week.end_date)}
      </p>

      {/* Identity line */}
      <p style={{ color: '#888888', marginTop: '8px', letterSpacing: '0.24px' }}>
        Closing The Gap
      </p>

      {/* Bucket cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginTop: '32px',
        }}
      >
        <BucketCard
          label="STRENGTH"
          primary={strengthCount > 0 ? `${strengthCount} ${strengthCount === 1 ? 'session' : 'sessions'}` : null}
          secondary={lastStrengthSession ? `last session ${daysSince(lastStrengthSession.session_date)}` : null}
        />
        <BucketCard
          label="RUNNING"
          primary={`${totalKm.toFixed(1)} km`}
          secondary="10 km floor"
        />
        <BucketCard
          label="ATHLETIC"
          primary={lastAthletic?.activity ?? null}
          secondary={lastAthletic ? daysSince(lastAthletic.session_date) : null}
        />
        <BucketCard
          label="SPORT"
          primary={`${sportCount} ${sportCount === 1 ? 'session' : 'sessions'} this month`}
        />
        <BucketCard
          label="MEDITATION"
          primary={meditationCount > 0 ? `${meditationCount} ${meditationCount === 1 ? 'session' : 'sessions'}` : null}
        />
        <BucketCard
          label="SQL"
          primary={totalSqlMinutes > 0 ? `${totalSqlMinutes} min` : null}
          secondary={latestResource}
        />
        <BucketCard
          label="READING"
          primary={currentBook?.title ?? null}
          secondary={currentBook ? `day ${daysIn(currentBook.started_date)}` : null}
        />
      </div>

      {/* Sunday review CTA */}
      <div style={{ marginTop: '32px' }}>
        {reviewOpen ? (
          <a
            href="/review"
            style={{
              display: 'inline-block',
              color: '#ffffff',
              border: '1px solid #383838',
              borderRadius: '10px',
              padding: '19px 26px',
              letterSpacing: '0.24px',
              cursor: 'pointer',
            }}
          >
            SUNDAY REVIEW →
          </a>
        ) : (
          <span
            style={{
              display: 'inline-block',
              color: '#888888',
              border: '1px solid #383838',
              borderRadius: '10px',
              padding: '19px 26px',
              letterSpacing: '0.24px',
              cursor: 'default',
            }}
          >
            SUNDAY REVIEW →
          </span>
        )}
      </div>
    </main>
  )
}
