import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventList, useEventReport } from '../hooks/EventReport'
import { endSession } from '../utils/api'
import { fmtAmount } from '../utils/format'
import BarChart from '../components/BarChart'
import DonutChart from '../components/DonutChart'
import NumberBox from '../components/NumberBox'
import Spinner from '../components/Spinner'
import '../styles/report.css'

// Chart labels and colours (the order here is the order on screen)
const TIERS = [
  { key: 'EARLY_BIRD', label: 'EARLY BIRD', color: '#94A3B8' },
  { key: 'REGULAR', label: 'REGULAR', color: '#1E293B' },
  { key: 'VIP', label: 'VIP', color: '#FF4A00' },
  { key: 'VVIP', label: 'VVIP', color: '#0A0A0A' },
]

const COSTS = [
  { key: 'MARKETING', label: 'MARKETING', color: '#FF4A00' },
  { key: 'ARTISTS', label: 'ARTISTS', color: '#1E293B' },
  { key: 'SOUND_EQUIP', label: 'SOUND EQUIP', color: '#94A3B8' },
  { key: 'SALES', label: 'SALES', color: '#00C853' },
  { key: 'ON_GROUND', label: 'ON GROUND', color: '#FFAB00' },
]

export default function ReportPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('')

  const { data: events = [], isLoading: loadingEvents } = useEventList()

  // Until the user picks an event, show the first one
  const eventId = selectedId || events[0]?.id
  const { metrics, costs } = useEventReport(eventId)

  const tierData = TIERS.map((tier) => ({
    label: tier.label,
    value: metrics.data?.tickets.byTier[tier.key] || 0,
    color: tier.color,
  }))

  // Add up the costs of each classification (the backend sends one row per cost)
  const costData = COSTS.map((cost) => ({
    label: cost.label,
    value: (costs.data || [])
      .filter((row) => row.classification === cost.key)
      .reduce((sum, row) => sum + row.amount, 0),
    color: cost.color,
  })).filter((cost) => cost.value > 0)

  async function logout() {
    await endSession()
    navigate('/admin/login')
  }

  return (
    <div className="report-shell">
      <header className="report-bar">
        <div className="report-bar__left">
          <span className="report-title">EVENT REPORT</span>
        </div>

        <div className="report-bar__center">
          <label className="select-wrap">
            <span className="select-label">EVENT</span>
            <select
              className="event-select"
              value={eventId || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingEvents}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name.toUpperCase()}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="report-bar__right">
          <button className="logout-btn" onClick={logout}>LOGOUT</button>
        </div>
      </header>

      <main className="report-main">
        <section className="report-panel">
          <header className="panel-head">
            <h2 className="panel-title">Ticket Distribution</h2>
            <span className="panel-sub">BY TIER</span>
          </header>

          {metrics.isLoading ? (
            <Spinner label="LOADING METRICS…" />
          ) : (
            <>
              <BarChart data={tierData} />
              <div className="metric-row">
                <span className="metric-badge">TOTAL TICKETS</span>
                <NumberBox value={metrics.data?.tickets.total} pad={3} />
              </div>
            </>
          )}
        </section>

        <section className="report-panel report-panel--right">
          <header className="panel-head">
            <h2 className="panel-title">Budget Breakdown</h2>
            <span className="panel-sub">COST CLASSIFICATION</span>
          </header>

          {costs.isLoading ? (
            <Spinner label="LOADING COSTS…" />
          ) : costData.length === 0 ? (
            <div className="empty-block">No cost data recorded.</div>
          ) : (
            <DonutChart data={costData} size={220} thickness={32} />
          )}

          <div className="net-revenue">
            <span className="net-revenue__label">NET REVENUE</span>
            <span className="net-revenue__value">{fmtAmount(metrics.data?.netRevenue)}</span>
          </div>
        </section>
      </main>
    </div>
  )
}
