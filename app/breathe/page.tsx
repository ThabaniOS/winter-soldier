import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/dates'
import type { PhaseMarker } from '@/lib/types'
import Banner from '@/components/Banner'
import BreathingOrb from '@/components/BreathingOrb'

export default async function BreathePage() {
  const today = todayISO()

  const { data: phaseMarker } = await (
    supabase
      .from('phase_markers')
      .select('day_number')
      .eq('marker_date', today)
      .is('completed_at', null)
      .maybeSingle() as unknown as Promise<{ data: Pick<PhaseMarker, 'day_number'> | null }>
  )

  return (
    <main
      style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '32px',
        height: 'calc(100vh - 52px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          "'Soehne Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        boxSizing: 'border-box',
      }}
    >
      {phaseMarker && <Banner dayNumber={phaseMarker.day_number} />}
      <BreathingOrb />
    </main>
  )
}
