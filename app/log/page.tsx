import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/dates'
import type { BookRead, PhaseMarker } from '@/lib/types'
import Banner from '@/components/Banner'
import QuickLog from '@/components/QuickLog'

export default async function LogPage() {
  const today = todayISO()

  const [{ data: currentBook }, { data: phaseMarker }] = await Promise.all([
    supabase
      .from('books_read')
      .select('id, title, started_date')
      .is('finished_date', null)
      .order('started_date', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{
        data: Pick<BookRead, 'id' | 'title' | 'started_date'> | null
      }>,

    supabase
      .from('phase_markers')
      .select('day_number')
      .eq('marker_date', today)
      .is('completed_at', null)
      .maybeSingle() as unknown as Promise<{
        data: Pick<PhaseMarker, 'day_number'> | null
      }>,
  ])

  return (
    <main
      style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '32px',
        fontFamily:
          "'Soehne Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {phaseMarker && <Banner dayNumber={phaseMarker.day_number} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
        <p style={{ color: '#ffffff', letterSpacing: '0.24px' }}>QUICK LOG</p>
        <a href="/" style={{ color: '#888888', letterSpacing: '0.24px' }}>← HOME</a>
      </div>

      <QuickLog currentBook={currentBook} />
    </main>
  )
}
