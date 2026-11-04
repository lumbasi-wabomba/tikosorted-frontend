const LOCALE = 'en-KE'

// 1500 -> "KES 1,500"
export const fmtKES = (amount) => 'KES ' + Number(amount || 0).toLocaleString(LOCALE)

// 1500 -> "1,500.00"
export const fmtAmount = (amount) =>
  Number(amount || 0).toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// "SAT, 05 DEC"
export function fmtDate(iso) {
  const date = new Date(iso)
  if (isNaN(date)) return '—'
  return date
    .toLocaleDateString(LOCALE, { weekday: 'short', day: '2-digit', month: 'short' })
    .toUpperCase()
}

// "05 DEC"
export function fmtShortDate(iso) {
  const date = new Date(iso)
  if (isNaN(date)) return '—'
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' }).toUpperCase()
}

// "20:00"
export function fmtTime(iso) {
  const date = new Date(iso)
  if (isNaN(date)) return '—'
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

// "SAT, 05 DEC · 20:00 EAT"
export function fmtDateTime(iso) {
  if (isNaN(new Date(iso))) return '—'
  return `${fmtDate(iso)} · ${fmtTime(iso)} EAT`
}

// "05 DEC 2026 · 20:00:15"
export function fmtLogTime(iso) {
  const date = new Date(iso)
  if (isNaN(date)) return '—'
  const day = date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return `${day} · ${time}`.toUpperCase()
}
