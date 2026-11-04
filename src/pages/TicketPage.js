import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useTicket } from '../hooks/Ticket'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'
import '../styles/ticket.css'

export default function TicketPage() {
  const { bookingId } = useParams()
  const { data: tickets, isLoading, isError, error } = useTicket(bookingId)

  return (
    <div className="ticket-shell">
      <div className="ticket-card">
        <header className="ticket-header">
          <div className="ticket-header__brand">TIKOSORTED</div>
          <Badge kind="paid">E-TICKET</Badge>
        </header>

        {isLoading && <Spinner label="FETCHING TICKET…" />}

        {isError && (
          <div className="ticket-error">
            <div className="ticket-error__title">Unable to load ticket</div>
            <div className="ticket-error__sub">{error.message}</div>
            <Link to="/" className="ticket-error__back">← Back to catalog</Link>
          </div>
        )}

        {tickets?.length === 0 && (
          <div className="ticket-error">
            <div className="ticket-error__title">No tickets yet</div>
            <div className="ticket-error__sub">Your payment may still be processing. Refresh in a moment.</div>
          </div>
        )}

        {/* A booking can have several tickets, so show every one */}
        {tickets?.map((ticket) => (
          <div key={ticket.id} className="ticket-item">
            <div className="ticket-qr">
              <QRCodeSVG value={ticket.qrPayload} size={240} />
            </div>

            <div className="ticket-body">
              <div className="ticket-row">
                <span className="k">Event</span>
                <span className="v">{ticket.eventName.toUpperCase()}</span>
              </div>
              <div className="ticket-row">
                <span className="k">Ticket ID</span>
                <span className="v mono">{ticket.id}</span>
              </div>
              <div className="ticket-row">
                <span className="k">Tier</span>
                <span className="v">{ticket.type}</span>
              </div>
              <div className="ticket-row">
                <span className="k">Status</span>
                <span className="v">{ticket.status}</span>
              </div>
            </div>
          </div>
        ))}

        {tickets?.length > 0 && (
          <div className="ticket-footer">
            <span>SHOW THIS QR AT THE GATE</span>
            <span className="dot">·</span>
            <span>ALL TIMES EAT</span>
          </div>
        )}
      </div>
    </div>
  )
}
