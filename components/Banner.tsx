type Props = {
  dayNumber: number
}

export default function Banner({ dayNumber }: Props) {
  const label = dayNumber === 0 ? 'DAY ZERO' : `DAY ${dayNumber}`
  const description =
    dayNumber === 0 ? 'The cycle begins.' :
    dayNumber === 30 ? 'Halfway through Phase 1.' :
    dayNumber === 45 ? 'Midpoint.' :
    dayNumber === 60 ? 'Entering the final stretch.' :
    'The cycle is complete.'

  return (
    <div
      style={{
        backgroundColor: '#1d1d1d',
        border: '1px solid #383838',
        padding: '16px 26px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        letterSpacing: '0.24px',
      }}
    >
      <span style={{ color: '#ffffff' }}>
        [ {label} · {dayNumber}-DAY REFLECTION ] {description}
      </span>
      <a
        href={`/markers/${dayNumber}`}
        style={{ color: '#888888', whiteSpace: 'nowrap', marginLeft: '26px' }}
      >
        Open reflection →
      </a>
    </div>
  )
}
