export default function MetricCell({ label, value, kind = '' }) {
  return (
    <div className="metric-cell">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${kind}`}>{value}</span>
    </div>
  )
}