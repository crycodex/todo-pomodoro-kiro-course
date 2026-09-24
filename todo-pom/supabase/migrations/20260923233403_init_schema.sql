-- CreateTable: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) <= 255),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  pomodoro_count INTEGER DEFAULT 0,
  timer_state JSONB
);

-- Disable Row Level Security (RLS) for open write access
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
