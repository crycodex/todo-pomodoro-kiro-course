import { useTodoStore } from '../stores/todoStore'

let visibilityBound = false

function bindVisibility(): void {
  if (visibilityBound || typeof document === 'undefined') return
  visibilityBound = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      useTodoStore()._correctHiddenTime()
    }
  })
}

/**
 * Side-effect layer for the Pomodoro timer: interval is owned by the store,
 * this composable exposes the public controls and visibility correction.
 */
export function usePomodoro() {
  const store = useTodoStore()
  bindVisibility()

  return {
    start: (taskId: string) => store.startPomodoro(taskId),
    pause: () => store.pausePomodoro(),
    resume: () => store.resumePomodoro(),
    cancel: () => store.cancelPomodoro(),
    tick: () => store._tick(),
  }
}
