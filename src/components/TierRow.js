import { fmtKES } from '../utils/format'

export default function TierRow({ tier, qty, onInc, onDec }) {
  const soldOut = tier.remaining <= 0
  const left = tier.remaining - qty

  return (
    <div className={`tier-row ${qty > 0 ? 'is-active' : ''} ${soldOut ? 'is-soldout' : ''}`}>
      <div className="tier-name">
        <span className="label">{tier.name}</span>
        <span className="price">{soldOut ? 'SOLD OUT' : `${fmtKES(tier.price)} · ${left} LEFT`}</span>
      </div>
      <button className="step-btn" onClick={onInc} disabled={soldOut || qty >= tier.remaining} aria-label={`Increase ${tier.name} quantity`}>+</button>
      <div className="count-box" aria-live="polite">{qty}</div>
      <button className="step-btn" onClick={onDec} disabled={qty === 0} aria-label={`Decrease ${tier.name} quantity`}>−</button>
    </div>
  )
}
