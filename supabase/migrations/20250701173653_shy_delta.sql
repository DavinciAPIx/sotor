-- # Fix Missing Tables and RLS Policies
--
-- 1. Create research_history table if it doesn't exist
-- 2. Ensure RLS policies allow proper access to tables
-- 3. Add service_role policies to bypass RLS for internal functions

-- Ensure research_history table exists with proper structure
CREATE TABLE IF NOT EXISTS public.research_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure proper RLS is enabled
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- Add system-level RLS policy for research_history
DROP POLICY IF EXISTS "System can manage research history" ON public.research_history;
CREATE POLICY "System can manage research history"
  ON public.research_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix RLS policies for research_history
DROP POLICY IF EXISTS "Users can read own research history" ON public.research_history;
CREATE POLICY "Users can read own research history"
  ON public.research_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own research history" ON public.research_history;
CREATE POLICY "Users can insert own research history"
  ON public.research_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own research history" ON public.research_history;
CREATE POLICY "Users can update own research history"
  ON public.research_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add system-level RLS policy for user_credits
DROP POLICY IF EXISTS "System can manage user credits" ON public.user_credits;
CREATE POLICY "System can manage user credits"
  ON public.user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add users can insert ANY user_credits for bootstrapping
DROP POLICY IF EXISTS "Users can insert new credits" ON public.user_credits;
CREATE POLICY "Users can insert new credits"
  ON public.user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable real-time for the research_history table
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;