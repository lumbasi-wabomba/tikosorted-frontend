import { getDashboard } from '../utils/api'
import { useRequest } from './useRequest'

// The backend calculates the totals, so there is nothing to work out here
export function useDashboard() {
  return useRequest(() => getDashboard())
}
