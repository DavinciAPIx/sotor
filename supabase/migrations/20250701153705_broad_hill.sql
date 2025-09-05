/*
  # Create research history table

  1. New Tables
    - `research_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text) - stores the Google Docs URL
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `research_history` table
    - Add policies for users to manage their own research history
*/

CREATE TABLE IF NOT EXISTS research_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL, -- stores the Google Docs URL
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE research_history ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own research history
CREATE POLICY "Users can read own research history"
  ON research_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own research history
CREATE POLICY "Users can insert own research history"
  ON research_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own research history
CREATE POLICY "Users can update own research history"
  ON research_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own research history
CREATE POLICY "Users can delete own research history"
  ON research_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on research_history
CREATE TRIGGER update_research_history_updated_at
  BEFORE UPDATE ON research_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();