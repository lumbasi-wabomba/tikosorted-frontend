import { getEvent, getEvents } from '../utils/api'
import { useRequest } from './useRequest'

// All public events, soonest first
export function useEvents() {
  return useRequest(async () => {
    const events = await getEvents()
    return [...events].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
  })
}

// One event including its ticket tiers
export function useEvent(eventId) {
  return useRequest(() => getEvent(eventId), [eventId])
}
