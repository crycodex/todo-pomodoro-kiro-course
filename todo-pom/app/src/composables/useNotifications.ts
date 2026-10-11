import { ref, type Ref } from 'vue'

const BANNER_DURATION_MS = 4000

export interface UseNotificationsReturn {
  bannerMessage: Ref<string | null>
  requestPermission: () => Promise<boolean>
  notifyWorkEnd: (taskTitle: string) => void
  notifyBreakEnd: () => void
  playSound: (type: 'work-end' | 'break-end') => void
}

function canUseNotifications(): boolean {
  return typeof Notification !== 'undefined'
}

export function useNotifications(): UseNotificationsReturn {
  const permissionRequested = ref(false)
  const permissionGranted = ref(false)
  const bannerMessage = ref<string | null>(null)
  let bannerTimer: number | null = null

  function showBanner(message: string): void {
    bannerMessage.value = message
    if (bannerTimer != null) {
      window.clearTimeout(bannerTimer)
    }
    bannerTimer = window.setTimeout(() => {
      bannerMessage.value = null
      bannerTimer = null
    }, BANNER_DURATION_MS)
  }

  async function requestPermission(): Promise<boolean> {
    if (permissionRequested.value) return permissionGranted.value
    permissionRequested.value = true

    if (!canUseNotifications()) {
      permissionGranted.value = false
      return false
    }

    if (Notification.permission === 'granted') {
      permissionGranted.value = true
      return true
    }

    if (Notification.permission === 'denied') {
      permissionGranted.value = false
      return false
    }

    try {
      const result = await Notification.requestPermission()
      permissionGranted.value = result === 'granted'
      return permissionGranted.value
    } catch {
      permissionGranted.value = false
      return false
    }
  }

  function playSound(type: 'work-end' | 'break-end'): void {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = type === 'work-end' ? 880 : 523.25
      gain.gain.value = 0.08
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.18)
      oscillator.onended = () => {
        void ctx.close()
      }
    } catch {
      // Web Audio is optional; swallow errors.
    }
  }

  function sendNotification(title: string, body: string): boolean {
    if (!canUseNotifications() || Notification.permission !== 'granted') {
      return false
    }
    try {
      new Notification(title, { body })
      return true
    } catch {
      return false
    }
  }

  function notifyWorkEnd(taskTitle: string): void {
    playSound('work-end')
    const sent = sendNotification(
      'todo-pom',
      `«${taskTitle}» — trabajo terminado. Empieza un descanso de 5 min.`,
    )
    if (!sent) {
      showBanner(`Trabajo terminado en «${taskTitle}». Descanso de 5 min.`)
    }
  }

  function notifyBreakEnd(): void {
    playSound('break-end')
    const sent = sendNotification('todo-pom', 'Descanso terminado. Listo para el siguiente ciclo.')
    if (!sent) {
      showBanner('Descanso terminado. Listo para el siguiente ciclo.')
    }
  }

  return {
    bannerMessage,
    requestPermission,
    notifyWorkEnd,
    notifyBreakEnd,
    playSound,
  }
}
