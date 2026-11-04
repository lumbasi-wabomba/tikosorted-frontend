import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'

export default function TopNav({ query, onQuery }) {
  return (
    <header className="topnav">
      <div className="topnav__inner">
        <Link to="/" className="wordmark">TikoSorted</Link>
        <SearchBar value={query} onChange={onQuery} />
        <Link to="/admin/login" className="link-btn">Management Login</Link>
      </div>
    </header>
  )
}