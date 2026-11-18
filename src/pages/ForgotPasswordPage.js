import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { requestPasswordReset } from '../utils/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await requestPasswordReset(email.trim())
      setMessage(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-page">
      <form onSubmit={submit} className="center-card">
        <h1 className="center-card__title">Forgot Password</h1>
        <div className="stack">
          <Input
            label="EMAIL"
            id="forgot-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          {error && <div className="form-error" role="alert">{error}</div>}
          {message && <div className="form-success" role="status">{message}</div>}
          <Button type="submit" busy={busy}>
            {busy ? 'SENDING…' : 'SEND RESET LINK'}
          </Button>
          <Link to="/admin/login" className="login-forgot-link">← BACK TO LOGIN</Link>
        </div>
      </form>
    </div>
  )
}
