export function LiveDemoFallback({ label = 'Connecting to demo API…' }: { label?: string }) {
  return (
    <div className="card" aria-busy="true" aria-live="polite">
      <p className="eyebrow">{label}</p>
      <div className="grid two">
        <div className="card skeleton" style={{ minHeight: '12rem' }} />
        <div className="card skeleton" style={{ minHeight: '12rem' }} />
      </div>
    </div>
  )
}
