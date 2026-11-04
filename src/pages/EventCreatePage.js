import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventCreate } from '../hooks/useEventCreate'
import Button from '../components/Button'
import Input from '../components/Input'

const EMPTY_TIER = { type: 'REGULAR', name: 'Regular', price: '', quantity: '' }
const TIERS = ['EARLY_BIRD', 'REGULAR', 'VIP', 'VVIP']

export default function EventCreatePage() {
  const navigate = useNavigate()
  const createMutation = useEventCreate()

  const [form, setForm] = useState({
    name: '', location: '', eventDate: '', headliner: '', posterUrl: '',
  })
  const [tiers, setTiers] = useState([{ ...EMPTY_TIER }])
  const [error, setError] = useState('')

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addTier() { setTiers(t => [...t, { ...EMPTY_TIER }]) }
  function removeTier(i) { setTiers(t => t.filter((_, idx) => idx !== i)) }
  function setTier(i, k, v) {
    setTiers(t => t.map((tier, idx) => idx === i ? { ...tier, [k]: v } : tier))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    const validTiers = tiers.filter(t => t.price && t.quantity)
    if (!form.name || !form.location || !form.eventDate || validTiers.length === 0) {
      setError('Name, location, date, and at least one tier are required.')
      return
    }
    try {
      const created = await createMutation.mutateAsync({
        name: form.name.trim(),
        location: form.location.trim(),
        eventDate: new Date(form.eventDate).toISOString(),
        headliner: form.headliner.trim() || null,
        posterUrl: form.posterUrl.trim() || null,
        tiers: validTiers.map(t => ({
          type: t.type,
          name: t.name,
          price: Number(t.price),
          quantity: Number(t.quantity),
        })),
      })
      navigate(`/event/${created.eventId || created.id}`)
    } catch (err) {
      setError(err.message || 'Could not create event')
    }
  }

  return (
    <main className="form-page">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">CREATE EVENT</h1>
          <div className="form-header__meta">COORDINATOR · DRAFT</div>
        </header>

        <form className="form-body" onSubmit={submit} noValidate>
          <Input label="EVENT NAME" id="name" value={form.name} onChange={e => setField('name', e.target.value)} required />
          <Input label="LOCATION" id="location" value={form.location} onChange={e => setField('location', e.target.value)} required />
          <Input label="EVENT DATE & TIME" id="eventDate" type="datetime-local" value={form.eventDate} onChange={e => setField('eventDate', e.target.value)} required />
          <Input label="HEADLINER" id="headliner" value={form.headliner} onChange={e => setField('headliner', e.target.value)} />
          <Input label="POSTER URL (OPTIONAL)" id="posterUrl" value={form.posterUrl} onChange={e => setField('posterUrl', e.target.value)} />

          <div className="tier-builder">
            <div className="tier-builder__head">
              <span className="tier-builder__title">TICKET TIERS</span>
              <button type="button" className="tier-builder__add" onClick={addTier}>+ ADD TIER</button>
            </div>
            {tiers.map((tier, i) => (
              <div key={i} className="tier-builder__row">
                <select value={tier.type} onChange={e => setTier(i, 'type', e.target.value)} className="tier-builder__select">
                  {TIERS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <input type="number" placeholder="Price (KES)" value={tier.price} onChange={e => setTier(i, 'price', e.target.value)} className="tier-builder__input" />
                <input type="number" placeholder="Quantity" value={tier.quantity} onChange={e => setTier(i, 'quantity', e.target.value)} className="tier-builder__input" />
                <button type="button" className="tier-builder__remove" onClick={() => removeTier(i)} disabled={tiers.length === 1}>✕</button>
              </div>
            ))}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>CANCEL</Button>
            <Button type="submit" variant="solid" busy={createMutation.isPending}>
              {createMutation.isPending ? 'SAVING…' : 'CREATE DRAFT'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}