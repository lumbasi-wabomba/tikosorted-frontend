export default function FeedbackBanner({ kind, message }) {
  if (!message) return null
  return (
    <div className={`feedback feedback--${kind}`}>
      {message}
    </div>
  )
}