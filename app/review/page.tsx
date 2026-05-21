import { supabase } from '@/lib/supabase'
import { todayISO, formatDateShort } from '@/lib/dates'
import type { Week, PhaseMarker } from '@/lib/types'
import Banner from '@/components/Banner'
import ReviewForm from '@/components/ReviewForm'

export default async function ReviewPage() {
  const today = todayISO()

  const [{ data: week }, { data: phaseMarker }] = await Promise.all([
    supabase
      .from('weeks')
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .single() as unknown as Promise<{ data: Week | null }>,

    supabase
      .from('phase_markers')
      .select('day_number')
      .eq('marker_date', today)
      .is('completed_at', null)
      .maybeSingle() as unknown as Promise<{ data: Pick<PhaseMarker, 'day_number'> | null }>,
  ])

  if (!week) {
    return (
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
        <p style={{ color: '#888888' }}>No active cycle.</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
      {phaseMarker && <Banner dayNumber={phaseMarker.day_number} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <p style={{ color: '#ffffff' }}>WEEK {week.week_number} REVIEW</p>
        <a href="/" style={{ color: '#888888' }}>← HOME</a>
      </div>
      <p style={{ color: '#888888', marginBottom: '32px' }}>
        {formatDateShort(week.start_date)} — {formatDateShort(week.end_date)}
      </p>

      <ReviewForm week={week} />
    </main>
  )
}
