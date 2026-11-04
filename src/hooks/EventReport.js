import { getAdminEvents, getEventCosts, getEventMetrics } from '../utils/api'
import { useRequest } from './useRequest'

// Events for the dropdown on the report page
export function useEventList() {
  return useRequest(() => getAdminEvents())
}

// Ticket numbers and costs for one event (waits until an event is chosen)
export function useEventReport(eventId) {
  const metrics = useRequest(() => (eventId ? getEventMetrics(eventId) : Promise.resolve(null)), [eventId])
  const costs = useRequest(() => (eventId ? getEventCosts(eventId) : Promise.resolve([])), [eventId])
  return { metrics, costs }
}
