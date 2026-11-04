export default function NumberBox({ value, pad = 3 }) {
  const str = String(Math.round(value || 0)).padStart(pad, '0')
  return (
    <div className="number-box">
      {str.split('').map((digit, i) => (
        <span key={i} className="number-box__cell">{digit}</span>
      ))}
    </div>
  )
}