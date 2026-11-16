import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEvent, useEventCosts, useAddEventCost, useUpdateEventCost } from '../hooks/Events'
import { fmtDateTime, fmtKES } from '../utils/format'
import Spinner from '../components/Spinner'
import Input from '../components/Input'
import Button from '../components/Button'
import AdminDashboardLink from '../components/AdminDashboardLink'
import '../styles/form.css'

const CLASSIFICATIONS = [
  { value: 'marketing', label: 'MARKETING' },
  { value: 'artist', label: 'ARTISTS' },
  { value: 'sound_equipment', label: 'SOUND EQUIPMENT' },
  { value: 'on_ground', label: 'ON GROUND' },
]

export default function CostsPage() {
  const { eventId } = useParams()
  const { data: event, isLoading: loadingEvent } = useEvent(eventId)
  const { data: costs = [], isLoading: loadingCosts } = useEventCosts(eventId)
  const addMutation = useAddEventCost()
  const updateMutation = useUpdateEventCost()

  const [showAdd, setShowAdd] = useState(false)
  const [editingCost, setEditingCost] = useState(null)
  const [form, setForm] = useState({ name: '', classification: '', amount: '', costDate: '' })
  const [error, setError] = useState('')

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function resetForm() { setForm({ name: '', classification: '', amount: '', costDate: '' }); setError('') }

  const toLocalDateInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const offset = d.getTimezoneOffset()
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16)
  }

  const toISOFromDateInput = (v) => {
    if (!v) return undefined
    const [datePart, timePart] = v.split('T')
    return new Date(`${datePart}T${timePart}:00`).toISOString()
  }

  function startAdd() {
    setEditingCost(null)
    resetForm()
    setShowAdd(true)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.classification) { setError('Please choose a classification.'); return }
    const amount = Number(form.amount)
    if (!form.amount || !amount || amount <= 0) { setError('Enter a valid amount.'); return }
    const data = {
      name: form.name.trim(),
      classification: form.classification,
      amount,
      costDate: toISOFromDateInput(form.costDate),
    }
    try {
      if (editingCost) {
        await updateMutation.mutateAsync({ eventId, costId: editingCost.id, data })
      } else {
        await addMutation.mutateAsync({ eventId, data })
      }
      setShowAdd(false)
      setEditingCost(null)
      resetForm()
    } catch (err) { setError(err.message || 'Could not save cost') }
  }


  function startEdit(cost) {
    setEditingCost(cost)
    setForm({ name: cost.name, classification: cost.classification, amount: String(cost.amount), costDate: toLocalDateInput(cost.costDate) })
    setError('')
  }

  function cancel() { setShowAdd(false); setEditingCost(null); resetForm() }

  return (
    <main className="form-page form-page--costs">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">EVENT COSTS</h1>
          <div className="form-header__meta">{loadingEvent ? 'LOADING…' : event?.name?.toUpperCase()}</div>
          <AdminDashboardLink />
        </header>

        {showAdd && (
          <form className="form-body" onSubmit={submit} noValidate>
            <label className="field">
              <span className="field__label">NAME</span>
              <input className="field__input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Stage lighting hire" />
            </label>
            <div className="field">
              <span className="field__label">CLASSIFICATION</span>
              <select className="field__select" value={form.classification} onChange={e => setField('classification', e.target.value)}>
                <option value="">Choose a classification</option>
                {CLASSIFICATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field__label">AMOUNT (KES)</span>
              <input className="field__input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setField('amount', e.target.value)} placeholder="0.00" />
            </div>
            <label className="field">
              <span className="field__label">COST DATE</span>
              <input className="field__input" type="datetime-local" value={form.costDate} onChange={e => setField('costDate', e.target.value)} />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <Button type="button" variant="outline" onClick={cancel}>CANCEL</Button>
              <Button type="submit" variant="solid" busy={addMutation.isPending || updateMutation.isPending}>{addMutation.isPending || updateMutation.isPending ? 'SAVING…' : editingCost ? 'UPDATE COST' : 'ADD COST'}</Button>
            </div>
          </form>
        )}

        {!showAdd && (
          <>
            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              <Button variant="solid" onClick={startAdd}>+ ADD COST</Button>
            </div>
            {loadingCosts ? (
              <Spinner label="LOADING COSTS…"/>
            ) : costs.length === 0 ? (
              <div className="empty-block">No costs recorded for this event yet.</div>
            ) : (
              <table className="costs-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>CLASSIFICATION</th>
                    <th>AMOUNT</th>
                    <th>DATE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost) => (
                    <tr key={cost.id}>
                      <td className="cost-name">{cost.name}</td>
                      <td><span className={`classification-badge classification-badge--${cost.classification}`}>{cost.classification}</span></td>
                      <td className="cost-amount">{fmtKES(cost.amount)}</td>
                      <td className="cost-date">{fmtDateTime(cost.costDate)}</td>
                      <td className="cost-actions">
                        <Button variant="ghost" onClick={() => startEdit(cost)}>EDIT</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </main>
  )
}
