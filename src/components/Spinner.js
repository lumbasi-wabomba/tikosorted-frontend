export default function Spinner({ label = 'LOADING…' }) {
  return (
    <div className="load-state">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}