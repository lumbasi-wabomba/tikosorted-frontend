# TikoSorted API contract

What the frontend sends and expects back. All calls are made from `src/utils/api.js`.

## Rules for every endpoint

- Base path is `/api` (in dev, Vite forwards `/api/*` to `VITE_BACKEND_URL`).
- `GET /api/health` reports the server is up: `{ "status": "ok", "app": "TikoSorted" }`.
- Request and response bodies are JSON. The frontend (`src/utils/api.js`) maps backend **snake_case** rows to **camelCase** for display, so some responses carry raw DB columns (e.g. `booking_id`, `ticket_id`, `task_id`, `event_date`).
- **Lists are plain arrays** (not wrapped in `{ events: [...] }`).
- Dates are ISO 8601 strings, e.g. `"2026-12-05T18:00:00Z"`.
- Money is a number in whole KES, e.g. `2500`.
- Enum values are UPPER_SNAKE_CASE.
- Protected endpoints expect `Authorization: Bearer <token>`. A `401` makes the frontend log the user out.
- Errors: non-2xx status and `{ "message": "Human readable text" }`. The message is shown to the user as-is.
- Phone numbers are sent as `2547XXXXXXXX` (digits only, no `+`), ready for M-Pesa.

---

## Auth (management staff)

Management staff log in to the admin panel. Revellers never log in. Artists use an emailed link (see Artists).

### POST `/api/auth/login`
Request: `{ "email": "a@b.com", "password": "secret" }`
Response `200`: `{ "token": "jwt...", "role": "manager" }`
`role`: one of `manager | coordinator | finance | logistics | production | marketing | hospitality | compliance | gate_staff`.
Errors: `401` invalid email or password.

### POST `/api/auth/logout`  (auth)
Deactivates the current token and ends the session.
Response `200`: `{ "message": "Logged out" }`

### POST `/api/auth/register`  (manager only)
Manager creates staff accounts (no public sign-up).
Request: `{ "name": "...", "staffId": "...", "email": "...", "role": "...", "password": "..." }`
Response `201`: `{ "userId": "..." }`
Errors: `400` missing fields or password under 8 characters; `403` if not a manager.
---

## Events

### GET `/api/events`  (public)
Sellable events only (`PUBLISHED | ON_SALE | SOLD_OUT`), soonest first. Each entry includes its ticket tiers.
```json
[
  {
    "id": "evt_1",
    "name": "Nairobi Jazz Night",
    "location": "Alchemist Bar, Westlands",
    "eventDate": "2026-12-05T18:00:00Z",
    "eventStage": "ON_SALE",
    "tiers": [
      { "tierId": "tier_1", "type": "EARLY_BIRD", "price": 1500, "available": 40 }
    ]
  }
]
```
`eventStage`: `PUBLISHED | ON_SALE | SOLD_OUT`. `headliner` and `posterUrl` may be `null`.

### GET `/api/events/:id`  (public)
Returns the event row (`SELECT * FROM events`), so keys are snake_case (`event_id`, `event_name`, `event_date`, `event_stage`, ...) until a serializer is added.
Errors: `404` event not found.

### POST `/api/events`  (coordinator only)
Create an event and its ticket tiers in one transaction.
Request: `{ "name": "...", "location": "...", "eventDate": "...", "tiers": [ { "type": "REGULAR", "price": 1000, "total": 500 } ] }`
`total` seeds both the tier `total` and its available stock.
Response `201`: `{ "eventId": "..." }`
Errors: `400` missing fields; `403` not a coordinator.

### PATCH `/api/events/:id`  (coordinator only)
Update the name, location, and eventDate. Tiers cannot be changed here. Only editable while the event is `draft` or `published`.
Request: `{ "name": "...", "location": "...", "eventDate": "..." }`
Response `200`: `{ "message": "Updated" }`
Errors: `409` event not found or no longer editable.

### POST `/api/events/:id/stage`  (coordinator only)
Move the event through its life cycle; illegal jumps are rejected.
Request: `{ "stage": "ON_SALE" }`
`stage`: `DRAFT | PUBLISHED | ON_SALE | SOLD_OUT | ONGOING | COMPLETED | CANCELLED`.
Response `200`: `{ "message": "Event is now on_sale" }`
Errors: `404` event not found; `409` illegal stage jump.
---

## Booking and payment (public; no login)

Revellers book without logging in. Flow: checkout (hold stock) → pay (M-Pesa) → webhook marks paid.

### POST `/api/bookings/checkout`  (idempotent)
Header: `Idempotency-Key: <uuid>`. Sending the same key twice returns the same booking instead of a second one.
```json
{
  "tierId": "tier_1",
  "quantity": 2,
  "phone": "254712345678",
  "email": "buyer@example.com"
}
```
`quantity` must be 1–10. Seats are held for the `HOLD_TTL_SECONDS` window (default 600s / 10 min; the frontend polls for up to 5 min).
Response `201`: the booking row, e.g.
```json
{
  "booking_id": "bkg_1",
  "event_id": "evt_1",
  "tier_id": "tier_1",
  "no_of_tickets": 2,
  "amount": 3000,
  "booker_phone": "254712345678",
  "booker_email": "buyer@example.com",
  "status": "held",
  "hold_expires_at": "2026-12-05T18:05:00Z"
}
```
Errors: `400` bad input (tierId, quantity 1–10, phone, email required); `409` not enough tickets available.

### GET `/api/bookings/:id/status`  (public)
Polling endpoint: "is my payment done yet?" Polled every 2.5 seconds for up to 5 minutes.
Response: `{ "booking_id": "bkg_1", "status": "HELD", "hold_expires_at": "..." }`
`status`: `HELD | PAID | EXPIRED | CANCELLED` (backend stores lowercase, e.g. `held`).
Errors: `404` booking not found.

### GET `/api/bookings/:id/tickets`  (public)
E-tickets, returned once the booking is paid.
Response: `[ { "ticket_id": "tkt_1", "qr_payload": "tkt_1", "status": "paid" } ]`
Includes only tickets with status `paid | verified | used`. The QR is drawn from `qr_payload`, and that value is what the gate scanner sends back as `ticketId`.

### POST `/api/payments/mpesa/stk-push`  (public)
Request: `{ "bookingId": "bkg_1", "phone": "254712345678" }`
Currently returns `501` "Not implemented yet" (Daraja STK-push integration is a TODO).

### POST `/api/payments/mpesa/callback`  (public webhook)
Safaricom calls this URL after the customer pays or cancels (must be public HTTPS — ngrok in dev).
Response: `{ "ResultCode": 0, "ResultDesc": "Accepted" }`
Only this server-to-server webhook (or provider polling) may mark a booking paid — the browser is never trusted to say "I paid".
---

## Artists

Staff add artists; artists click an emailed link to get a token and manage their entourage.

### GET `/api/artists?eventId=...`  (coordinator / hospitality)
All artists for an event, each with its entourage members.
Response `200`: array of
```json
{
  "id": "art_1",
  "name": "DJ Karaba",
  "email": "dj@example.com",
  "isVerified": true,
  "preferences": "",
  "entourage": [
    { "id": "...", "artistId": "art_1", "name": "Jane", "email": "jane@example.com", "isVerified": false }
  ]
}
```
Errors: `400` eventId is required.

### POST `/api/artists`  (coordinator only)
Add one artist to an event and email them a verification link.
Request: `{ "eventId": "...", "name": "...", "email": "..." }`
Response `201`: `{ "id": "art_1", "name": "...", "email": "...", "isVerified": false }`
Errors: `409` artist already added; `404` event not found; `400` invalid name or email.

### POST `/api/artists/verify/:token`  (public)
Opened from the emailed link. Marks the artist verified and returns an artist JWT for later calls.
Response `200`: `{ "token": "jwt...", "artist": { "id": "art_1", "eventId": "evt_1", "name": "..." } }`
Errors: `404` link not valid.

### PUT `/api/artists/profile`  (artist token)
Save profile preferences after verification. Send `Authorization: Bearer <artist-token>`.
Request: `{ "preferences": "Stage plot, 2 monitors" }`
Response `200`: `{ "message": "Profile saved" }`
Errors: `400` preferences required; `401` token not valid / expired.

### POST `/api/artists/entourage`  (artist token)
Add entourage members (bandmates, dancers). All or nothing — every member is validated before any are saved.
Request: `{ "members": [ { "name": "Jane Doe", "email": "jane@example.com" } ] }`
Response `201`: array of saved members `[ { "id": "...", "name": "...", "email": "..." } ]`
Errors: `400` empty list, a member missing a name, or an invalid email.
---

## Gate scanner (auth: gate_staff / logistics)

On-site scanning. Gate devices keep a local copy of tickets and sync later, so they can work offline.

### GET `/api/checkin/manifest/:eventId`
Gate device downloads all paid/verified tickets for an event to store locally.
Response `200`: array of `{ "ticket_id": "tkt_1", "qr_payload": "tkt_1", "status": "paid", "tier_id": "tier_1" }`

### POST `/api/checkin/scan`
Online scan. Body carries either the raw QR payload or the bare ticket id:
```json
{ "payload": "tkt_1" }
```
or `{ "ticketId": "tkt_1" }`.
Response `200`: `{ "valid": true }` and the ticket is marked `USED` (`used_at = now()`).
Errors: `400` invalid/unknown payload; `409` ticket already used or not valid.

### POST `/api/checkin/sync`
Upload offline scans in a batch. First scan wins; duplicates are flagged, not lost.
Request: `{ "deviceId": "SCAN-4F2A", "scans": [ { "ticketId": "tkt_1", "scannedAt": "2026-12-05T20:14:03Z" } ] }`
Response `200`: `{ "results": [ { "ticketId": "tkt_1", "conflict": false } ] }`
`deviceId` is generated once per device in the browser (e.g. `SCAN-4F2A`). `conflict: true` means that ticket was already used.

---

## Tasks (staff tasks per event; auth required)

### GET `/api/tasks?eventId=...`
`eventId` is optional. Returns task rows ordered by deadline (snake_case columns: `task_id`, `title`, `assigned_to`, `deadline`, `status`, ...).

### POST `/api/tasks`
Request: `{ "eventId": "...", "title": "...", "assignedTo": "...", "deadline": "...", "resource": "..." }`
Response `201`: the created task row with backend-generated `task_id`.
Errors: `400` eventId and title required.

### PATCH `/api/tasks/:id`
Editable fields: `status` (`todo | in_progress | done`), `title`, `deadline`, `resource`. Only the keys sent are changed; the frontend maps UI `TODO/IN_PROGRESS/COMPLETED` to `todo/in_progress/done`.
Response `200`: `{ "message": "Updated" }`
Errors: `404` task not found.

### DELETE `/api/tasks/:id`
Response `204`.
---

## Admin (auth required; role-based)

### GET `/api/admin/dashboard`  (finance / coordinator / manager)
Totals are computed by the backend.
```json
{
  "kpis": {
    "totalEvents": 12,
    "liveEvents": 3,
    "openTasks": 7,
    "completedTasks": 20,
    "totalRevenue": 1250000
  },
  "upcomingEvents": [ { "id": "evt_1", "name": "...", "eventDate": "...", "eventStage": "ON_SALE" } ],
  "recentActivity": [ { "id": "log_1", "timestamp": "...", "actorName": "Jane", "action": "EVENT_PUBLISHED" } ]
}
```
`liveEvents` = stage `PUBLISHED`, `ON_SALE` or `ONGOING`. `upcomingEvents` = next 5 by date. `recentActivity` = latest 5 audit logs.

### GET `/api/admin/management-team`
Returns the management team members available for task assignment:
`[ { "id": "...", "name": "..." } ]`.

### GET `/api/admin/events`
All events including drafts, for the report dropdown: `[ { "id": "evt_1", "name": "..." } ]`.

### GET `/api/admin/tasks`
```json
[
  {
    "id": "task_1",
    "title": "Book sound system",
    "teamOnboard": "Production",
    "resources": null,
    "dueDate": "2026-11-20T00:00:00Z",
    "status": "IN_PROGRESS"
  }
]
```
`status`: `TODO | IN_PROGRESS | BLOCKED | COMPLETED`. `teamOnboard`, `resources`, `dueDate` may be `null`.

### GET `/api/admin/audit-logs?limit=200`  (compliance)
Newest first. `limit` is capped at 500 (default 200).
```json
[
  {
    "id": "log_1",
    "timestamp": "2026-11-01T09:30:00Z",
    "actorName": "Jane",
    "action": "EVENT_PUBLISHED",
    "resource": "event/evt_1",
    "metadata": { "stage": "ON_SALE" }
  }
]
```
`actorName` is `"SYSTEM"` for automated actions. `resource` and `metadata` may be `null`.

### GET `/api/admin/events/:id/metrics`  (finance / coordinator / manager)
```json
{
  "netRevenue": 450000,
  "revenue": 500000,
  "totalCosts": 50000,
  "tickets": {
    "total": 320,
    "byTier": { "EARLY_BIRD": 100, "REGULAR": 150, "VIP": 60, "VVIP": 10 }
  }
}
```

### GET `/api/admin/events/:id/costs`  (finance / coordinator / manager)
One row per cost entry; the frontend adds them up per category.
```json
[ { "id": "...", "name": "...", "classification": "MARKETING", "amount": 50000, "costDate": "..." } ]
```
`classification`: `MARKETING | ARTISTS | SOUND_EQUIP | SALES | ON_GROUND` (the POST below accepts the snake_case input, e.g. `marketing`, `artist`, `sound_equipment`, `on_ground`).

### POST `/api/admin/events/:id/costs`  (finance only)
Request: `{ "name": "...", "classification": "MARKETING", "amount": 50000, "costDate": "..." }`
Response `201`: the created cost row.
---

## What changed from the old frontend

| Old | New (current backend) |
| --- | --- |
| `POST /api/auth/login` returned `{ token }` | Returns `{ token, role }` |
| `POST /api/auth/logout` → `204` | `200` `{ "message": "Logged out" }` |
| `POST /api/bookings` `{ eventId, items:[{ tierId, qty }] }` | `POST /api/bookings/checkout` `{ tierId, quantity, phone, email }` + `Idempotency-Key` header, quantity 1–10 |
| `GET /api/tasks` | `GET /api/admin/tasks` (plus full CRUD under `/api/tasks`) |
| `GET /api/checkin/events/:eventId/manifest` | `GET /api/checkin/manifest/:eventId` |
| Scan body `{ ticketId, deviceId }` → `{ valid, ticketType, message }` | `{ payload }` or `{ ticketId }` → `{ valid: true }` / `409` |
| `POST /api/artists` with `{ artists: [ ... ] }` | `POST /api/artists` one artist `{ eventId, name, email }` |
| `POST /api/artists/:artistId/entourage` | `POST /api/artists/entourage` `{ members: [ ... ] }` |
| `POST /api/payments/mpesa/stk-push` → `202 { message: "Prompt sent" }` | Currently `501` not implemented; `POST /api/payments/mpesa/callback` webhook marks the booking paid |