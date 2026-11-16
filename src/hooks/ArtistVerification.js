import { useEffect, useRef, useState } from 'react'
import { verifyArtist } from '../utils/api'

export function useArtistVerification(linkToken) {
  const started = useRef(null)
  const [state, setState] = useState({
    data: undefined,
    isLoading: Boolean(linkToken),
    error: null,
  })

  useEffect(() => {
    if (!linkToken || started.current === linkToken) return
    started.current = linkToken

    verifyArtist(linkToken)
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((error) => setState({ data: undefined, isLoading: false, error }))
  }, [linkToken])

  return {
    data: state.data,
    isLoading: state.isLoading,
    isError: state.error !== null,
    error: state.error,
  }
}
