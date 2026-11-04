import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEvent } from '../hooks/Events'
import { fmtDateTime, fmtKES } from '../utils/format'
import Spinner from '../components/Spinner'
import TierRow from '../components/TierRow'

const MAX_PER_ORDER = 10 // the backend allows 1 to 10 tickets per booking

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading, isError, error } = useEvent(id)

  // The backend books ONE ticket type per order: { tierId, quantity }
  const [selection, setSelection] = useState({ tierId: null, quantity: 0 })

  if (isLoading) return <div className="page"><Spinner label="LOADING EVENT…" /></div>

  if (isError) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__mark">!</div>
          <div className="empty__title">Could not load event</div>
          <div className="empty__sub">{error.message}</div>
          <Link to="/" className="back-link">← Back to catalog</Link>
        </div>
      </div>
    )
  }

  const tiers = event.tiers
  const onSale = event.eventStage === 'ON_SALE' // the backend only sells tickets while ON_SALE
  const selectedTier = tiers.find((tier) => tier.id === selection.tierId)
  const totalQty = selection.quantity
  const totalAmount = selectedTier ? selectedTier.price * totalQty : 0

  function increase(tier) {
    // Picking a different ticket type starts again from 1
    if (selection.tierId !== tier.id) {
      setSelection({ tierId: tier.id, quantity: 1 })
      return
    }
    if (selection.quantity >= MAX_PER_ORDER || selection.quantity >= tier.remaining) return
    setSelection({ tierId: tier.id, quantity: selection.quantity + 1 })
  }

  function decrease(tier) {
    if (selection.tierId !== tier.id) return
    const quantity = selection.quantity - 1
    setSelection(quantity > 0 ? { tierId: tier.id, quantity } : { tierId: null, quantity: 0 })
  }

  // The booking is created on the checkout page, once we have the phone number and email
  function goToCheckout() {
    navigate('/checkout', {
      state: {
        event: { id: event.id, name: event.name, eventDate: event.eventDate, location: event.location },
        tier: { id: selectedTier.id, name: selectedTier.name, price: selectedTier.price },
        quantity: totalQty,
        total: totalAmount,
      },
    })
  }

  return (
    <main className="page">
      <div className="detail-frame">
        <div className="split">
          {/* LEFT */}
          <section className="col-left">
            <div className="eyebrow">LIVE EVENT · {event.location?.split(',')[0] || 'NAIROBI'}</div>
            <h1 className="event-title">{event.name.toUpperCase()}</h1>
            <div className="artist-header">
              <span>Headliner: {event.headliner || 'TBA'}</span>
              <span className="role">+ Entourage</span>
            </div>
            <figure className="poster-frame">
              {event.posterUrl
                ? <img src={event.posterUrl} alt={`${event.name} poster`} />
                : <div className="poster-frame__empty">POSTER</div>}
            </figure>
            <div className="meta-strip">
              <div><div className="k">Date</div><div className="v">{fmtDateTime(event.eventDate)}</div></div>
              <div><div className="k">Venue</div><div className="v">{(event.location || 'TBA').toUpperCase()}</div></div>
            </div>
          </section>

          {/* RIGHT */}
          <section className="col-right">
            <div className="panel-header">
              <div className="title">Select Tickets</div>
              <div className="sub">Max {MAX_PER_ORDER} · one type per order</div>
            </div>

            {!onSale && (
              <div className="form-error">
                {event.eventStage === 'SOLD_OUT' ? 'This event is sold out.' : 'Tickets are not on sale yet.'}
              </div>
            )}

            <div className="tier-stack">
              {tiers.map((tier) => (
                <TierRow
                  key={tier.id}
                  tier={tier}
                  qty={selection.tierId === tier.id ? selection.quantity : 0}
                  locked={!onSale}
                  onInc={() => increase(tier)}
                  onDec={() => decrease(tier)}
                />
              ))}
            </div>

            <div className="summary">
              <div className="row"><span className="k">Tickets Selected</span><span className="v">{totalQty}</span></div>
              <div className="row total"><span className="k">Total Due</span><span className="v">{fmtKES(totalAmount)}</span></div>
            </div>

            <button className="confirm-btn" disabled={totalQty === 0} onClick={goToCheckout}>
              Continue · {fmtKES(totalAmount)}
            </button>
          </section>
        </div>
      </div>
    </main>
  )
}
