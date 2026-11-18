import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminDashboardLink from '../components/AdminDashboardLink'
import Button from '../components/Button'
import Input from '../components/Input'
import { createStaff } from '../utils/api'
import '../styles/form.css'

const ROLES = [
  'manager',
  'coordinator',
  'finance',
  'logistics',
  'production',
  'marketing',
  'hospitality',
  'compliance',
  'gate_staff',
]

const EMPTY_FORM = {
  name: '',
  staffId: '',
  email: '',
  role: 'coordinator',
  password: '',
  confirmPassword: '',
}

export default function ManagementUserCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim() || !form.staffId.trim() || !form.email.trim() || !form.password) {
      setError('Name, staff ID, email, and password are required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await createStaff({
        name: form.name.trim(),
        staffId: form.staffId.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        password: form.password,
      })
      setSuccess(`${form.name.trim()} was added successfully.`)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.message || 'Could not add management user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="form-page">
      <div className="form-card">
        <header className="form-header">
          <h1 className="form-header__title">ADD MANAGEMENT USER</h1>
          <div className="form-header__meta">MANAGER · STAFF ACCOUNT</div>
          <AdminDashboardLink />
        </header>

        <form className="form-body" onSubmit={submit} noValidate>
          <Input
            label="FULL NAME"
            id="management-name"
            value={form.name}
            onChange={event => setField('name', event.target.value)}
            autoComplete="name"
            required
          />
          <Input
            label="STAFF ID"
            id="management-staff-id"
            value={form.staffId}
            onChange={event => setField('staffId', event.target.value)}
            required
          />
          <Input
            label="EMAIL"
            id="management-email"
            type="email"
            value={form.email}
            onChange={event => setField('email', event.target.value)}
            autoComplete="email"
            required
          />

          <label className="field">
            <span className="field__label">ROLE</span>
            <select
              className="field__select"
              value={form.role}
              onChange={event => setField('role', event.target.value)}
            >
              {ROLES.map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="PASSWORD"
            id="management-password"
            type="password"
            value={form.password}
            onChange={event => setField('password', event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="CONFIRM PASSWORD"
            id="management-confirm-password"
            type="password"
            value={form.confirmPassword}
            onChange={event => setField('confirmPassword', event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          {error && <div className="form-error" role="alert">{error}</div>}
          {success && <div className="form-success" role="status">{success}</div>}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
              CANCEL
            </Button>
            <Button type="submit" variant="solid" busy={isSubmitting}>
              {isSubmitting ? 'ADDING…' : 'ADD USER'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
