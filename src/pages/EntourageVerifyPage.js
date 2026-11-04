import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useVerifyEntourage } from '../hooks/useVerify'
import Spinner from '../components/Spinner'

export default function EntourageVerifyPage() {
  const { token } = useParams()
  const [params] = useSearchParams()
  const artistId = params.get('artistId')
  const verifyMutation = useVerifyEntourage()

  useEffect(() => {
    if (token && artistId) verifyMutation.mutate({ token, artistId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, artistId])

  return (
    <main className="form-page">
      <div className="form-card form-card--centered">
        <header className="form-header">
          <h1 className="form-header__title">ENTOURAGE VERIFICATION</h1>
          <div className="form-header__meta">EMAIL CONFIRMATION</div>
        </header>

        <div className="form-body" style={{ alignItems: 'center', textAlign: 'center', padding: 48 }}>
          {verifyMutation.isPending && <Spinner label="VERIFYING…" />}
          {verifyMutation.isSuccess && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, color: 'var(--paid)', marginBottom: 16 }}>✓</div>
              <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, marginBottom: 8 }}>Entourage confirmed</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--draft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>You are now part of the event crew.</p>
              <Link to="/" className="link-btn">← BACK TO CATALOG</Link>
            </>
          )}
          {verifyMutation.isError && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, color: 'var(--critical)', marginBottom: 16 }}>✕</div>
              <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, marginBottom: 8 }}>Verification failed</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--draft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>{verifyMutation.error?.message}</p>
              <Link to="/" className="link-btn">← BACK TO CATALOG</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}