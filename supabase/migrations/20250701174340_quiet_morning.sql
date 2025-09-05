/*
  # Fix Research History Table and Security Issues
  
  1. Tables
     - Ensure research_history table exists with proper structure
     - Add updated_at trigger for research_history
  
  2. Security
     - Enable RLS on research_history
     - Add proper policies for users to access their own research history
     - Add service role policy to bypass RLS for system functions
  
  3. Realtime
     - Add research_history to realtime publication
*/

-- Ensure research_history table exists with proper structure
CREATE TABLE IF NOT EXISTS public.research_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Make sure RLS is enabled
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own research history" ON public.research_history;
DROP POLICY IF EXISTS "Users can insert own research history" ON public.research_history;
DROP POLICY IF EXISTS "Users can update own research history" ON public.research_history;
DROP POLICY IF EXISTS "System can manage research history" ON public.research_history;

-- Create user policies for research_history
CREATE POLICY "Users can read own research history"
  ON public.research_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research history"
  ON public.research_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research history"
  ON public.research_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create system policy to bypass RLS for service_role
CREATE POLICY "System can manage research history"
  ON public.research_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS handle_updated_at_research_history ON public.research_history;
CREATE TRIGGER handle_updated_at_research_history
  BEFORE UPDATE ON public.research_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fix user_credits policies for proper access
DROP POLICY IF EXISTS "System can manage user credits" ON public.user_credits;
CREATE POLICY "System can manage user credits"
  ON public.user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for research_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;