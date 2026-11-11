import { changeEventStage, createAdminEvent, getEvent, getEvents, updateAdminEvent } from '../utils/api'
import { useMutation, useRequest } from './useRequest'

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

export function useEventCreate() {
  return useMutation((eventData) => createAdminEvent(eventData))
} 

export function useEventUpdate(eventId) {
  return useMutation((eventData) => updateAdminEvent(eventId, eventData))
}

export function useEventStage(eventId) {
  return useMutation((stage) => changeEventStage(eventId, stage))
}
