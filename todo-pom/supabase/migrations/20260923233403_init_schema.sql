-- CreateTable: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 255),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  pomodoro_count INTEGER DEFAULT 0,
  timer_state JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can read their own tasks
CREATE POLICY "Users can read their own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create RLS policy: Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Create RLS policy: Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Create RLS policy: Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
