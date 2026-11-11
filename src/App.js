import { Route, Routes, Link } from 'react-router-dom'
import CatalogPage from './pages/CatalogPage'
import EventDetailPage from './pages/EventDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import TicketPage from './pages/TicketPage'
import RegisterPage from './pages/ArtistRegisterPage'
import ScanPage from './pages/GateScannerPage'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/AdminDashboardPage'
import TasksPage from './pages/AdminTasksPage'
import ReportPage from './pages/AdminReportPage'
import AuditPage from './pages/AdminAuditPage'
import TaskCreatePage from './pages/TaskCreatePage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskEditPage from './pages/TaskEditPage'
import EventCreatePage from './pages/EventCreatePage'
import EventEditPage from './pages/EventEditPage'

function RegisterSuccess() {
  return (
    <div className="center-page">
      <div className="center-card center-card--success">
        <div className="success-mark">✓</div>
        <h1 className="success-title">Registration received</h1>
        <p className="success-sub">Thank you. Your details have been saved.</p>
        <Link to="/" className="success-link">← Back to catalog</Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<CatalogPage />} />
      <Route path="/event/:id" element={<EventDetailPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/ticket/:bookingId" element={<TicketPage />} />
      <Route path="/artist/verify/:token" element={<RegisterPage />} />
      <Route path="/register/success" element={<RegisterSuccess />} />
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Staff only (login required) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/checkin/:eventId" element={<ScanPage />} />
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/tasks" element={<TasksPage />} />
        <Route path="/admin/events/:eventId" element={<ReportPage />} />
        <Route path="/admin/events/create" element={<EventCreatePage />} />
        <Route path="/admin/taskcreate" element={<TaskCreatePage />} />
        <Route path="/admin/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/admin/tasks/:id/edit" element={<TaskEditPage />} />
        <Route path="/admin/events/edit/:eventId" element={<EventEditPage />} />
        <Route path="/admin/report" element={<ReportPage />} />
        <Route path="/admin/audit" element={<AuditPage />} />
      </Route>
    </Routes>
  )
}
