import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '@/stores/todoStore'
import { WORK_DURATION_SECONDS } from '@/utils/constants'

describe('startPomodoro preservation properties', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    useTodoStore().cancelPomodoro()
  })

  /**
   * Property 1: Nueva tarea sin timerState inicia fresco
   * Validates: Requirements 3.1, 3.2
   *
   * Cuando startPomodoro() se llama en una tarea SIN timerState existente:
   * - El timer debe iniciar fresco con WORK_DURATION_SECONDS (25 minutos = 1500 segundos)
   * - La phase debe establecerse a 'work'
   */
  it('Property 1: startPomodoro sin timerState inicializa secondsLeft a WORK_DURATION_SECONDS', () => {
    // Feature: timer-pom, Property 1: Fresh start sin timerState
    const store = useTodoStore()

    // Crear tarea sin timerState
    store.addTask('Test task')
    const task = store.activeTasks[0]

    // Verificar que no tiene timerState
    expect(task.timerState).toBeNull()

    // Llamar startPomodoro
    store.startPomodoro(task.id)

    // El estado global debe tener secondsLeft = WORK_DURATION_SECONDS
    expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)
  })

  it('Property 1 (PBT): startPomodoro sin timerState siempre usa WORK_DURATION_SECONDS', () => {
    // Feature: timer-pom, Property 1: Fresh start consistency
    // Test: Para cualquier número de tareas (1-10 para velocidad), startPomodoro
    // en tarea sin timerState debe inicializar secondsLeft a WORK_DURATION_SECONDS
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (numTasks) => {
        // Crear un nuevo pinia store para cada ejecución
        setActivePinia(createPinia())
        localStorage.clear()
        const store = useTodoStore()

        // Crear múltiples tareas sin timerState
        for (let i = 0; i < numTasks; i++) {
          store.addTask(`Test task ${i}`)
        }

        // Seleccionar la primera tarea
        const task = store.activeTasks[0]

        // Verificar precondición: no tiene timerState
        expect(task.timerState).toBeNull()

        // startPomodoro debe inicializar secondsLeft a WORK_DURATION_SECONDS
        store.startPomodoro(task.id)
        expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)
      }),
      { numRuns: 50 },
    )
  })

  /**
   * Property 2: startPomodoro sin timerState establece phase a 'work'
   * Validates: Requirement 3.3
   */
  it('Property 2: startPomodoro sin timerState establece phase a work', () => {
    const store = useTodoStore()
    store.addTask('Test task')
    const task = store.activeTasks[0]

    expect(task.timerState).toBeNull()

    store.startPomodoro(task.id)

    expect(store.pomodoro.phase).toBe('work')
  })

  it('Property 2 (PBT): startPomodoro sin timerState siempre usa phase work', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (numTasks) => {
        setActivePinia(createPinia())
        localStorage.clear()
        const store = useTodoStore()

        for (let i = 0; i < numTasks; i++) {
          store.addTask(`Test task ${i}`)
        }

        const task = store.activeTasks[0]
        expect(task.timerState).toBeNull()

        store.startPomodoro(task.id)
        expect(store.pomodoro.phase).toBe('work')
      }),
      { numRuns: 50 },
    )
  })

  /**
   * Property 3: Creación de timerState correcta
   * Validates: Requirement 3.4
   *
   * Después de startPomodoro en tarea sin timerState:
   * - Se debe crear un nuevo timerState con valores correctos
   * - timerState debe existir después de llamar startPomodoro
   */
  it('Property 3: startPomodoro sin timerState crea timerState con valores correctos', () => {
    const store = useTodoStore()
    store.addTask('Test task')
    const task = store.activeTasks[0]

    expect(task.timerState).toBeNull()

    store.startPomodoro(task.id)

    // timerState debe ser creado
    expect(task.timerState).not.toBeNull()

    // timerState debe tener valores correctos
    expect(task.timerState!.phase).toBe('work')
    expect(task.timerState!.secondsLeft).toBe(WORK_DURATION_SECONDS)
  })

  it('Property 3 (PBT): startPomodoro sin timerState siempre crea timerState correcto', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (numTasks) => {
        setActivePinia(createPinia())
        localStorage.clear()
        const store = useTodoStore()

        for (let i = 0; i < numTasks; i++) {
          store.addTask(`Test task ${i}`)
        }

        const task = store.activeTasks[0]

        // Verificar precondición: no tiene timerState
        expect(task.timerState).toBeNull()

        store.startPomodoro(task.id)

        // Verificar postcondiciones
        expect(task.timerState).not.toBeNull()
        expect(task.timerState!.phase).toBe('work')
        expect(task.timerState!.secondsLeft).toBe(WORK_DURATION_SECONDS)
      }),
      { numRuns: 50 },
    )
  })

  /**
   * Property 4: Comportamiento consistente
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   *
   * Múltiples llamadas a startPomodoro en diferentes tareas sin timerState
   * deben comportarse igual:
   * - Cada tarea sin timerState inicia con timer fresco
   * - El estado global siempre refleja el timerState de la tarea activa
   */
  it('Property 4: Comportamiento consistente entre tareas sin timerState', () => {
    const store = useTodoStore()

    // Crear múltiples tareas
    store.addTask('Task A')
    store.addTask('Task B')
    store.addTask('Task C')

    const tasks = store.activeTasks

    // Verificar que ninguna tiene timerState
    tasks.forEach((task) => {
      expect(task.timerState).toBeNull()
    })

    // Alternar entre tareas y verificar comportamiento consistente
    tasks.forEach((task) => {
      // Cancelar cualquier timer anterior (esto también limpia timerState de la tarea activa)
      store.cancelPomodoro()
      // La tarea que estaba activa ahora tiene timerState = null, pero otras no se afectan

      // Iniciar pomodoro en esta tarea
      store.startPomodoro(task.id)

      // Verificar que el estado global refleja la tarea correcta
      expect(store.pomodoro.taskId).toBe(task.id)
      expect(store.pomodoro.phase).toBe('work')
      expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)

      // Verificar que se creó timerState
      expect(task.timerState).not.toBeNull()
      expect(task.timerState!.phase).toBe('work')
      expect(task.timerState!.secondsLeft).toBe(WORK_DURATION_SECONDS)
    })
  })

  it('Property 4 (PBT): Comportamiento consistente - cada tarea inicia fresco', () => {
    // Este test verifica que cada tarea, independientemente de cuántas tareas existan,
    // inicia con timer fresco cuando startPomodoro es llamado en ella
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 10 }), (numTasks) => {
        setActivePinia(createPinia())
        localStorage.clear()
        const store = useTodoStore()

        // Crear múltiples tareas
        for (let i = 0; i < numTasks; i++) {
          store.addTask(`Task ${i}`)
        }

        // Seleccionar la última tarea creada
        const task = store.activeTasks[0]

        // Verificar precondición: tarea no tiene timerState
        expect(task.timerState).toBeNull()

        // Iniciar pomodoro en esta tarea
        store.startPomodoro(task.id)

        // Verificar postcondiciones
        expect(store.pomodoro.taskId).toBe(task.id)
        expect(store.pomodoro.phase).toBe('work')
        expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)
        expect(task.timerState).not.toBeNull()
        expect(task.timerState!.phase).toBe('work')
        expect(task.timerState!.secondsLeft).toBe(WORK_DURATION_SECONDS)
      }),
      { numRuns: 30 },
    )
  })

  /**
   * Property 5: Sincronización estado global con timerState
   * Después de startPomodoro sin timerState existente:
   * - El estado global pomodoro debe sincronizarse con timerState creado
   * - Ambos deben tener los mismos valores
   */
  it('Property 5: Estado global sincronizado con timerState creado', () => {
    const store = useTodoStore()
    store.addTask('Test task')
    const task = store.activeTasks[0]

    store.startPomodoro(task.id)

    // El estado global debe coincidir con timerState
    expect(store.pomodoro.phase).toBe(task.timerState!.phase)
    expect(store.pomodoro.secondsLeft).toBe(task.timerState!.secondsLeft)
    expect(store.pomodoro.taskId).toBe(task.id)
  })

  it('Property 5 (PBT): Sincronización consistente estado global y timerState', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (numTasks) => {
        setActivePinia(createPinia())
        localStorage.clear()
        const store = useTodoStore()

        for (let i = 0; i < numTasks; i++) {
          store.addTask(`Task ${i}`)
        }

        const task = store.activeTasks[0]

        store.startPomodoro(task.id)

        // Verificar sincronización
        expect(store.pomodoro.phase).toBe(task.timerState!.phase)
        expect(store.pomodoro.secondsLeft).toBe(task.timerState!.secondsLeft)
        expect(store.pomodoro.taskId).toBe(task.id)
      }),
      { numRuns: 30 },
    )
  })
})