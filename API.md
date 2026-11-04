# TikoSorted API contract

What the frontend sends and expects back. All calls are made from `src/utils/api.js`.

## Rules for every endpoint

- Base path is `/api` (in dev, Vite forwards `/api/*` to `VITE_BACKEND_URL`).
- Request and response bodies are JSON with **camelCase** keys.
- **Lists are plain arrays** (not wrapped in `{ events: [...] }`).
- Every record has an **`id`** field (not `eventId`, `taskId`, `logId`...).
- Dates are ISO 8601 strings, e.g. `"2026-12-05T18:00:00Z"`.
- Money is a number in whole KES, e.g. `2500`.
- Enum values are UPPER_SNAKE_CASE.
- Protected endpoints expect `Authorization: Bearer <token>`. A `401` makes the frontend log the user out.
- Errors: non-2xx status and `{ "message": "Human readable text" }`. The message is shown to the user as-is.
- Phone numbers are sent as `2547XXXXXXXX` (digits only, no `+`), ready for M-Pesa.

---

## Auth

### POST `/api/auth/login`
Request: `{ "email": "a@b.com", "password": "secret" }`
Response `200`: `{ "token": "jwt..." }`
Errors: `401` wrong credentials.

### POST `/api/auth/logout`  (auth)
Response `204`.

---

## Events (public)

### GET `/api/events`
Published events only, soonest first.
```json
[
  {
    "id": "evt_1",
    "name": "Nairobi Jazz Night",
    "location": "Alchemist Bar, Westlands",
    "eventDate": "2026-12-05T18:00:00Z",
    "eventStage": "ON_SALE",
    "headliner": "DJ Karaba",
    "posterUrl": "https://..."
  }
]
```
`eventStage`: `DRAFT | PUBLISHED | ON_SALE | SOLD_OUT | ONGOING | COMPLETED | CANCELLED`
`headliner` and `posterUrl` may be `null`.

### GET `/api/events/:id`
Same fields as above plus the ticket tiers. Return **every tier the event sells** (the frontend no longer invents missing ones), cheapest first.
```json
{
  "id": "evt_1",
  "name": "...", "location": "...", "eventDate": "...",
  "eventStage": "ON_SALE", "headliner": "...", "posterUrl": "...",
  "tiers": [
    { "id": "tier_1", "type": "EARLY_BIRD", "name": "Early Bird", "price": 1500, "remaining": 40 }
  ]
}
```
`type`: `EARLY_BIRD | REGULAR | VIP | VVIP`. `remaining` is how many can still be bought.

---

## Booking and payment (public)

The booking is created on the checkout page, after the user enters their phone number.

### POST `/api/bookings`
Header: `Idempotency-Key: <uuid>`. Sending the same key twice must return the same booking, not create a second one.
```json
{
  "eventId": "evt_1",
  "phone": "254712345678",
  "items": [ { "tierId": "tier_1", "quantity": 2 } ]
}
```
Response `201`: `{ "id": "bkg_1", "status": "HELD" }`
Seats are held for 5 minutes. Errors: `409` not enough tickets left (message says which tier). Max 8 tickets per order.

### POST `/api/payments/mpesa/stk-push`
```json
{ "bookingId": "bkg_1", "phone": "254712345678" }
```
Response `202`: `{ "message": "Prompt sent" }`. Any error is shown to the user (the frontend no longer ignores failures).

### GET `/api/bookings/:id/status`
Polled every 2.5 seconds for up to 5 minutes.
Response: `{ "id": "bkg_1", "status": "PAID" }`
`status`: `HELD | PAID | FAILED | EXPIRED | CANCELLED`

### GET `/api/bookings/:id/tickets`
Only when the booking is `PAID`. Otherwise respond `409` with `{ "message": "Payment not completed yet" }` (the ticket page shows this message).
```json
[
  {
    "id": "tkt_1",
    "eventName": "Nairobi Jazz Night",
    "type": "VIP",
    "status": "VALID",
    "qrPayload": "tkt_1"
  }
]
```
One entry per ticket bought. The QR code is drawn in the browser from `qrPayload`, and that value is what the gate scanner sends back as `ticketId`.
`status`: `VALID | USED`

---

## Artist registration (public)

Submitted in one request, so either all people are saved or none are.

### POST `/api/artists`
```json
{
  "eventId": "evt_1",
  "artists": [
    { "name": "DJ Karaba", "email": "dj@example.com", "preferences": "Stage plot, 2 monitors" }
  ]
}
```
Response `201`. The backend emails each artist a link to register their entourage.

### POST `/api/artists/:artistId/entourage`
```json
{ "members": [ { "name": "Jane Doe", "email": "jane@example.com" } ] }
```
Response `201`.

---

## Gate scanner (login required)

These are now behind the login. The `/checkin/:eventId` page is a protected route.

### GET `/api/checkin/events/:eventId/manifest`
Downloaded so the scanner keeps working offline.
```json
{ "tickets": [ { "id": "tkt_1", "type": "VIP", "status": "VALID" } ] }
```

### POST `/api/checkin/scan`
```json
{ "ticketId": "tkt_1", "deviceId": "SCAN-4F2A" }
```
Always `200` for a real scan result, so the frontend can show your message:
```json
{ "valid": true,  "ticketType": "VIP", "message": "Entry granted" }
{ "valid": false, "ticketType": null,  "message": "INVALID TICKET: ALREADY VERIFIED" }
```
Use non-2xx only for real errors (server down, not logged in). The backend must mark the ticket `USED` when `valid` is true.

### POST `/api/checkin/sync`
Scans made while the device had no internet.
```json
{
  "eventId": "evt_1",
  "deviceId": "SCAN-4F2A",
  "scans": [ { "ticketId": "tkt_1", "scannedAt": "2026-12-05T20:14:03Z" } ]
}
```
Response `200`. Mark each ticket `USED` using `scannedAt` as the time (skip ones already used).
`deviceId` is generated once per device in the browser (e.g. `SCAN-4F2A`).

---

## Admin (login required)

### GET `/api/admin/dashboard`  (NEW)
The frontend used to download all events, tasks and logs and add them up itself. Totals now come from the backend.
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
`liveEvents` = stage `PUBLISHED`, `ON_SALE` or `ONGOING`. `upcomingEvents` = next 3 by date. `recentActivity` = latest 5 logs.

### GET `/api/admin/tasks`
Moved from `/api/tasks` because it is admin data.
```json
[
  {
    "id": "task_1",
    "title": "Book sound system",
    "teamOnboard": "Production",
    "resources": "Budget: KES 80,000",
    "dueDate": "2026-11-20T00:00:00Z",
    "status": "IN_PROGRESS"
  }
]
```
`status`: `TODO | IN_PROGRESS | BLOCKED | COMPLETED`. `teamOnboard`, `resources`, `dueDate` may be `null`.

### GET `/api/admin/audit-logs?limit=200`
Newest first.
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

### GET `/api/admin/events`
All events including drafts, for the report dropdown: `[ { "id": "evt_1", "name": "..." } ]`

### GET `/api/admin/events/:id/metrics`
```json
{
  "netRevenue": 450000.5,
  "tickets": {
    "total": 320,
    "byTier": { "EARLY_BIRD": 100, "REGULAR": 150, "VIP": 60, "VVIP": 10 }
  }
}
```

### GET `/api/admin/events/:id/costs`
One row per cost entry. The frontend adds them up per category.
```json
[ { "classification": "MARKETING", "amount": 50000 } ]
```
`classification`: `MARKETING | ARTISTS | SOUND_EQUIP | SALES | ON_GROUND`

---

## What changed from the old frontend

| Old | New |
| --- | --- |
| `POST /api/bookings/checkout` | `POST /api/bookings` |
| Booking sent `bookerPhone: "+254..."` and a made-up `bookerEmail` | `phone: "254..."` only, no email |
| `items: [{ tierId, qty }]` | `items: [{ tierId, quantity }]` |
| `GET /api/tasks` | `GET /api/admin/tasks` |
| `GET /api/checkin/manifest/:eventId` | `GET /api/checkin/events/:eventId/manifest` |
| Artists/entourage sent one request per person | One request with an array |
| Dashboard totals worked out in the browser | `GET /api/admin/dashboard` |
| `eventId`/`tierId`/`logId`/`taskId` and `LogTimestamp` | `id` and `timestamp` everywhere |
| Lists sometimes wrapped (`{ events: [] }`) | Always plain arrays |
| Scan result read from `status` or `valid` or an HTTP error | `{ valid, ticketType, message }` with `200` |
