import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/Tasks'
import { endSession } from '../utils/api'
import { fmtDate } from '../utils/format'
import Spinner from '../components/Spinner'
import '../styles/tasks.css'

// Colour of the dot next to each status
const STATUS_COLOR = {
  COMPLETED: 'var(--paid)',
  IN_PROGRESS: 'var(--pending)',
  TODO: 'var(--draft)',
  BLOCKED: 'var(--critical)',
}

export default function TasksPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { data: tasks = [], isLoading, isError, error } = useTasks()

  const search = query.trim().toLowerCase()
  const filtered = tasks.filter((task) =>
    [task.title, task.teamOnboard, task.resources, task.status]
      .join(' ')
      .toLowerCase()
      .includes(search)
  )

  async function logout() {
    await endSession()
    navigate('/admin/login')
  }

  return (
    <div className="tasks-shell">
      <header className="tasks-header">
        <div className="tasks-header__left">
          <span className="tasks-title">TASK TRACKER</span>
        </div>
        <div className="tasks-header__right">
          <button className="logout-btn" onClick={logout}>LOGOUT</button>
        </div>
      </header>

      <div className="tasks-toolbar">
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search for Task"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search for Task"
          />
        </div>
      </div>

      <div className="tasks-table-wrap">
        {isLoading && <Spinner label="LOADING TASKS…" />}
        {isError && <div className="table-error">Error: {error.message}</div>}

        {!isLoading && !isError && (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>TASK</th>
                <th>TEAM ONBOARD</th>
                <th>RESOURCES</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">No tasks found.</td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr key={task.id} className="tasks-row" onClick={() => navigate(`/admin/tasks/${task.id}`)}>
                    <td>{task.title}</td>
                    <td>{task.teamOnboard || '—'}</td>
                    <td>{task.resources || '—'}</td>
                    <td>{task.dueDate ? fmtDate(task.dueDate) : '—'}</td>
                    <td>
                      <span className="status-indicator">
                        <span className="status-dot" style={{ background: STATUS_COLOR[task.status] }} />
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
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
