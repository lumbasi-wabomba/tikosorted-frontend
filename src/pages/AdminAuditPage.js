import { useState } from 'react'
import { useAuditLogs } from '../hooks/AuditLogs'
import { fmtLogTime } from '../utils/format'
import Spinner from '../components/Spinner'
import '../styles/audit.css'

export default function AuditPage() {
  const [query, setQuery] = useState('')
  const { data: logs = [], isLoading, isError, error } = useAuditLogs()

  const search = query.trim().toLowerCase()
  const filtered = logs.filter((log) =>
    [log.actorName, log.action, log.resource, JSON.stringify(log.metadata)]
      .join(' ')
      .toLowerCase()
      .includes(search)
  )

  // Show only the start of long metadata
  function shortMetadata(metadata) {
    if (!metadata) return '—'
    const text = JSON.stringify(metadata)
    return text.length > 60 ? text.slice(0, 60) + '…' : text
  }

  return (
    <div className="audit-shell">
      <header className="audit-header">
        <div className="audit-header__left">
          <span className="audit-title">AUDIT LOG</span>
          <span className="audit-sub">SYSTEM ACTIVITY TRAIL</span>
        </div>
        <div className="audit-search">
          <span className="audit-search__icon">⌕</span>
          <input
            type="text"
            placeholder="Search actor, action, resource…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search audit logs"
          />
        </div>
      </header>

      <div className="audit-body">
        {isLoading && <Spinner label="LOADING AUDIT TRAIL…" />}
        {isError && <div className="audit-error">Failed to load logs: {error.message}</div>}

        {!isLoading && !isError && (
          <table className="audit-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTOR</th>
                <th>ACTION</th>
                <th>RESOURCE</th>
                <th>METADATA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="audit-empty">No log entries found.</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="mono">{fmtLogTime(log.timestamp)}</td>
                    <td><span className="actor-chip">{log.actorName.slice(0, 16).toUpperCase()}</span></td>
                    <td><span className="action-chip">{log.action}</span></td>
                    <td className="mono">{log.resource || '—'}</td>
                    <td className="mono metadata">{shortMetadata(log.metadata)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
