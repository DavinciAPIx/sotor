-- # Fix Research History and RLS Policies
--
-- 1. Ensure research_history table exists with proper structure
-- 2. Add system-level RLS policies to allow service_role to bypass RLS
-- 3. Fix user_credits RLS policies to allow proper credit management
-- 4. Add missing admin_users RLS policy

-- Ensure research_history table exists
CREATE TABLE IF NOT EXISTS public.research_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add system-level RLS policy for research_history
CREATE POLICY "System can manage research history"
  ON public.research_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add system-level RLS policy for user_credits
CREATE POLICY "System can manage user credits"
  ON public.user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add system-level RLS policy for transactions
CREATE POLICY "System can manage transactions"
  ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add system-level RLS policy for admin_users
CREATE POLICY "System can manage admin users"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add missing admin_users policy for admins
CREATE POLICY "Admins can manage admin users"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Ensure all tables are in realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;