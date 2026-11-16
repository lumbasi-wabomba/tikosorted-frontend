import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAddArtist, useEventArtists, useEvent } from '../hooks/Events'
import AdminDashboardLink from '../components/AdminDashboardLink'
import Button from '../components/Button'
import Input from '../components/Input'
import Spinner from '../components/Spinner'
import '../styles/form.css'

export default function EventArtistsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading: loadingEvent } = useEvent(eventId)
  const { data: artists = [], isLoading: loadingArtists } = useEventArtists(eventId)
  const addMutation = useAddArtist()
  const [form, setForm] = useState({ name: '', email: '' })
  const [addedArtists, setAddedArtists] = useState([])
  const [error, setError] = useState('')

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Artist name and email are required.')
      return
    }

    try {
      await addMutation.mutateAsync({
        eventId,
        name: form.name.trim(),
        email: form.email.trim(),
      })
      setAddedArtists((current) => [
        ...current,
        { id: crypto.randomUUID(), name: form.name.trim(), email: form.email.trim(), isVerified: false },
      ])
      setForm({ name: '', email: '' })
    } catch (err) {
      setError(err.message || 'Could not add artist')
    }
  }

  return (
    <main className="form-page">
      <div className="form-card">
        <header className="form-header">
          <div>
            <h1 className="form-header__title">EVENT ARTISTS</h1>
            <div className="form-header__meta">
              {loadingEvent ? 'LOADING…' : event?.name?.toUpperCase()}
            </div>
          </div>
          <AdminDashboardLink />
        </header>

        <form className="form-body" onSubmit={submit} noValidate>
          <Input
            label="ARTIST NAME"
            id="artist-name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Input
            label="ARTIST EMAIL"
            id="artist-email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
          />
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/events/edit/${eventId}`)}>
              BACK TO EVENT
            </Button>
            <Button type="submit" variant="solid" busy={addMutation.isPending}>
              {addMutation.isPending ? 'SENDING…' : 'ADD ARTIST'}
            </Button>
          </div>
        </form>

        <section className="form-body">
          <div className="form-header__meta">ADDED ARTISTS</div>
          {loadingArtists ? (
            <Spinner label="LOADING ARTISTS…" />
          ) : [...artists, ...addedArtists].length === 0 ? (
            <div className="empty-block">No artists added yet.</div>
          ) : (
            [...artists, ...addedArtists].map((artist) => (
              <div key={artist.id} className="artist-row">
                <strong>{artist.name}</strong>
                <span>{artist.email}</span>
                <small>{artist.isVerified ? 'VERIFIED' : 'VERIFICATION PENDING'}</small>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  )
}
