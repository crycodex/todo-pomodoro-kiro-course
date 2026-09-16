/**
 * Time formatting utilities for todo-pom
 */

/**
 * Formats seconds into MM:SS string format.
 * - Returns "MM:SS" format (e.g., 25:00, 05:30, 00:45, 00:05)
 * - Pads single-digit minutes with leading zero (e.g., 5 → "05", 0 → "00")
 * - Pads single-digit seconds with leading zero (e.g., 5 → "05")
 * - Zero or negative values return "0:00"
 *
 * @param seconds - Number of seconds to format (0 to 1500)
 * @returns Formatted time string in MM:SS format
 *
 * @example
 * formatTime(1500)  // "25:00"
 * formatTime(330)   // "05:30"
 * formatTime(45)    // "00:45"
 * formatTime(5)     // "00:05"
 * formatTime(0)     // "0:00"
 */
export function formatTime(seconds: number): string {
  if (seconds <= 0) {
    return "0:00"
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  // Always pad minutes to 2 digits
  const minutesStr = String(minutes).padStart(2, "0")

  // Always pad seconds to 2 digits
  const secondsStr = String(remainingSeconds).padStart(2, "0")

  return `${minutesStr}:${secondsStr}`
}