import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTask as useTaskDetail, useUpdateTask } from '../hooks/Tasks'
import { fmtDate } from '../utils/format'
import Spinner from '../components/Spinner'
import Button from '../components/Button'
import Badge from '../components/Badge'

const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED']
const STATUS_KIND = { TODO: 'draft', IN_PROGRESS: 'held', BLOCKED: 'critical', COMPLETED: 'paid' }

export default function TaskDetailPage() {
  const { id: taskId } = useParams()
  const navigate = useNavigate()
  const { data: task, isLoading, isError, error } = useTaskDetail(taskId)
  const updateMutation = useUpdateTask(taskId)

  const [note, setNote] = useState('')
  const [resource, setResource] = useState('')
  const [localError, setLocalError] = useState('')

  function setStatus(status) {
    updateMutation.mutate({ status }, {
      onError: (err) => setLocalError(err.message || 'Failed to update status'),
    })
  }

  function addNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    const existing = task?.notes || ''
    const ts = new Date().toLocaleString('en-KE')
    const combined = existing ? `${existing}\n\n[${ts}] ${note.trim()}` : `[${ts}] ${note.trim()}`
    updateMutation.mutate({ notes: combined }, {
      onSuccess: () => setNote(''),
      onError: (err) => setLocalError(err.message || 'Failed to add note'),
    })
  }

  function addResource(e) {
    e.preventDefault()
    if (!resource.trim()) return
    const existing = task?.resources || ''
    const combined = existing ? `${existing}, ${resource.trim()}` : resource.trim()
    updateMutation.mutate({ resources: combined }, {
      onSuccess: () => setResource(''),
      onError: (err) => setLocalError(err.message || 'Failed to add resource'),
    })
  }

  if (isLoading) return <main className="form-page"><div className="form-card"><Spinner label="LOADING TASK…" /></div></main>
  if (isError) return <main className="form-page"><div className="form-card"><div className="form-error">{error?.message}</div></div></main>
  if (!task) return null

  const status = (task.status || 'TODO').toUpperCase()

  return (
    <main className="form-page">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">{task.task || task.title}</h1>
          <div className="form-header__meta">
            <Badge kind={STATUS_KIND[status] || 'draft'}>{status.replace('_', ' ')}</Badge>
          </div>
        </header>

        <div className="form-toolbar">
          <span className="form-toolbar__label">ACTIONS</span>
          <div className="form-toolbar__btns">
            <Button type="button" variant="solid" onClick={() => navigate('/admin/taskcreate')}>
              ＋ ADD TASK
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/tasks/${taskId}/edit`)}>
              EDIT TASK
            </Button>
          </div>
        </div>

        <div className="form-body">
          <div className="task-meta">
            <div><span className="k">TEAM ONBOARD</span><span className="v">{task.teamOnboard || '—'}</span></div>
            <div><span className="k">DUE DATE</span><span className="v">{task.dueDate ? fmtDate(task.dueDate) : '—'}</span></div>
            <div><span className="k">RESOURCES</span><span className="v">{task.resources || '—'}</span></div>
          </div>

          <div className="field">
            <span className="field__label">UPDATE STATUS</span>
            <div className="status-picker">
              {STATUSES.map(s => (
                <button key={s} type="button" className={`status-picker__btn ${s === status ? 'is-active' : ''}`} onClick={() => setStatus(s)} disabled={updateMutation.isPending || s === status}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">ADD RESOURCE</span>
            <form onSubmit={addResource} style={{ display: 'flex', gap: 8 }}>
              <div className="field__wrap" style={{ flex: 1 }}>
                <input className="field__input" placeholder="e.g. Van, budget, PA system" value={resource} onChange={e => setResource(e.target.value)} />
              </div>
              <Button type="submit" variant="outline" disabled={!resource.trim() || updateMutation.isPending}>ADD</Button>
            </form>
          </div>

          <div className="field">
            <span className="field__label">ADD NOTE</span>
            <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="field__wrap">
                <textarea className="field__input field__input--textarea" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add an update for the team…" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="solid" disabled={!note.trim() || updateMutation.isPending}>POST NOTE</Button>
              </div>
            </form>
          </div>

          {task.notes && (
            <div className="field">
              <span className="field__label">NOTES HISTORY</span>
              <div className="notes-log">{task.notes}</div>
            </div>
          )}

          {localError && <div className="form-error">{localError}</div>}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/tasks')}>BACK TO TASKS</Button>
          </div>
        </div>
      </div>
    </main>
  )
}