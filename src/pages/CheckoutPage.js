import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createBooking, getBookingStatus, sendMpesaPrompt } from '../utils/api'
import { newIdempotencyKey } from '../utils/crypto'
import { fmtDateTime, fmtKES } from '../utils/format'
import Button from '../components/Button'
import Input from '../components/Input'
import Disclaimer from '../components/Disclaimer'

const POLL_EVERY_MS = 2500
const FALLBACK_WAIT_MS = 5 * 60 * 1000 // only used if the backend sends no hold time
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Accepts "0712 345 678", "712345678" or "254712345678".
// Returns the number as 2547XXXXXXXX (what M-Pesa expects), or null if invalid.
function toMpesaPhone(input) {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '254' + digits.slice(1)
  else if (digits.length === 9) digits = '254' + digits
  return /^254[17]\d{8}$/.test(digits) ? digits : null
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { state } = useLocation() // { event, tier, quantity, total } sent from the event page

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState({ kind: '', message: '' })

  // The booking is kept, so pressing the button again after an error does not hold more seats
  const [booking, setBooking] = useState(null)
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey)

  // Stop polling if the user leaves the page
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Opened directly (or refreshed) without choosing tickets first
  if (!state) {
    return (
      <main className="center-page center-page--dark">
        <section className="center-card">
          <h1 className="center-card__title">No tickets selected</h1>
          <Link to="/" className="success-link">← Back to catalog</Link>
        </section>
      </main>
    )
  }

  const { event, tier, quantity, total } = state
  const mpesaPhone = toMpesaPhone(phone)
  const emailIsValid = EMAIL_PATTERN.test(email.trim())
  const showPhoneError = phone.length > 0 && !mpesaPhone
  const showEmailError = email.length > 0 && !emailIsValid

  // Start again with a brand new booking (used when the old one expired or was cancelled)
  function forgetBooking() {
    setBooking(null)
    setIdempotencyKey(newIdempotencyKey())
  }

  // Keeps asking the backend until the booking is paid or the seat hold runs out
  async function waitForPayment(heldBooking) {
    const holdEnds = new Date(heldBooking.holdExpiresAt).getTime()
    const deadline = holdEnds || Date.now() + FALLBACK_WAIT_MS

    while (Date.now() < deadline && isMounted.current) {
      await wait(POLL_EVERY_MS)
      const latest = await getBookingStatus(heldBooking.id)

      if (latest.status === 'PAID') return
      if (latest.status === 'EXPIRED' || latest.status === 'CANCELLED') {
        forgetBooking()
        throw new Error(`Booking ${latest.status.toLowerCase()}. Please try again.`)
      }
    }

    if (isMounted.current) {
      forgetBooking()
      throw new Error('Payment timed out. Please try again.')
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (busy || !mpesaPhone || !emailIsValid) return
    setBusy(true)

    try {
      let heldBooking = booking
      let key = idempotencyKey

      // The seat hold ran out while the user was away: start a fresh booking
      if (heldBooking && new Date(heldBooking.holdExpiresAt) < new Date()) {
        heldBooking = null
        key = newIdempotencyKey()
        setIdempotencyKey(key)
      }

      if (!heldBooking) {
        setStatus({ kind: '', message: 'RESERVING SEATS…' })
        heldBooking = await createBooking(
          { tierId: tier.id, quantity, phone: mpesaPhone, email: email.trim() },
          key
        )
        setBooking(heldBooking)
      }

      setStatus({ kind: '', message: 'SENDING M-PESA PROMPT…' })
      await sendMpesaPrompt(heldBooking.id, mpesaPhone)

      setStatus({ kind: '', message: 'AWAITING PAYMENT…' })
      await waitForPayment(heldBooking)

      setStatus({ kind: 'success', message: 'PAID ✓ REDIRECTING…' })
      navigate(`/ticket/${heldBooking.id}`)
    } catch (err) {
      setStatus({ kind: 'error', message: err.message })
      setBusy(false)
    }
  }

  return (
    <main className="center-page center-page--dark">
      <section className="center-card center-card--wide">
        <header className="checkout-head">
          <div className="checkout-badge">SECURE CHECKOUT</div>
          <h1 className="checkout-title">
            PAYMENT: <span>{event.name.toUpperCase()}</span>
          </h1>
          <div className="checkout-meta">
            {fmtDateTime(event.eventDate)}{event.location && ` · ${event.location.toUpperCase()}`}
          </div>
        </header>

        <div className="checkout-items">
          <div className="row">
            <span>{quantity} × {tier.name}</span>
            <span>{fmtKES(tier.price * quantity)}</span>
          </div>
          <div className="row">
            <span>Total</span>
            <span>{fmtKES(total)}</span>
          </div>
        </div>

        <Disclaimer />

        <p className="checkout-intro">
          Enter your details to pay with <strong>M-Pesa</strong>.
        </p>

        <form onSubmit={submit} className="stack">
          <Input
            label="MOBILE NUMBER"
            id="phone"
            prefix="+254"
            type="tel"
            inputMode="numeric"
            placeholder="7XX XXX XXX"
            maxLength={12}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
            disabled={busy}
            required
          />
          <div className={`checkout-hint ${showPhoneError ? 'checkout-hint--error' : ''}`}>
            {showPhoneError
              ? 'Enter a valid Kenyan mobile number.'
              : 'Safaricom or Airtel — you’ll receive an M-Pesa prompt.'}
          </div>

          <Input
            label="EMAIL"
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
          <div className={`checkout-hint ${showEmailError ? 'checkout-hint--error' : ''}`}>
            {showEmailError ? 'Enter a valid email address.' : 'Your e-ticket is linked to this email.'}
          </div>

          <div className="checkout-buttons">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={busy}>CANCEL</Button>
            <Button type="submit" busy={busy} disabled={!mpesaPhone || !emailIsValid}>
              {busy ? 'PROCESSING…' : 'PAY NOW'}
            </Button>
          </div>

          {status.message && (
            <div className={`checkout-status ${status.kind && `checkout-status--${status.kind}`}`}>
              {status.message}
            </div>
          )}
        </form>
      </section>
    </main>
  )
}
