# Bugfix Requirements Document

## Introduction

When a user starts a Pomodoro timer on one task and then switches to a different task, the timer resets to the full duration instead of preserving the progress of each task. This prevents users from working on multiple tasks with independent timer sessions throughout their workday. The bug affects task productivity tracking and disrupts workflow continuity.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN startPomodoro is called on a different task while another task's timer is active THEN the new task's timer starts with a full 25-minute duration regardless of whether the new task had a previously saved timerState

1.2 WHEN the user switches from Task A to Task B THEN Task A's timerState is technically saved but the global timer is reset, making it appear as if the original task's progress was lost

1.3 WHEN startPomodoro is called on a task that already has an incomplete timerState THEN the timer ignores the saved state and resets to WORK_DURATION_SECONDS

### Expected Behavior (Correct)

2.1 WHEN startPomodoro is called on Task B while Task A's timer is active THEN Task A's timerState SHALL be preserved exactly as it was (phase, secondsLeft, etc.) and Task B SHALL resume from its saved timerState or start fresh if no timerState exists

2.2 WHEN a user switches between tasks multiple times THEN each task SHALL maintain its own independent timerState that persists across switches until the task's pomodoro cycle completes

2.3 WHEN startPomodoro is called on a task that has an existing timerState THEN the timer SHALL resume from the saved state (secondsLeft and phase) instead of resetting

2.4 WHEN the global pomodoro state is active on Task A and Task B is selected THEN the overlay SHALL display Task B's timerState if it exists, or a fresh timer if Task B has not been started

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a task's pomodoro cycle completes (work phase ends) THEN the system SHALL continue to trigger break mode and increment pomodoroCount as before

3.2 WHEN the user explicitly cancels a pomodoro THEN the timerState SHALL be cleared and reset to null for that task

3.3 WHEN the user pauses a timer THEN the paused state SHALL be saved in both global pomodoro and task.timerState

3.4 WHEN storage persistence is enabled THEN all timerState data SHALL continue to be saved and restored between sessions