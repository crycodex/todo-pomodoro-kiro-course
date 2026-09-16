/**
 * Application constants for todo-pom
 */

/** Duration of a Pomodoro work session in seconds (25 minutes) */
export const POMODORO_DURATION = 25 * 60

/** Duration of a short break in seconds (5 minutes) */
export const SHORT_BREAK_DURATION = 5 * 60

/** Duration of a long break in seconds (15 minutes) */
export const LONG_BREAK_DURATION = 15 * 60

/** Number of Pomodoros until a long break is suggested */
export const POMODOROS_UNTIL_LONG_BREAK = 4

/** Key used for localStorage persistence */
export const STORAGE_KEY = 'todo-pomodoro-state'