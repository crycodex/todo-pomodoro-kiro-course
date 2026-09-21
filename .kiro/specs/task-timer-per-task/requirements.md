# Requirements Document

## Introduction

This document defines requirements for per-task Pomodoro timer functionality in the todo-pomodoro application. Currently, the timer state is stored globally in the store, which causes timer state loss when switching between tasks. Each task shall maintain its own independent timer state, allowing users to pause a timer on one task and resume it later without losing progress.

## Glossary

- **Task**: A todo item with title, completion status, and timer state
- **Timer State**: The phase (work, break, paused-work, paused-break, idle) and seconds remaining for a specific task
- **Active Task**: The task currently selected for timer display in the PomodoroOverlay
- **Paused Timer**: A timer that has been interrupted by switching to another task

## Requirements

### 1. Timer State Per invoke_sub_agent

**User Story:** As a user, I want each task to remember its own timer state so that I can switch between tasks without losing my progress.

#### Acceptance Criteria

1. WHEN a user starts a Pomodoro on a task, THE TimerState SHALL be stored within that task's data structure.
2. WHEN a user starts a Pomodoro on a different task, THE previous task's timer SHALL remain in its last phase with the remaining seconds preserved.
3. WHEN a user switches to a task that has an active or paused timer, THE PomodoroOverlay SHALL display that task's stored timer state.
4. WHEN a task is deleted, THE TimerState stored in that task SHALL be removed.

---

### 2. Timer Pause on invoke_sub_agent Switch

**User Story:** As a user, I want timers to pause automatically when I switch to a different task so that I can easily manage multiple tasks without losing timer context.

#### Acceptance Criteria

1. WHEN startPomodoro is called for Task B while Task A has an active or paused timer, THE TimerState in Task A SHALL be preserved with the current phase and seconds remaining.
2. WHEN startPomodoro is called for Task B, THE global PomodoroState SHALL reference Task B, and Task B's TimerState SHALL be set to work phase with WORK_DURATION_SECONDS.
3. WHEN the user navigates away from a running timer (e.g., by starting another task), THE original timer SHALL NOT be cancelled—it SHALL remain in its last phase and maintain its remaining seconds.

---

### 3. Visual Indicator for Paused Timers

**User Story:** As a user, I want to see which tasks have paused timers so that I can easily identify and resume them.

#### Acceptance Criteria

1. WHEN a task has a TimerState with phase different from 'idle', THE TaskItem SHALL display a visual indicator that the task has an associated timer.
2. WHERE a task's TimerState phase is 'paused-work' or 'paused-break', THE TaskItem SHALL display a distinctive visual indicator (e.g., paused icon or highlighted border).
3. WHERE a task's TimerState phase is 'work' or 'break', THE TaskItem SHALL display a running indicator to show the timer is active.
4. THE visual indicator SHALL be positioned in the task item actions area without interfering with existing checkbox and actions.

---

### 4. Timer State Type Definition

**User Story:** As a developer, I want the TimerState to be part of the invoke_sub_agent type definition so that the state is persisted with the task data.

#### Acceptance Criteria

1. THE invoke_sub_agent interface in `src/types/index.ts` SHALL include a timerState property of type `TimerState | null`.
2. THE TimerState type SHALL contain phase and secondsLeft properties.
3. WHERE a task has no active timer, THE timerState property SHALL be null.
4. THE new TimerState type SHALL be defined alongside existing types and exported for use in components and store.

---

### 5. Timer Persistence and Restore

**User Story:** As a user, I want my task timer states to persist across browser sessions so that I can continue working on tasks after closing and reopening the application.

#### Acceptance Criteria

1. WHEN the application saves state to storage, THE timerState property of each task SHALL be included in the saved data.
2. WHEN the application loads state from storage, THE timerState property of each task SHALL be restored.
3. WHEN the application starts with stored timer states, THE tasks with non-null timerState SHALL display appropriate visual indicators in the list.
4. WHERE the global PomodoroState taskId matches a task with a non-null timerState, THE PomodoroOverlay SHALL display that task's stored timer state.

---

### 6. Global Pomodoro State Sync

**User Story:** As a user, I want the global timer state to stay synchronized with the active task's timer state so that timer controls work consistently.

#### Acceptance Criteria

1. THE global PomodoroState SHALL continue to exist for managing the active timer interval and visibility handling.
2. WHERE the active task has a non-null timerState, THE global PomodoroState phase and secondsLeft SHALL match the task's timerState.
3. WHEN pausePomodoro is called, THE global PomodoroState phase SHALL update AND the active task's timerState phase SHALL also update.
4. WHEN resumePomodoro is called, THE global PomodoroState phase SHALL update AND the active task's timerState phase SHALL also update.
5. WHEN a Pomodoro cycle completes (work ends), THE global PomodoroState phase SHALL update to break AND the active task's timerState phase SHALL also update.