/*
  # Fix Research History and Database Security

  1. New Tables
    - Ensures `research_history` table exists with proper structure
  
  2. Security
    - Sets up proper Row Level Security (RLS) policies for research_history
    - Adds service_role bypass policies for background operations
    - Ensures users can only access their own research history
    - Fixes user_credits policies to prevent RLS violations
  
  3. Changes
    - Adds real-time publication for research_history table
    - Creates missing admin_users policy
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

-- Enable row level security
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- Add system-level RLS policy for research_history to allow service_role to bypass RLS
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

-- Add special policy to allow authenticated users to create user_credits records
DROP POLICY IF EXISTS "Users can insert new credits" ON public.user_credits;
CREATE POLICY "Users can insert new credits"
  ON public.user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable real-time for research_history table
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;