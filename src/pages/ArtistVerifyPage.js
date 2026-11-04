import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useVerifyArtist } from '../hooks/useVerify'
import Spinner from '../components/Spinner'

export default function ArtistVerifyPage() {
  const { token } = useParams()
  const verifyMutation = useVerifyArtist()

  useEffect(() => {
    if (token) verifyMutation.mutate(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <main className="form-page">
      <div className="form-card form-card--centered">
        <header className="form-header">
          <h1 className="form-header__title">ARTIST VERIFICATION</h1>
          <div className="form-header__meta">EMAIL CONFIRMATION</div>
        </header>

        <div className="form-body" style={{ alignItems: 'center', textAlign: 'center', padding: 48 }}>
          {verifyMutation.isPending && <Spinner label="VERIFYING…" />}
          {verifyMutation.isSuccess && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, color: 'var(--paid)', marginBottom: 16 }}>✓</div>
              <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, marginBottom: 8 }}>Profile verified</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--draft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>You can now register your entourage.</p>
              <Link to="/artist/register?type=entourage" className="link-btn">ADD ENTOURAGE →</Link>
            </>
          )}
          {verifyMutation.isError && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, color: 'var(--critical)', marginBottom: 16 }}>✕</div>
              <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, marginBottom: 8 }}>Invalid or expired token</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--draft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>{verifyMutation.error?.message}</p>
              <Link to="/" className="link-btn">← Back to catalog</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}