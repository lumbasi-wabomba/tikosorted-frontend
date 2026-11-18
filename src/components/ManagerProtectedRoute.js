import { Navigate, Outlet } from 'react-router-dom'
import { getRole, getToken } from '../utils/auth'

export default function ManagerProtectedRoute() {
  if (!getToken()) return <Navigate to="/admin/login" replace />
  if (getRole() !== 'manager') return <Navigate to="/admin" replace />
  return <Outlet />
}
