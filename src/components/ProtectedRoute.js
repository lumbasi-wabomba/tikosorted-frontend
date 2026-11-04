import { Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../utils/auth'

// Pages inside this route need a logged-in user
export default function ProtectedRoute() {
  if (!getToken()) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
