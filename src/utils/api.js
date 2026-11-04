// All backend calls live in this file. API.md lists what each endpoint expects and returns.
import { clearToken, getToken } from './auth'

const BASE_URL = '/api'
const upper = (value) => String(value).toUpperCase()

async function request(path, { method = 'GET', body, headers, token } = {}) {
  // Staff pages use the saved login token. Artist calls pass their own `token`.
  const authToken = token || getToken()
  const response = await fetch(BASE_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Some responses (e.g. 204) have no body
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && !token && authToken) {
      // Staff session expired: clear it and send the user to the login page
      clearToken()
      window.location.assign('/admin/login')
    }
    throw new Error(data?.message || `Request failed (${response.status})`)
  }

  return data
}

// Authentication (login/logout) and staff registration. Staff login is required for all other calls. 
export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password } })
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

// Manager only. role: manager | coordinator | finance | logistics | production |
// marketing | hospitality | compliance | gate_staff     -> { userId }
export function createStaff({ name, staffId, email, role, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: { name, staffId, email, role, password },
  })
}

// Ends the admin session. The token is cleared even if the server call fails.
export async function endSession() {
  try {
    await logout()
  } catch {
    // Ignore errors during logout
  }
  clearToken()
}

// Events
const TIER_NAMES = { EARLY_BIRD: 'Early Bird', REGULAR: 'Regular', VIP: 'VIP', VVIP: 'VVIP' }
function toEvent(raw) {
  return {
    id: raw.event_id,
    name: raw.name,
    location: raw.location,
    eventDate: raw.event_date,
    eventStage: upper(raw.event_stage), // ON_SALE, PUBLISHED, SOLD_OUT...
    headliner: raw.headliner ?? null,
    posterUrl: raw.poster_url ?? null,
    tiers: (raw.tiers || [])
      .filter((tier) => tier.tierId) // an event with no tiers can come back as [{ tierId: null }]
      .map((tier) => ({
        id: tier.tierId,
        type: upper(tier.type), // REGULAR, VIP, VVIP
        name: TIER_NAMES[upper(tier.type)] || tier.type,
        price: tier.price,
        remaining: tier.available,
      })),
  }
}

export async function getEvents() {
  const events = await request('/events')
  return events.map(toEvent)
}

export async function getEvent(eventId) {
  return toEvent(await request(`/events/${eventId}`))
}

// event staff. 
export async function createAdminEvent({ name, location, eventDate, tiers }) {
  const result = await request('/events', {
    method: 'POST',
    body: { name, location, eventDate, tiers },
  })
  return { id: result.eventId }
}

// Coordinator only. Updates the name, location, and eventDate. The backend does not allow changing the tiers here.
export function updateAdminEvent(eventId, { name, location, eventDate }) {
  return request(`/events/${eventId}`, {
    method: 'PATCH',
    body: { name, location, eventDate },
  })
}

// Coordinator only. stage: DRAFT | PUBLISHED | ON_SALE | SOLD_OUT | ONGOING | COMPLETED | CANCELLED
export function changeEventStage(eventId, stage) {
  return request(`/events/${eventId}/stage`, {
    method: 'POST',
    body: { stage: stage.toLowerCase() },
  })
}

// bookings
function toBooking(raw) {
  return {
    id: raw.booking_id,
    status: upper(raw.status), // HELD | PAID | EXPIRED | CANCELLED
    holdExpiresAt: raw.hold_expires_at,
  }
}

// ticket 
export async function createBooking({ tierId, quantity, phone, email }, idempotencyKey) {
  const booking = await request('/bookings/checkout', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: { tierId, quantity, phone, email },
  })
  return toBooking(booking)
}

// phone: 2547XXXXXXXX
export function sendMpesaPrompt(bookingId, phone) {
  return request('/payments/mpesa/stk-push', {
    method: 'POST',
    body: { bookingId, phone },
  })
}

// -> { id, status, holdExpiresAt }
export async function getBookingStatus(bookingId) {
  return toBooking(await request(`/bookings/${bookingId}/status`))
}

// Empty list until the booking is paid.
export async function getBookingTickets(bookingId) {
  const tickets = await request(`/bookings/${bookingId}/tickets`)
  return tickets.map((ticket) => ({
    id: ticket.ticket_id,
    eventName: ticket.event_name,
    type: upper(ticket.type),
    status: upper(ticket.status), // PAID | VERIFIED | USED
    qrPayload: ticket.qr_payload,
  }))
}

// artist - get all artists for an event
export function getArtists(eventId) {
  return request(`/artists?eventId=${encodeURIComponent(eventId)}`)
}

export function addArtist({ eventId, name, email }) {
  return request('/artists', { method: 'POST', body: { eventId, name, email } })
}

// artist - verify the link token and save the profile
export function verifyArtist(linkToken) {
  return request(`/artists/verify/${linkToken}`, { method: 'POST' })
}

export function saveArtistProfile(artistToken, preferences) {
  return request('/artists/profile', {
    method: 'PUT',
    token: artistToken,
    body: { preferences },
  })
}

// entourage - add members to the artist's entourage
export function addEntourage(artistToken, members) {
  return request('/artists/entourage', {
    method: 'POST',
    token: artistToken,
    body: { members },
  })
}

// gate scanner - get the manifest of tickets for this event. The manifest is cached in localStorage so the scanner can work offline.
export async function getManifest(eventId) {
  const rows = await request(`/checkin/manifest/${eventId}`)
  return {
    tickets: rows.map((row) => ({
      id: row.ticket_id,
      type: upper(row.type),
      status: row.status === 'used' ? 'USED' : 'VALID',
    })),
  }
}

// The scanner sends the ticketId or the QR payload. The backend checks the ticket and returns a message for the user.
export function scanTicket(eventId, code) {
  const body = code.includes('.') ? { eventId, payload: code } : { eventId, ticketId: code }
  return request('/checkin/scan', { method: 'POST', body })
}

// Scans made while offline: [{ ticketId, scannedAt }]
export function syncScans(deviceId, scans) {
  return request('/checkin/sync', { method: 'POST', body: { deviceId, scans } })
}

// admin dashboard and tasks. Only for staff with the "manager" role.
export function getDashboard() {
  return request('/admin/dashboard')
}

// get all tasks for the logged-in staff member. -> [{ id, title, status, deadline, eventName }]
export function getTasks() {
  return request('/admin/tasks')
}

// Create a new task for a staff member. The backend generates the id. Returns { id }.
export async function createTask({ eventId, title, assignedTo, deadline }) {
  const task = await request('/tasks', {
    method: 'POST',
    body: { eventId, title, assignedTo, deadline },
  })
  return { id: task.task_id }
}

// Map the UI status (TODO/IN_PROGRESS/COMPLETED) to the backend value (todo/in_progress/done).
function toBackendTaskStatus(status) {
  const up = String(status || '').toUpperCase()
  return up === 'COMPLETED' || up === 'DONE' ? 'done' : up.toLowerCase()
}

// Quick status change. status: TODO | IN_PROGRESS | COMPLETED
export function updateTask(taskId, { status }) {
  return request(`/tasks/${taskId}`, { method: 'PATCH', body: { status: toBackendTaskStatus(status) } })
}

// Full edit of editable fields. Only the keys present in `patch` are sent.
export function updateTaskDetails(taskId, patch = {}) {
  const body = {}
  if (patch.status !== undefined) body.status = toBackendTaskStatus(patch.status)
  if (patch.title !== undefined) body.title = patch.title
  if (patch.deadline !== undefined) body.deadline = patch.deadline || null
  // "resources" is the UI name for the single backend "resource" field.
  const resourceVal = patch.resource !== undefined ? patch.resource : patch.resources
  if (resourceVal !== undefined) body.resource = resourceVal || null
  return request(`/tasks/${taskId}`, { method: 'PATCH', body })
}

export function deleteTask(taskId) {
  return request(`/tasks/${taskId}`, { method: 'DELETE' })
}
// admin-only endpoints
export function getAuditLogs(limit = 200) {
  return request(`/admin/audit-logs?limit=${limit}`)
}

export function getAdminEvents() {
  return request('/admin/events')
}

export function getEventMetrics(eventId) {
  return request(`/admin/events/${eventId}/metrics`)
}

export function getEventCosts(eventId) {
  return request(`/admin/events/${eventId}/costs`)
}

// Cost types for events.
const COST_TYPES = {
  MARKETING: 'marketing',
  ARTISTS: 'artist',
  SOUND_EQUIP: 'sound_equipment',
  ON_GROUND: 'on_ground',
}

export function addEventCost(eventId, { name, classification, amount, costDate }) {
  return request(`/admin/events/${eventId}/costs`, {
    method: 'POST',
    body: { name, classification: COST_TYPES[classification], amount, costDate },
  })
}