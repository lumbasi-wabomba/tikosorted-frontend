import { Link, useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/Dashboard'
import { endSession } from '../utils/api'
import { fmtAmount, fmtDateTime, fmtTime } from '../utils/format'
import Spinner from '../components/Spinner'
import '../styles/dashboard.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useDashboard()

  async function logout() {
    await endSession()
    navigate('/admin/login')
  }

  return (
    <div className="dash-shell">
      <header className="dash-nav">
        <Link to="/admin" className="dash-wordmark">TIKOSORTED</Link>
        <nav className="dash-nav__links">
          <Link to="/admin/tasks">TASKS</Link>
          <Link to="/admin/report">REPORTS</Link>
          <Link to="/admin/audit">AUDIT</Link>
          <Link to="/admin/events/create">CREATE EVENT</Link>
          <button onClick={logout} className="dash-logout">LOGOUT</button>
        </nav>
      </header>

      <main className="dash-main">
        <div className="dash-head">
          <div>
            <div className="dash-eyebrow">ADMIN OVERVIEW</div>
            <h1 className="dash-title">Dashboard</h1>
          </div>
          <div className="dash-meta">
            <span>UPDATED</span>
            <strong>{fmtTime(new Date())}</strong>
          </div>
        </div>

        {isLoading && <Spinner label="LOADING DASHBOARD…" />}

        {isError && (
          <div className="dash-error">
            <div className="dash-error__title">Failed to load dashboard</div>
            <div className="dash-error__sub">{error.message}</div>
          </div>
        )}

        {data && (
          <>
            <section className="kpi-strip">
              <div className="kpi">
                <span className="kpi__label">TOTAL EVENTS</span>
                <span className="kpi__value">{String(data.kpis.totalEvents).padStart(3, '0')}</span>
              </div>
              <div className="kpi">
                <span className="kpi__label">LIVE EVENTS</span>
                <span className="kpi__value kpi__value--ok">{String(data.kpis.liveEvents).padStart(2, '0')}</span>
              </div>
              <div className="kpi">
                <span className="kpi__label">OPEN TASKS</span>
                <span className="kpi__value kpi__value--warn">{String(data.kpis.openTasks).padStart(2, '0')}</span>
              </div>
              <div className="kpi">
                <span className="kpi__label">COMPLETED TASKS</span>
                <span className="kpi__value">{String(data.kpis.completedTasks).padStart(2, '0')}</span>
              </div>
              <div className="kpi kpi--wide">
                <span className="kpi__label">TOTAL REVENUE (KES)</span>
                <span className="kpi__value kpi__value--money">{fmtAmount(data.kpis.totalRevenue)}</span>
              </div>
            </section>

            <div className="dash-grid">
              <section className="dash-card">
                <header className="dash-card__head">
                  <h2>UPCOMING EVENTS</h2>
                </header>
                {data.upcomingEvents.length === 0 ? (
                  <div className="dash-card__empty">No upcoming events.</div>
                ) : (
                  <ul className="event-list">
                    {data.upcomingEvents.map((event) => (
                      <li key={event.id} className="event-list__item">
                        <div className="event-list__left">
                          <div className="event-list__name">{event.name.toUpperCase()}</div>
                          <div className="event-list__date">{fmtDateTime(event.eventDate)}</div>
                        </div>
                        <div className="event-list__right">
                          <span className="event-list__stage">{event.eventStage.replace('_', ' ')}</span>
                          <Link to={`/checkin/${event.id}`} className="dash-card__link">SCAN →</Link>
                          <Link to={`/admin/events/edit/${event.id}`} className="dash-card__link">EDIT →</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="dash-card">
                <header className="dash-card__head">
                  <h2>RECENT ACTIVITY</h2>
                  <Link to="/admin/audit" className="dash-card__link">VIEW LOG →</Link>
                </header>
                {data.recentActivity.length === 0 ? (
                  <div className="dash-card__empty">No recent activity.</div>
                ) : (
                  <ul className="audit-list">
                    {data.recentActivity.map((log) => (
                      <li key={log.id} className="audit-list__item">
                        <span className="audit-list__time">{fmtTime(log.timestamp)}</span>
                        <span className="audit-list__action">{log.action}</span>
                        <span className="audit-list__actor">{log.actorName.slice(0, 12).toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="dash-card dash-card--actions">
                <header className="dash-card__head">
                  <h2>QUICK ACTIONS</h2>
                </header>
                <div className="actions-grid">
                  <Link to="/admin/report" className="action-btn">
                    <span className="action-btn__icon">▤</span>
                    <span>VIEW REPORT</span>
                  </Link>
                  <Link to="/admin/tasks" className="action-btn">
                    <span className="action-btn__icon">✓</span>
                    <span>MANAGE TASKS</span>
                  </Link>
                  <Link to="/admin/audit" className="action-btn">
                    <span className="action-btn__icon">⌕</span>
                    <span>AUDIT LOG</span>
                  </Link>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
