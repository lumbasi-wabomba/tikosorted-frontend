import { getAuditLogs } from '../utils/api'
import { useRequest } from './useRequest'

export function useAuditLogs(limit = 200) {
  return useRequest(() => getAuditLogs(limit), [limit])
}
