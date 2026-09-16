import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNotifications } from '@/composables/useNotifications'

function mockNotification(permission: NotificationPermission) {
  const requestPermission = vi.fn().mockResolvedValue(permission)
  const NotificationMock = vi.fn() as unknown as typeof Notification
  Object.defineProperty(NotificationMock, 'permission', { get: () => permission })
  Object.defineProperty(NotificationMock, 'requestPermission', { value: requestPermission })
  vi.stubGlobal('Notification', NotificationMock)
  return { requestPermission, NotificationMock }
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('calls requestPermission only on the first invocation', async () => {
    const { requestPermission } = mockNotification('default')
    const notifications = useNotifications()
    await notifications.requestPermission()
    await notifications.requestPermission()
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })

  it('shows a visual banner when permission is denied', () => {
    mockNotification('denied')
    const notifications = useNotifications()
    notifications.notifyWorkEnd('Redactar spec')
    expect(notifications.bannerMessage.value).toContain('Trabajo terminado')
    expect(notifications.bannerMessage.value).toContain('Redactar spec')
    vi.advanceTimersByTime(4000)
    expect(notifications.bannerMessage.value).toBeNull()
  })

  it('captures Web Audio errors without throwing', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('AudioContext unavailable')
        }
      },
    )
    const notifications = useNotifications()
    expect(() => notifications.playSound('work-end')).not.toThrow()
    expect(() => notifications.playSound('break-end')).not.toThrow()
  })
})
