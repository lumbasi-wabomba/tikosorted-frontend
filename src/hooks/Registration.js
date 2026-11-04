import { useState } from 'react'
import { addEntourage, saveArtistProfile } from '../utils/api'

// Small helper: wraps a submit function and tracks whether it is running
function useSubmit(submitFn) {
  const [isPending, setIsPending] = useState(false)

  async function submit(...args) {
    setIsPending(true)
    try {
      return await submitFn(...args)
    } finally {
      setIsPending(false)
    }
  }

  return { isPending, submit }
}

// submit(artistToken, preferences)
export function useSaveProfile() {
  return useSubmit(saveArtistProfile)
}

// submit(artistToken, [{ name, email }])
export function useRegisterEntourage() {
  return useSubmit(addEntourage)
}