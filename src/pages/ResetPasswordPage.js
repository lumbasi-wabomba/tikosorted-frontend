import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { resetPassword } from '../utils/api'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const result = await resetPassword(token, password)
      setSuccess(result.message)
      window.setTimeout(() => navigate('/admin/login'), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-page">
      <form onSubmit={submit} className="center-card">
        <h1 className="center-card__title">Reset Password</h1>
        <div className="stack">
          <Input
            label="NEW PASSWORD"
            id="reset-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="CONFIRM PASSWORD"
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {error && <div className="form-error" role="alert">{error}</div>}
          {success && <div className="form-success" role="status">{success}</div>}
          <Button type="submit" busy={busy}>
            {busy ? 'RESETTING…' : 'RESET PASSWORD'}
          </Button>
        </div>
      </form>
    </div>
  )
}
