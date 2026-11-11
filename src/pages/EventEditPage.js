import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEvent, useEventUpdate, useEventStage } from '../hooks/Events'
import Spinner from '../components/Spinner'
import Button from '../components/Button'
import Input from '../components/Input'
import '../styles/form.css'

const NEXT_STAGES = {
  DRAFT: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['PUBLISHED', 'ON_SALE', 'CANCELLED'],
  ON_SALE: ['ON_SALE', 'SOLD_OUT', 'ONGOING', 'CANCELLED'],
  SOLD_OUT: ['SOLD_OUT', 'ON_SALE', 'ONGOING', 'CANCELLED'],
  ONGOING: ['ONGOING', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
}

export default function EventEditPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading, isError, error } = useEvent(eventId)
  const updateMutation = useEventUpdate(eventId)
  const stageMutation = useEventStage(eventId)
  const [form, setForm] = useState({ name: '', location: '', eventDate: '', stage: 'DRAFT' })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!event) return
    setForm({
      name: event.name || '',
      location: event.location || '',
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
      stage: event.eventStage || 'DRAFT',
    })
  }, [event?.id])

  function setField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.location.trim() || !form.eventDate) {
      setFormError('Name, location, and date are required.')
      return
    }
    try {
      await updateMutation.mutateAsync({
        name: form.name.trim(),
        location: form.location.trim(),
        eventDate: new Date(form.eventDate).toISOString(),
      })
      if (form.stage !== event.eventStage) {
        await stageMutation.mutateAsync(form.stage)
      }
      navigate(`/admin/events/${eventId}`)
    } catch (err) {
      setFormError(err.message || 'Could not save event changes')
    }
  }

  if (isLoading) return <main className="form-page"><div className="form-card"><Spinner label="LOADING EVENT…" /></div></main>
  if (isError) return <main className="form-page"><div className="form-card"><div className="form-error">{error?.message}</div></div></main>
  if (!event) return null

  const stages = NEXT_STAGES[event.eventStage] || [event.eventStage]

  return (
    <main className="form-page">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">EDIT EVENT</h1>
          <div className="form-header__meta">{event.eventStage.replace('_', ' ')}</div>
        </header>
        <form className="form-body" onSubmit={submit} noValidate>
          <Input label="EVENT NAME" id="name" value={form.name} onChange={e => setField('name', e.target.value)} required />
          <Input label="LOCATION" id="location" value={form.location} onChange={e => setField('location', e.target.value)} required />
          <Input label="EVENT DATE & TIME" id="eventDate" type="datetime-local" value={form.eventDate} onChange={e => setField('eventDate', e.target.value)} required />

          <label className="field">
            <span className="field__label">EVENT STATUS</span>
            <select className="field__select" value={form.stage} onChange={e => setField('stage', e.target.value)}>
              {stages.map(stage => <option key={stage} value={stage}>{stage.replace('_', ' ')}</option>)}
            </select>
          </label>

          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/events/${eventId}`)}>CANCEL</Button>
            <Button type="submit" variant="solid" busy={updateMutation.isPending || stageMutation.isPending}>
              {updateMutation.isPending || stageMutation.isPending ? 'SAVING…' : 'SAVE CHANGES'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
