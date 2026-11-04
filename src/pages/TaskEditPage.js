import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTask as useTaskDetail, useUpdateTask } from '../hooks/Tasks'
import Spinner from '../components/Spinner'
import Button from '../components/Button'
import Input from '../components/Input'

// Only DB-storable statuses (the backend tasks table allows
// todo / in_progress / done).
const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED']

export default function TaskEditPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { data: task, isLoading, isError, error } = useTaskDetail(taskId)
  const updateMutation = useUpdateTask(taskId)

  const [form, setForm] = useState({ title: '', dueDate: '', resources: '', status: 'TODO' })
  const [formError, setFormError] = useState('')

  // Fill the form once the task loads (only when the id changes).
  useEffect(() => {
    if (!task) return
    setForm({
      title: task.title || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      resources: task.resources || '',
      status: (task.status || 'TODO').toUpperCase(),
    })
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    try {
      await updateMutation.mutateAsync({
        status: form.status,
        title: form.title.trim(),
        deadline: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        resource: form.resources.trim() || null,
      })
      navigate(`/admin/tasks/${taskId}`)
    } catch (err) {
      setFormError(err.message || 'Could not save changes')
    }
  }

  if (isLoading) return <main className="form-page"><div className="form-card"><Spinner label="LOADING TASK…" /></div></main>
  if (isError) return <main className="form-page"><div className="form-card"><div className="form-error">{error?.message}</div></div></main>
  if (!task) return null

  return (
    <main className="form-page">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">EDIT TASK</h1>
          <div className="form-header__meta">{task.task || task.title}</div>
        </header>

        <form className="form-body" onSubmit={submit} noValidate>
          <Input label="TASK TITLE" id="title" value={form.title} onChange={e => setField('title', e.target.value)} required />
          <Input label="DUE DATE" id="dueDate" type="datetime-local" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />
          <Input label="RESOURCES" id="resources" value={form.resources} onChange={e => setField('resources', e.target.value)} placeholder="Sound system, van, budget…" />

          <label className="field">
            <span className="field__label">STATUS</span>
            <select className="field__select" value={form.status} onChange={e => setField('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </label>

          {formError && <div className="form-error">{formError}</div>}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/tasks/${taskId}`)}>CANCEL</Button>
            <Button type="submit" variant="solid" busy={updateMutation.isPending}>
              {updateMutation.isPending ? 'SAVING…' : 'SAVE CHANGES'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}