import { verifyEntourage } from '../utils/api'
import { useMutation } from './useRequest'

export function useVerifyEntourage() {
  return useMutation(({ token, artistId }) => verifyEntourage(token, artistId))
}
