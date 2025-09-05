/*
  # Fix RLS Policies and Ensure Proper Table Setup
  
  1. New Tables
    - Ensures user_credits table exists with proper structure
    - Ensures research_history table exists with proper structure
  
  2. Security
    - Fixes RLS policies for user_credits to prevent conflicts
    - Maintains proper RLS policies for research_history
    - Adds service_role bypass policies for system operations
  
  3. Changes
    - Removes conflicting RLS policy on user_credits
    - Ensures proper user credit creation flow
    - Enables realtime for both tables
    - Adds updated_at triggers
*/

-- Ensure user_credits table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Make sure RLS is enabled for user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert new credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "System can manage user credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admins can read all user credits" ON public.user_credits;

-- Create proper user policies for user_credits (without the conflicting policy)
CREATE POLICY "Users can read own credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON public.user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create admin policy to read all user credits
CREATE POLICY "Admins can read all user credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Create system policy to bypass RLS for service_role
CREATE POLICY "System can manage user credits"
  ON public.user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure research_history table exists with proper structure
CREATE TABLE IF NOT EXISTS public.research_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Make sure RLS is enabled for research_history
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

-- Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure updated_at triggers exist
DROP TRIGGER IF EXISTS handle_updated_at_user_credits ON public.user_credits;
CREATE TRIGGER handle_updated_at_user_credits
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_research_history ON public.research_history;
CREATE TRIGGER handle_updated_at_research_history
  BEFORE UPDATE ON public.research_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;

-- Ensure handle_new_user function exists for automatic user credit creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists for automatic user credit creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();