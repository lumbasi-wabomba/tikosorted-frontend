import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAddTask } from '../hooks/Tasks'
import { getAdminEvents, getManagementTeam } from '../utils/api'
import { useRequest } from '../hooks/useRequest'
import Button from '../components/Button'
import Input from '../components/Input'
import '../styles/form.css'

export default function TaskCreatePage() {
  const navigate = useNavigate()
  const createMutation = useAddTask()
  const { data: events = [], isLoading: loadingEvents } = useRequest(() => getAdminEvents())
  const { data: team = [], isLoading: loadingTeam } = useRequest(() => getManagementTeam())
  const [form, setForm] = useState({
    eventId: '', teamOnboard: '', title: '', dueDate: '', resources: '',
  })
  const [error, setError] = useState('')

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.eventId) { setError('Please choose the event this task belongs to.'); return }
    if (!form.title.trim()) { setError('Title is required.'); return }
    try {
      const created = await createMutation.mutateAsync({
        eventId: form.eventId,
        title: form.title.trim(),
        assignedTo: form.teamOnboard || undefined,
        deadline: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        resource: form.resources.trim() || undefined,
      })
      navigate(`/admin/tasks/${created.id || created.taskId}`)
    } catch (err) { setError(err.message || 'Could not create task') }
  }

  return (
    <main className="form-page form-page--task-create">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">NEW TASK</h1>
          <div className="form-header__meta">ADMIN · COORDINATOR</div>
        </header>

        <form className="form-body" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">EVENT</span>
            <select className="field__select" value={form.eventId} onChange={e => setField('eventId', e.target.value)}>
              <option value="">{loadingEvents ? 'Loading events…' : 'Choose an event'}</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </label>

          <label className="field">
            <span className="field__label">TEAM ONBOARD</span>
            <select className="field__select" value={form.teamOnboard} onChange={e => setField('teamOnboard', e.target.value)}>
              <option value="">{loadingTeam ? 'Loading team…' : 'Choose a team member'}</option>
              {team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>

          <Input label="TASK TITLE" id="title" value={form.title} onChange={e => setField('title', e.target.value)} required />
          <Input label="DUE DATE" id="dueDate" type="datetime-local" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />
          <Input label="RESOURCES NEEDED" id="resources" value={form.resources} onChange={e => setField('resources', e.target.value)} placeholder="Sound system, van, budget…" />

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>CANCEL</Button>
            <Button type="submit" variant="solid" busy={createMutation.isPending}>
              {createMutation.isPending ? 'SAVING…' : 'CREATE TASK'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}