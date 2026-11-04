import { useEffect, useState } from 'react'

// Runs request() when the page loads, and again whenever something in `deps` changes.
//   const { data, isLoading, isError, error } = useRequest(() => getEvent(id), [id])
export function useRequest(request, deps = []) {
  const [data, setData] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false // stops an old request from overwriting a newer one
    setIsLoading(true)
    setError(null)

    request()
      .then((result) => {
        if (!ignore) setData(result)
      })
      .catch((err) => {
        if (!ignore) setError(err)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, deps)

  return { data, isLoading, isError: error !== null, error }
}

// Runs an async mutation (create / update / delete) and exposes its state.
// The mutator receives the payload and must return a promise.
//   const { mutate, mutateAsync, isPending, error } = useMutation((p) => createTask(p))
export function useMutation(mutator) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const run = (payload) => {
    setIsPending(true)
    setError(null)
    return Promise.resolve(mutator(payload))
      .catch((err) => {
        setError(err)
        throw err // let the caller handle it (e.g. show a form error)
      })
      .finally(() => setIsPending(false))
  }

  return { mutate: run, mutateAsync: run, isPending, error, reset: () => setError(null) }
}
