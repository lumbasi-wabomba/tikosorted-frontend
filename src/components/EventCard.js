import { Link } from 'react-router-dom'
import { fmtDateTime } from '../utils/format'

// Which colour badge to show for each event stage
const STAGE_STYLE = {
  DRAFT: 'draft',
  PUBLISHED: 'on_sale',
  ON_SALE: 'on_sale',
  SOLD_OUT: 'sold_out',
  ONGOING: 'on_sale',
  COMPLETED: 'draft',
  CANCELLED: 'cancelled',
}

export default function EventCard({ event }) {
  const stageStyle = STAGE_STYLE[event.eventStage] || 'draft'

  return (
    <Link to={`/event/${event.id}`} className="card" aria-label={`Open ${event.name}`}>
      <div className={`card__poster ${event.posterUrl ? '' : 'card__poster--empty'}`}>
        {event.posterUrl && <img src={event.posterUrl} alt={`${event.name} poster`} loading="lazy" />}
        <span className={`card__stage card__stage--${stageStyle}`}>
          {/* {event.eventStage.replace('_', ' ')} */}
        </span>
      </div>
      <div className="card__body">
        <div className="card__title">{event.name}</div>
        <div className="card__row">
          <span className="k">Artist</span>
          <span className="v">{event.headliner || 'Headliner TBA'}</span>
        </div>
        <div className="card__row">
          <span className="k">Location</span>
          <span className="v">{event.location || 'Venue TBA'}</span>
        </div>
        <div className="card__row">
          <span className="k">Date / Time</span>
          <span className="v">{fmtDateTime(event.eventDate)}</span>
        </div>
      </div>
    </Link>
  )
}
