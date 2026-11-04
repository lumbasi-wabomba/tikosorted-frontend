// Unique key sent with checkout so the backend can ignore duplicate requests
export function newIdempotencyKey() {
  const idempotencyKey = crypto.randomUUID()
  return idempotencyKey
}