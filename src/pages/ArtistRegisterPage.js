import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRequest } from '../hooks/useRequest'
import { useRegisterEntourage, useSaveProfile } from '../hooks/Registration'
import { verifyArtist } from '../utils/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Spinner from '../components/Spinner'
import '../styles/register.css'

const EMPTY_MEMBER = { name: '', email: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The artist lands here from the link in their email: /artist/verify/<token>
export default function RegisterPage() {
  const { token: linkToken } = useParams()
  const navigate = useNavigate()

  // Opening the link verifies the artist and gives us a short-lived token for the saves below
  const { data: session, isLoading, isError, error } = useRequest(() => verifyArtist(linkToken), [linkToken])

  const [preferences, setPreferences] = useState('')
  const [member, setMember] = useState(EMPTY_MEMBER)
  const [queue, setQueue] = useState([]) // entourage members added with "Add another"
  const [message, setMessage] = useState('')

  const profileRequest = useSaveProfile()
  const entourageRequest = useRegisterEntourage()
  const isBusy = profileRequest.isPending || entourageRequest.isPending

  if (isLoading) {
    return (
      <div className="register-shell">
        <Spinner label="CHECKING YOUR LINK…" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="register-shell">
        <div className="register-card">
          <header className="register-header">
            <h1 className="register-header__title">LINK NOT VALID</h1>
            <div className="register-header__meta">{error.message}</div>
          </header>
        </div>
      </div>
    )
  }

  const memberIsFilled = member.name.trim() !== '' || member.email.trim() !== ''
  const memberIsValid = member.name.trim() !== '' && EMAIL_PATTERN.test(member.email.trim())

  function updateMember(key, value) {
    setMember({ ...member, [key]: value })
    setMessage('')
  }

  function addAnother() {
    if (!memberIsValid) {
      setMessage('Enter a name and a valid email for this person.')
      return
    }
    setQueue([...queue, member])
    setMember(EMPTY_MEMBER)
  }

  async function onSubmit(e) {
    e.preventDefault()

    if (!preferences.trim()) return setMessage('Please fill in your preferences.')
    if (memberIsFilled && !memberIsValid) return setMessage('Fix or clear the entourage fields.')

    // Include the person on screen if they were filled in but not added yet
    const members = (memberIsValid ? [...queue, member] : queue).map((person) => ({
      name: person.name.trim(),
      email: person.email.trim(),
    }))

    try {
      await profileRequest.submit(session.token, preferences.trim())
      if (members.length > 0) await entourageRequest.submit(session.token, members)
      navigate('/register/success')
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="register-shell">
      <div className="register-card">
        <header className="register-header">
          <h1 className="register-header__title">ARTIST REGISTRATION</h1>
          <div className="register-header__meta">WELCOME, {session.artist.name.toUpperCase()}</div>
        </header>

        <form className="register-form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span className="field__label">ARTIST PREFERENCES</span>
            <div className="field__wrap">
              <textarea
                className="field__input field__input--textarea"
                id="preferences"
                rows={5}
                value={preferences}
                onChange={(e) => { setPreferences(e.target.value); setMessage('') }}
                placeholder="Stage plot, sound requirements, travel notes…"
                required
              />
            </div>
          </label>

          <div className="register-header__meta">ENTOURAGE (OPTIONAL)</div>

          <Input
            label="ENTOURAGE NAME"
            id="member-name"
            type="text"
            value={member.name}
            onChange={(e) => updateMember('name', e.target.value)}
            placeholder="Jane Doe"
          />

          <Input
            label="ENTOURAGE EMAIL"
            id="member-email"
            type="email"
            value={member.email}
            onChange={(e) => updateMember('email', e.target.value)}
            placeholder="name@example.com"
          />

          {message && <div className="register-error">{message}</div>}

          {queue.length > 0 && (
            <div className="register-queue">
              <span className="register-queue__label">{queue.length} STAGED · PENDING SUBMIT</span>
              <ul className="register-queue__list">
                {queue.map((person, index) => (
                  <li key={index} className="register-queue__item">
                    <span className="register-queue__name">{person.name}</span>
                    <span className="register-queue__email">{person.email}</span>
                    <button
                      type="button"
                      className="register-queue__remove"
                      onClick={() => setQueue(queue.filter((_, i) => i !== index))}
                      aria-label={`Remove ${person.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="control-tray">
            <Button type="button" variant="outline" className="control-tray__add" onClick={addAnother} disabled={isBusy}>
              + ADD ANOTHER
            </Button>

            <div className="control-tray__right">
              <Button type="submit" busy={isBusy} disabled={!preferences.trim()}>
                {isBusy ? 'SUBMITTING…' : 'SUBMIT'}
              </Button>
            </div>
          </div>

          {isBusy && <Spinner label="SUBMITTING REGISTRATION…" />}
        </form>
      </div>
    </div>
  )
}
