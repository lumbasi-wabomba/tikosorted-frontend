import { useCallback, useEffect, useState } from 'react'
import { getManifest, scanTicket, syncScans } from '../utils/api'

// Each event gets its own saved manifest and offline queue
const manifestKey = (eventId) => `tiko_manifest_${eventId}`
const queueKey = (eventId) => `tiko_offline_scans_${eventId}`
const DEVICE_KEY = 'tiko_device_id'

// A scanned QR code looks like "ticketId.eventId.signature".
// A ticket id typed by hand has no dots. Either way the first part is the ticket id.
const ticketIdFromCode = (code) => code.split('.')[0]

function grantedMessage(type) {
  return `ENTRY GRANTED: ${type ? type + ' ' : ''}TICKET USED`
}

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

// Every phone/tablet gets a short id the first time it is used, e.g. "SCAN-4F2A"
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = 'SCAN-' + crypto.randomUUID().slice(0, 4).toUpperCase()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function useScanner(eventId) {
  const deviceId = getDeviceId()

  const [online, setOnline] = useState(navigator.onLine)
  const [manifest, setManifest] = useState(() => readSaved(manifestKey(eventId), null))
  const [pending, setPending] = useState(() => readSaved(queueKey(eventId), []).length)
  const [scanning, setScanning] = useState(false)
  const [feedback, setFeedback] = useState(null) // { kind: 'valid' | 'invalid', message }

  // Keep `online` up to date
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Download the latest list of tickets for this event
  const loadManifest = useCallback(async () => {
    if (!navigator.onLine) return
    try {
      const data = await getManifest(eventId)
      setManifest(data)
      localStorage.setItem(manifestKey(eventId), JSON.stringify(data))
    } catch {
      // keep using the saved copy
    }
  }, [eventId])

  useEffect(() => {
    loadManifest()
  }, [loadManifest])

  // Mark a ticket as used in our saved copy so the counts stay right
  function markUsed(ticketId) {
    setManifest((current) => {
      if (!current) return current
      const updated = {
        ...current,
        tickets: current.tickets.map((t) => (t.id === ticketId ? { ...t, status: 'USED' } : t)),
      }
      localStorage.setItem(manifestKey(eventId), JSON.stringify(updated))
      return updated
    })
  }

  // No internet: check against the saved list and queue the scan for later
  function validateOffline(code) {
    const ticketId = ticketIdFromCode(code)
    const ticket = manifest?.tickets.find((t) => t.id === ticketId)

    if (!ticket) {
      setFeedback({ kind: 'invalid', message: 'INVALID TICKET: NOT IN MANIFEST' })
      return
    }
    if (ticket.status === 'USED') {
      setFeedback({ kind: 'invalid', message: 'INVALID TICKET: ALREADY VERIFIED' })
      return
    }

    const queue = readSaved(queueKey(eventId), [])
    queue.push({ ticketId, scannedAt: new Date().toISOString() })
    localStorage.setItem(queueKey(eventId), JSON.stringify(queue))
    setPending(queue.length)

    markUsed(ticketId)
    setFeedback({ kind: 'valid', message: grantedMessage(ticket.type) })
  }

  // Internet available: ask the backend
  async function validateOnline(code) {
    const ticketId = ticketIdFromCode(code)
    try {
      // The backend answers with an error message when the ticket is not valid
      await scanTicket(eventId, code)
      const ticket = manifest?.tickets.find((t) => t.id === ticketId)
      markUsed(ticketId)
      setFeedback({ kind: 'valid', message: grantedMessage(ticket?.type) })
    } catch (err) {
      setFeedback({ kind: 'invalid', message: err.message })
    }
  }

  // Called with the text from a QR code or a manually typed ticket id
  async function validate(rawValue) {
    const code = String(rawValue || '').trim()
    if (!code) return

    setScanning(true)
    setFeedback(null)

    if (navigator.onLine) {
      await validateOnline(code)
    } else {
      validateOffline(code)
    }

    setScanning(false)
  }

  // Send scans that were made offline
  const syncPending = useCallback(async () => {
    const queue = readSaved(queueKey(eventId), [])
    if (queue.length === 0) return

    try {
      await syncScans(deviceId, queue)
      localStorage.removeItem(queueKey(eventId))
      setPending(0)
      loadManifest()
    } catch {
      // keep the queue and try again later
    }
  }, [eventId, deviceId, loadManifest])

  // Sync automatically when the connection comes back
  useEffect(() => {
    if (online && pending > 0) syncPending()
  }, [online, pending, syncPending])

  const total = manifest?.tickets.length ?? 0
  const checkedIn = manifest?.tickets.filter((t) => t.status === 'USED').length ?? 0

  return {
    online,
    deviceId,
    total,
    checkedIn,
    remaining: total - checkedIn,
    pending,
    scanning,
    feedback,
    clearFeedback: () => setFeedback(null),
    validate,
  }
}