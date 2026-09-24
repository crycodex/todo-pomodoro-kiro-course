-- Drop RLS policies that depend on owner_id
DROP POLICY IF EXISTS "Users can read their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Remove owner_id column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS owner_id;
