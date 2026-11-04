import { useEffect, useRef } from 'react'

export default function SearchBar({ value = '', onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form className="search" role="search" onSubmit={e => e.preventDefault()}>
      <span className="search__icon" aria-hidden="true">⌕</span>
      <input
        ref={ref}
        className="search__input"
        type="search"
        placeholder="Search events, artists, venues…"
        value={value}
        onChange={e => onChange?.(e.target.value)}
      />
      <kbd className="search__kbd">⌘K</kbd>
    </form>
  )
}