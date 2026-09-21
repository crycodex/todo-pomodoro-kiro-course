import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskInput from '@/components/TaskInput.vue'
import TaskItem from '@/components/TaskItem.vue'
import PomodoroOverlay from '@/components/PomodoroOverlay.vue'
import TheHeader from '@/components/TheHeader.vue'
import BreakTimer from '@/components/BreakTimer.vue'
import type { Task, PomodoroState } from '@/types'
import { WORK_DURATION_SECONDS } from '@/utils/constants'

const task: Task = {
  id: '1',
  title: 'Diseñar overlay',
  completed: false,
  createdAt: 1,
  completedAt: null,
  pomodoroCount: 3,
  timerState: null,
}

function timer(phase: PomodoroState['phase'], secondsLeft = 125): PomodoroState {
  return {
    taskId: task.id,
    phase,
    secondsLeft,
    intervalId: null,
  }
}

describe('TaskInput', () => {
  it('emits add with a valid title, then clears the field', async () => {
    const wrapper = mount(TaskInput)
    const input = wrapper.get('input')
    await input.setValue('Nueva tarea')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('add')?.[0]).toEqual(['Nueva tarea'])
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
  })

  it('does not emit add when the title is empty or whitespace', async () => {
    const wrapper = mount(TaskInput)
    await wrapper.get('input').setValue('   ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('add')).toBeUndefined()
  })

  it('disables the submit button for invalid titles', async () => {
    const wrapper = mount(TaskInput)
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.get('input').setValue('Hola')
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })
})

describe('TaskItem', () => {
  it('renders title, pomodoro count and action buttons', () => {
    const wrapper = mount(TaskItem, {
      props: { task, isActive: false },
    })
    expect(wrapper.text()).toContain('Diseñar overlay')
    expect(wrapper.text()).toContain('3 ciclos')
    expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(2)
  })

  it('enters inline edit on double click and confirms a valid title', async () => {
    const wrapper = mount(TaskItem, {
      props: { task, isActive: false },
    })
    await wrapper.get('.title').trigger('dblclick')
    const input = wrapper.get('input.edit')
    await input.setValue('Título nuevo')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('edit')?.[0]).toEqual(['1', 'Título nuevo'])
  })

  it('discards an empty inline edit', async () => {
    const taskWithTimerState: Task = { ...task, timerState: null }
    const wrapper = mount(TaskItem, {
      props: { task: taskWithTimerState, isActive: false },
    })
    await wrapper.get('.title').trigger('dblclick')
    const input = wrapper.get('input.edit')
    await input.setValue('   ')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('edit')).toBeUndefined()
    expect(wrapper.text()).toContain('Diseñar overlay')
  })
})

describe('PomodoroOverlay', () => {
  it('hides itself when the timer is idle', () => {
    const wrapper = mount(PomodoroOverlay, {
      props: { task, timerState: timer('idle', WORK_DURATION_SECONDS) },
    })
    expect(wrapper.find('.overlay').exists()).toBe(false)
  })

  it('shows remaining time as MM:SS', () => {
    const wrapper = mount(PomodoroOverlay, {
      props: { task, timerState: timer('work', 125) },
    })
    expect(wrapper.text()).toContain('02:05')
    expect(wrapper.text()).toContain('Diseñar overlay')
  })

  it('emits pause, resume and cancel', async () => {
    const running = mount(PomodoroOverlay, {
      props: { task, timerState: timer('work', 100) },
    })
    await running.get('button').trigger('click')
    expect(running.emitted('pause')).toHaveLength(1)

    const paused = mount(PomodoroOverlay, {
      props: { task, timerState: timer('paused-work', 100) },
    })
    const buttons = paused.findAll('button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')
    expect(paused.emitted('resume')).toHaveLength(1)
    expect(paused.emitted('cancel')).toHaveLength(1)
  })
})

describe('presentational snapshots', () => {
  it('renders TheHeader with a storage warning', () => {
    const wrapper = mount(TheHeader, { props: { storageWarning: true } })
    expect(wrapper.text()).toContain('todo-pom')
    expect(wrapper.text()).toContain('No se puede guardar el estado')
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders BreakTimer with formatted time', () => {
    const wrapper = mount(BreakTimer, { props: { secondsLeft: 300 } })
    expect(wrapper.text()).toContain('05:00')
    expect(wrapper.html()).toMatchSnapshot()
  })
})
