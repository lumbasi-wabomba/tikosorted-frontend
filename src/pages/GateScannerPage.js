import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useScanner } from '../hooks/Scanner'
import MetricCell from '../components/MetricCell'
import FeedbackBanner from '../components/FeedbackBanner'
import '../styles/scan.css'

const pad = (number, length) => String(number).padStart(length, '0')

export default function ScanPage() {
  const { eventId } = useParams()
  const scanner = useScanner(eventId)

  const videoRef = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [manualId, setManualId] = useState('')

  // The camera loop below runs once, so it reads the newest validate() from here
  const validateRef = useRef(scanner.validate)
  validateRef.current = scanner.validate

  // Start the camera and look for QR codes
  useEffect(() => {
    let stream = null
    let stopped = false

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) return stream.getTracks().forEach((track) => track.stop())

        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)

        // BarcodeDetector is not available in every browser (the manual box still works)
        if (!('BarcodeDetector' in window)) return
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })

        while (!stopped) {
          const codes = await detector.detect(videoRef.current).catch(() => [])
          if (codes.length > 0) {
            validateRef.current(codes[0].rawValue)
            await new Promise((resolve) => setTimeout(resolve, 1500)) // avoid scanning the same code twice
          } else {
            await new Promise((resolve) => requestAnimationFrame(resolve))
          }
        }
      } catch {
        setCameraReady(false)
      }
    }

    startCamera()

    return () => {
      stopped = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // Hide the result message after 4 seconds
  useEffect(() => {
    if (!scanner.feedback) return
    const timer = setTimeout(scanner.clearFeedback, 4000)
    return () => clearTimeout(timer)
  }, [scanner.feedback])

  function onManualSubmit(e) {
    e.preventDefault()
    scanner.validate(manualId)
    setManualId('')
  }

  return (
    <div className="scan-shell">
      <header className="scan-header">
        <span className="scan-title">TIKOSORTED GATE MANAGER</span>
        <span className={`sync-badge ${scanner.online ? 'sync-badge--ok' : 'sync-badge--warn'}`}>
          {scanner.online ? 'ONLINE' : 'OFFLINE · SCANS WILL SYNC LATER'}
        </span>
      </header>

      <main className="scan-main">
        <div className="scanner-frame">
          <video ref={videoRef} className="scanner-video" playsInline muted aria-label="QR code camera view" />
          {!cameraReady && (
            <div className="scanner-placeholder">
              <span className="scanner-placeholder__icon">▢</span>
              <span className="scanner-placeholder__text">CAMERA OFFLINE</span>
            </div>
          )}
          <span className="scanner-corner scanner-corner--tl" />
          <span className="scanner-corner scanner-corner--tr" />
          <span className="scanner-corner scanner-corner--bl" />
          <span className="scanner-corner scanner-corner--br" />
        </div>

        <div className="metrics-grid">
          <MetricCell label="TOTAL CHECKED IN" value={pad(scanner.checkedIn, 3)} />
          <MetricCell label="REMAINING" value={pad(scanner.remaining, 3)} />
          <MetricCell label="ACTIVE SCANNER DEVICE" value={scanner.deviceId} kind="metric-value--sm" />
          <MetricCell
            label="PENDING SYNC ITEMS"
            value={pad(scanner.pending, 2)}
            kind={scanner.pending > 0 ? 'metric-value--warn' : ''}
          />
        </div>

        {scanner.feedback && <FeedbackBanner kind={scanner.feedback.kind} message={scanner.feedback.message} />}

        {scanner.pendingTicket && (
          <section className="scan-confirmation" aria-live="polite">
            <div className="scan-confirmation__label">TICKET INFORMATION</div>
            <div className="scan-confirmation__details">
              <strong>{scanner.pendingTicket.ticket.type || 'TICKET'}</strong>
              <span>{scanner.pendingTicket.ticket.event_name || 'EVENT'}</span>
              {scanner.pendingTicket.ticket.price != null && <span>KES {Number(scanner.pendingTicket.ticket.price).toLocaleString('en-KE')}</span>}
            </div>
            <button type="button" className="manual-btn scan-confirmation__confirm" onClick={scanner.confirmEntry} disabled={scanner.scanning}>
              {scanner.scanning ? 'CONFIRMING…' : 'CONFIRM USED'}
            </button>
            <button type="button" className="scan-confirmation__cancel" onClick={scanner.cancelPending} disabled={scanner.scanning}>
              CANCEL
            </button>
          </section>
        )}

        <form className="manual-form" onSubmit={onManualSubmit}>
          <input
            type="text"
            className="manual-input"
            placeholder="Enter Ticket Unique ID manually"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            aria-label="Enter Ticket Unique ID manually"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button type="submit" className="manual-btn" disabled={!manualId.trim() || scanner.scanning || scanner.pendingTicket}>
            {scanner.scanning ? '…' : 'VALIDATE'}
          </button>
        </form>
      </main>
    </div>
  )
}
