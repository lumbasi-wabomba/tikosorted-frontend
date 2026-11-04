import { useState } from 'react'
import { useEvents } from '../hooks/Events'
import { fmtShortDate } from '../utils/format'
import TopNav from '../components/TopNav'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import Spinner from '../components/Spinner'

export default function CatalogPage() {
  const [query, setQuery] = useState('')
  const { data: events = [], isLoading, isError, error } = useEvents()

  // Search by name, location, headliner or stage
  const search = query.trim().toLowerCase()
  const filtered = events.filter((event) =>
    [event.name, event.location, event.headliner, event.eventStage]
      .join(' ')
      .toLowerCase()
      .includes(search)
  )

  const nextDate = events.length > 0 ? fmtShortDate(events[0].eventDate) : '—'

  return (
    <>
      <TopNav query={query} onQuery={setQuery} />
      <main className="page">
        <Hero count={events.length} nextDate={nextDate} />
        <section id="catalog">
          <div className="catalog__head">
            <h2 className="catalog__title">All Events</h2>
            <div className="catalog__meta">
              <span>{filtered.length} event{filtered.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          {isLoading && <Spinner label="LOADING EVENTS…" />}

          {isError && (
            <div className="empty">
              <div className="empty__mark">!</div>
              <div className="empty__title">Could not load events</div>
              <div className="empty__sub">{error.message}</div>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">
              <div className="empty__mark">∅</div>
              <div className="empty__title">No events found</div>
              <div className="empty__sub">Try clearing the search.</div>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="footer">
        <div className="footer__inner">
          <span>© {new Date().getFullYear()} TikoSorted</span>
          <span className="dot">·</span>
          <span>All times EAT</span>
        </div>
      </footer>
    </>
  )
}
