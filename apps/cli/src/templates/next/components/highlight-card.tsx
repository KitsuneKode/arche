type HighlightCardProps = {
  label: string
  title: string
}

export function HighlightCard({ label, title }: HighlightCardProps) {
  return (
    <article className="card">
      <span>{label}</span>
      <h2>{title}</h2>
    </article>
  )
}
