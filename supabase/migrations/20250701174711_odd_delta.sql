/*
  # Fix Research History and Related Functionality
  
  1. New Tables
    - Ensures research_history table exists with proper structure
  
  2. Security
    - Adds proper RLS policies for research_history
    - Adds service_role bypass policies for system operations
    - Fixes user access permissions
  
  3. Changes
    - Enables realtime for research_history table
    - Adds updated_at trigger for research_history
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
DROP POLICY IF EXISTS "Admins can read all research history" ON public.research_history;

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

-- Create admin policy to read all research history
CREATE POLICY "Admins can read all research history"
  ON public.research_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

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

-- Enable realtime for research_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;