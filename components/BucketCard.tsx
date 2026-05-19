type Props = {
  label: string
  primary: string | null
  secondary?: string | null
}

export default function BucketCard({ label, primary, secondary }: Props) {
  return (
    <div
      style={{
        backgroundColor: '#1d1d1d',
        borderRadius: '10px',
        padding: '26px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <span style={{ color: '#888888', letterSpacing: '0.24px' }}>{label}</span>
      {primary != null ? (
        <span style={{ color: '#ffffff', letterSpacing: '0.24px' }}>{primary}</span>
      ) : (
        <span style={{ color: '#888888', letterSpacing: '0.24px' }}>—</span>
      )}
      {secondary != null && (
        <span style={{ color: '#888888', letterSpacing: '0.24px' }}>{secondary}</span>
      )}
    </div>
  )
}
