import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAddTask } from '../hooks/Tasks'
import { getAdminEvents } from '../utils/api'
import { useRequest } from '../hooks/useRequest'
import Button from '../components/Button'
import Input from '../components/Input'

export default function TaskCreatePage() {
  const navigate = useNavigate()
  const createMutation = useAddTask()
  const { data: events = [], isLoading: loadingEvents } = useRequest(() => getAdminEvents())
  const [form, setForm] = useState({
    eventId: '', title: '', dueDate: '',
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
        deadline: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      })
      navigate(`/admin/tasks/${created.id || created.taskId}`)
    } catch (err) { setError(err.message || 'Could not create task') }
  }

  return (
    <main className="form-page">
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

          <Input label="TASK TITLE" id="title" value={form.title} onChange={e => setField('title', e.target.value)} required />
          <Input label="DUE DATE" id="dueDate" type="datetime-local" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />

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