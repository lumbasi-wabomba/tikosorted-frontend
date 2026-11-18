import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { login } from '../utils/api'
import { setRole, setToken } from '../utils/auth'
import Button from '../components/Button'
import Input from '../components/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      const { token, role } = await login(email, password)
      setToken(token)
      setRole(role)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="center-page">
      <form onSubmit={onSubmit} className="center-card">
        <h1 className="center-card__title">Management Login</h1>
        <div className="stack">
          <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="form-error">{error}</div>}
          <Button type="submit" busy={busy}>
            {busy ? 'AUTHENTICATING…' : 'LOGIN'}
          </Button>
          <Link to="/admin/forgot-password" className="login-forgot-link">
            FORGOT PASSWORD?
          </Link>
        </div>
      </form>
    </div>
  )
}
