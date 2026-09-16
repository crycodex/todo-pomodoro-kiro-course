/**
 * Formats seconds into a zero-padded MM:SS string.
 *
 * Covers the full work range [0, 1500] and break values up to 300.
 */
export function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const minutes = Math.floor(total / 60)
  const remainingSeconds = total % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}
