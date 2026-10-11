# Requirements Document: Task Filtering and Kanban View

## Introduction

This feature enhances the todo-pom application by adding task filtering capabilities and a Kanban view mode. Users will be able to categorize tasks with types, priorities, and additional metadata, then view and manage them using either a traditional list view or a Kanban board view with drag-and-drop functionality.

## Glossary

- **System/TodoPom**: The Vue 3 application combining task management with Pomodoro technique timing
- **Task**: A unit of work with title, status, and metadata including type, priority, due date, and tags
- **Category/Type**: A user-defined classification for tasks (e.g., Work, Personal, Study, Health)
- **Priority**: The importance level of a task (Low, Medium, High, Critical)
- **Due Date**: The optional deadline for completing a task
- **Tag**: A user-defined label that can be applied to multiple tasks for grouping
- **Kanban View**: A visual task management board with columns representing workflow stages
- **Filter**: A UI control that determines which tasks are displayed based on their attributes
- **Drag and Drop**: An interaction pattern for moving tasks between columns by clicking and dragging

## Requirements

### Requirement 1: Task Category/Type Filter

**User Story:** As a user, I want to filter tasks by their category/type so that I can focus on specific areas of my life or work.

#### Acceptance Criteria

1. WHEN a filter selection is made, THE System SHALL display only tasks matching the selected category/type
2. WHEN no filter is active, THE System SHALL display all tasks regardless of category/type
3. WHERE a custom category exists, THE System SHALL include it in the filter dropdown
4. WHILE in Kanban view, THE System SHALL apply the same category filter to all columns

### Requirement 2: Task Priority Filter

**User Story:** As a user, I want to filter tasks by priority so that I can focus on high-importance items first.

#### Acceptance Criteria

1. WHEN a priority filter is applied, THE System SHALL display only tasks with the selected priority level
2. WHEN multiple priority levels are selected, THE System SHALL display tasks matching any of the selected priorities
3. WHERE no priorities are selected, THE System SHALL display all tasks regardless of priority

### Requirement 3: Due Date Filter

**User Story:** As a user, I want to filter tasks by due date so that I can focus on items requiring immediate attention.

#### Acceptance Criteria

1. WHEN a due date filter is applied, THE System SHALL display only tasks matching the selected date range
2. THE System SHALL support filtering by: No due date, Today, This week, This month, Overdue
3. WHERE a due date is in the past and the task is not completed, THE System SHALL classify it as overdue

### Requirement 4: Tag-Based Filter

**User Story:** As a user, I want to filter tasks by tags so that I can group tasks across different categories.

#### Acceptance Criteria

1. WHEN a tag filter is applied, THE System SHALL display only tasks containing the selected tag
2. WHEN multiple tags are selected, THE System SHALL display tasks containing any of the selected tags
3. WHERE no tags are selected, THE System SHALL display all tasks regardless of tags

### Requirement 5: Category/Type Input and Storage

**User Story:** As a user, I want to assign categories to my tasks so that I can organize and filter them effectively.

#### Acceptance Criteria

1. WHEN a task is created or edited, THE System SHALL allow selection of a category from predefined and custom categories
2. THE System SHALL support at least five default categories: Work, Personal, Study, Health, Other
3. WHERE a user enters a new category name, THE System SHALL add it to the available categories for future use
4. WHILE viewing task details, THE System SHALL display the assigned category clearly

### Requirement 6: Priority Input and Display

**User Story:** As a user, I want to set priority levels for my tasks so that I can distinguish urgent items.

#### Acceptance Criteria

1. WHEN a task is created or edited, THE System SHALL allow selection of a priority level
2. THE System SHALL support four priority levels: Low, Medium, High, Critical
3. WHERE a priority is selected, THE System SHALL display a visual indicator in both list and Kanban views
4. IN Kanban view, THE System SHALL use color coding to differentiate tasks by priority level

### Requirement 7: Description Field

**User Story:** As a user, I want to add detailed descriptions to my tasks so that I can capture more information than the title allows.

#### Acceptance Criteria

1. WHEN a task is created or edited, THE System SHALL provide a description textarea field
2. WHERE a description is provided, THE System SHALL display it in task details view
3. THE System SHALL support at least 500 characters in the description field
4. IN list view, THE System SHALL show a truncated version of the description when space permits

### Requirement 8: Due Date Input and Display

**User Story:** As a user, I want to set due dates for my tasks so that I can track deadlines.

#### Acceptance Criteria

1. WHEN a task is created or edited, THE System SHALL allow selection of an optional due date
2. WHERE a due date is set, THE System SHALL display it in task details and list views
3. THE System SHALL provide visual indication when a task's due date has passed and the task is not completed
4. WHEN a task's due date is approaching within 24 hours, THE System SHALL display an urgency indicator

### Requirement 9: Tag Input and Management

**User Story:** As a user, I want to add and manage tags for my tasks so that I can create custom groupings.

#### Acceptance Criteria

1. WHEN a task is created or edited, THE System SHALL allow adding multiple tags
2. WHERE a tag is added, THE System SHALL suggest previously used tags as autocomplete
3. THE System SHALL allow removing individual tags from tasks
4. WHERE tags exist, THE System SHALL provide a tag-based filter view

### Requirement 10: Kanban View Toggle

**User Story:** As a user, I want to toggle between list and Kanban views so that I can choose the layout that best suits my workflow.

#### Acceptance Criteria

1. WHEN a view toggle control is activated, THE System SHALL switch between list and Kanban views
2. THE System SHALL persist the selected view mode across page reloads
3. WHERE tasks exist, THE System SHALL display them in the selected view mode
4. WHILE in Kanban view, THE System SHALL hide list-specific UI elements

### Requirement 11: Kanban Columns

**User Story:** As a user, I want tasks organized in columns so that I can visualize my workflow progression.

#### Acceptance Criteria

1. THE System SHALL provide default columns: To Do, In Progress, Done
2. WHERE a task is added, THE System SHALL place it in the To Do column by default (TaskStatus = 'todo')
3. WHILE in Kanban view, THE System SHALL display tasks in their respective columns
4. WHEN a task is completed, THE System SHALL move it to the Done column

### Requirement 12: Drag and Drop in Kanban

**User Story:** As a user, I want to drag and drop tasks between columns so that I can easily update task status.

#### Acceptance Criteria

1. WHEN a task is dragged, THE System SHALL display a visual ghost of the task being moved
2. WHEN a task is dropped on a column, THE System SHALL update the task's status accordingly
3. WHERE dragging is not supported (e.g., mobile), THE System SHALL provide alternative interaction methods
4. IN Kanban view, THE System SHALL support dropping tasks on any column with visual feedback

### Requirement 13: Priority Visualization in Kanban

**User Story:** As a user, I want priority indicators in Kanban view so that I can quickly identify urgent tasks.

#### Acceptance Criteria

1. IN Kanban view, THE System SHALL display a colored border or bar for each task based on its priority
2. THE System SHALL use distinct colors for each priority level: Low (blue), Medium (green), High (orange), Critical (red)
3. WHERE a task has multiple visual elements, THE System SHALL ensure priority indicators remain visible and clear
4. IN Kanban view on touch devices, THE System SHALL always show priority indicator without requiring hover interaction

### Requirement 14: Responsive Kanban Design

**User Story:** As a mobile user, I want Kanban columns to be scrollable so that I can access all tasks on smaller screens.

#### Acceptance Criteria

1. WHERE the viewport width is less than 768 pixels, THE System SHALL enable horizontal scrolling for Kanban columns
2. THE System SHALL maintain at least 80% column width on mobile devices
3. IN responsive mode, THE System SHALL stack columns vertically by default, with optional horizontal scroll toggle
4. WHEN switching views on mobile, THE System SHALL preserve scroll position

### Requirement 15: State Persistence Across Views

**User Story:** As a user, I want my filters and view selection to persist so that I don't lose my workspace configuration.

#### Acceptance Criteria

1. WHEN page is reloaded, THE System SHALL restore the last used filter settings
2. WHERE filters were active, THE System SHALL reapply them after page reload
3. WHEN view mode is changed, THE System SHALL persist the selection in localStorage
4. THE System SHALL maintain filter and view state independently

### Requirement 16: Accessibility in Kanban View

**User Story:** As a keyboard-only user, I want to navigate and interact with Kanban tasks without a mouse so that I can manage my tasks effectively.

#### Acceptance Criteria

1. WHERE drag and drop is not available, THE System SHALL provide keyboard shortcuts (Cmd/Ctrl + arrows) for moving tasks between columns
2. IN Kanban view, THE System SHALL ensure all interactive elements are focusable and keyboard-navigable
3. WHEN a task is focused, THE System SHALL provide ARIA labels describing the task and available actions
4. THE System SHALL support screen reader navigation of Kanban columns in logical order and be tested with VoiceOver on iOS Safari

### Requirement 17: Data Model Extensions for New Fields

**User Story:** As a developer, I want the Task data model extended so that it supports all new fields.

#### Acceptance Criteria

1. THE System SHALL extend the Task type to include: category, priority, description, dueDate, and tags
2. WHERE the Task type is persisted, THE System SHALL include all new fields in the serialized state
3. IN Supabase sync, THE System SHALL include categories in localStorage only (no categories table for MVP)
4. WHERE existing tasks are loaded, THE System SHALL provide default values for new optional fields

### Requirement 18: Category Storage and Reuse (MVP)

**User Story:** As a user, I want my custom categories to be saved so that I don't need to recreate them.

#### Acceptance Criteria

1. WHEN a new category is created, THE System SHALL add it to the persistent category list
2. THE System SHALL persist categories in localStorage only (no Supabase sync for MVP)
3. WHERE categories exist, THE System SHALL load them on application startup
4. THE System SHALL allow removal of unused custom categories

### Requirement 19: Filter UI Visibility and Clarity

**User Story:** As a user, I want clear filter UI controls so that I can easily apply and modify filters.

#### Acceptance Criteria

1. THE System SHALL provide a visible filter section in the main view
2. WHERE filters are active, THE System SHALL display active filter chips or badges
3. WHEN a filter chip is clicked, THE System SHALL open the filter editor with that filter pre-selected
4. WHERE multiple filters are active, THE System SHALL allow removing individual filters without clearing all

### Requirement 20: Visual Feedback for Drag Operations

**User Story:** As a user, I want visual feedback during drag operations so that I know where a task will be dropped.

#### Acceptance Criteria

1. WHEN dragging a task over a column, THE System SHALL highlight the drop target column
2. THE System SHALL show a dashed border or color indicator for valid drop zones
3. WHERE dragging is not valid, THE System SHALL display a "not allowed" cursor or indicator
4. WHEN dropping a task, THE System SHALL provide immediate visual confirmation of the move

### Requirement 21: Task Field Validation

**User Story:** As a user, I want to ensure my task data is valid so that I don't save incomplete or overly long information.

#### Acceptance Criteria

1. WHEN a task description exceeds 500 characters, THE System SHALL prevent submission and display an error message
2. WHERE a tag exceeds 50 characters, THE System SHALL truncate it to 50 characters or display an error message
3. THE System SHALL validate description and tags before saving any task updates
4. IN task editing mode, THE System SHALL provide real-time character count feedback

### Requirement 22: Mobile Drag & Drop Alternatives

**User Story:** As a mobile user, I want alternative ways to move tasks between columns so that I can use the Kanban view on touch devices.

#### Acceptance Criteria

1. WHEN drag and drop is not supported, THE System SHALL display a column selection dropdown for each task
2. WHEN a long-press gesture is detected on a task, THE System SHALL show a modal with column options
3. WHERE the modal is opened, THE System SHALL provide clear visual feedback that task movement is in progress
4. WHEN a column is selected from the dropdown or modal, THE System SHALL update the task's column immediately

### Requirement 22.5: Mobile Touch Detection

**User Story:** As a mobile user, I want the system to automatically detect touch capability so that appropriate interaction methods are used without manual configuration.

#### Acceptance Criteria

1. WHEN a user visits the application on a touch device, THE System SHALL detect touch capability and show either column selection dropdown or long-press modal as fallback
2. WHEN a long-press gesture is detected on a task (pointerdown >= 500ms on touch device), THE System SHALL open a modal with column options
3. WHERE touch capability is not detected, THE System SHALL use standard drag-and-drop interaction
4. THE System SHALL use Pointer Events API with touchstart/touchend timing to detect long-press gestures

### Requirement 23: Tag Autocomplete

**User Story:** As a user, I want tag suggestions while typing so that I can quickly add existing tags without retyping.

#### Acceptance Criteria

1. WHEN a user types in the tag input field, THE System SHALL display the top 10 matching suggestions ordered by recent usage frequency
2. WHERE no suggestions match the typed text, THE System SHALL show a "Create new tag" option
3. WHERE a suggestion is selected, THE System SHALL add it to the tag list immediately
4. THE System SHALL order suggestions by frequency of recent usage, with most recent at the top

### Requirement 24: Filter Combination Logic

**User Story:** As a user, I want to combine multiple filters so that I can narrow down tasks precisely.

#### Acceptance Criteria

1. WHEN multiple filters of the same type are active (e.g., multiple priorities), THE System SHALL use OR logic to match tasks
2. WHEN filters of different types are active (e.g., category + priority), THE System SHALL use AND logic to match tasks
3. WHERE no filters are active, THE System SHALL display all tasks regardless of attributes
4. THE System SHALL apply filters in the following order: category (AND) → priority (OR) → due date (AND) → tags (OR)

### Requirement 25: Urgency Indicator

**User Story:** As a user, I want to identify urgent tasks at a glance so that I can prioritize time-sensitive items.

#### Acceptance Criteria

1. WHERE a task's due date is within the next 24 hours and the task is not completed, THE System SHALL display a yellow background on the task card
2. THE System SHALL display a ⏰ icon alongside the urgency indicator
3. IN Kanban view, THE System SHALL show the urgency indicator on the task card itself
4. IN list view, THE System SHALL show the urgency indicator beside the task title

### Requirement 26: Mobile Kanban Layout Strategy

**User Story:** As a mobile user, I want Kanban columns to adapt to screen size so that I can efficiently manage tasks on small screens.

#### Acceptance Criteria

1. WHERE the viewport width is less than 768 pixels, THE System SHALL stack columns vertically by default
2. WHEN a horizontal scroll toggle button is activated, THE System SHALL switch to horizontal scrolling mode
3. THE System SHALL remember the user's preferred layout mode across page reloads
4. IN vertical stacking mode, THE System SHALL allow swiping between columns on touch devices

### Requirement 27: Mobile Tooltip Behavior

**User Story:** As a mobile user, I want to see priority information without hovering so that I can understand task importance on touch devices.

#### Acceptance Criteria

1. IN Kanban view on touch devices, THE System SHALL always display priority indicators without requiring hover interaction
2. WHERE priority information is needed, THE System SHALL show a static label instead of a hover tooltip
3. THE System SHALL detect touch capability and adjust UI behavior accordingly
4. WHERE screen real estate is limited, THE System SHALL prioritize showing priority color over detailed text labels