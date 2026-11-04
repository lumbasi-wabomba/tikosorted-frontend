import { getBookingTickets } from '../utils/api'
import { useRequest } from './useRequest'

// The backend only returns tickets once the booking is paid,
// otherwise it sends an error message that the page shows.
export function useTicket(bookingId) {
  return useRequest(() => getBookingTickets(bookingId), [bookingId])
}
