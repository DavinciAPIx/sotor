/*
  # Fix Admin Panel Data Fetching Issues

  1. Fix RPC Functions
    - Recreate get_all_users_with_profiles function
    - Fix get_all_user_emails function
    - Add proper error handling

  2. Security
    - Ensure proper RLS policies for admin access
    - Add missing admin policies

  3. Functions
    - Add comprehensive admin data access functions
*/

-- Drop and recreate get_all_users_with_profiles function
DROP FUNCTION IF EXISTS public.get_all_users_with_profiles();

CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  email text,
  is_admin boolean
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(p.id, au.id) as id,
    p.full_name,
    p.avatar_url,
    au.email,
    CASE WHEN admin_users.id IS NOT NULL THEN true ELSE false END as is_admin
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN public.admin_users ON au.id = admin_users.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO authenticated;

-- Fix get_all_user_emails function
DROP FUNCTION IF EXISTS public.get_all_user_emails();

CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (id uuid, email text) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  ) THEN
    -- Return all user emails for admin
    RETURN QUERY 
    SELECT auth.users.id, auth.users.email 
    FROM auth.users 
    ORDER BY auth.users.created_at DESC;
  ELSE
    -- For non-admins, return only their own email
    RETURN QUERY 
    SELECT auth.users.id, auth.users.email 
    FROM auth.users 
    WHERE auth.users.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO authenticated;

-- Add comprehensive admin policies for all tables
-- Admin policies for profiles table
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin policies for user_credits table
DROP POLICY IF EXISTS "Admins can manage all user credits" ON public.user_credits;
CREATE POLICY "Admins can manage all user credits"
  ON public.user_credits
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin policies for transactions table
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Admins can manage all transactions"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin policies for research_history table
DROP POLICY IF EXISTS "Admins can manage all research history" ON public.research_history;
CREATE POLICY "Admins can manage all research history"
  ON public.research_history
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin policies for credit_transactions table
DROP POLICY IF EXISTS "Admins can manage all credit transactions" ON public.credit_transactions;
CREATE POLICY "Admins can manage all credit transactions"
  ON public.credit_transactions
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin policies for credit_transfers table
DROP POLICY IF EXISTS "Admins can manage all credit transfers" ON public.credit_transfers;
CREATE POLICY "Admins can manage all credit transfers"
  ON public.credit_transfers
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin policies for app_settings table
DROP POLICY IF EXISTS "Admins can manage all app settings" ON public.app_settings;
CREATE POLICY "Admins can manage all app settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Create function to get admin statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  total_credits bigint,
  total_researches bigint,
  total_revenue bigint,
  new_users_today bigint,
  researches_today bigint
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COALESCE(SUM(balance), 0) FROM public.user_credits) as total_credits,
    (SELECT COUNT(*) FROM public.research_history) as total_researches,
    (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM public.research_history WHERE created_at >= CURRENT_DATE) as researches_today;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- Create function to get research cost
CREATE OR REPLACE FUNCTION public.get_research_cost()
RETURNS TABLE (cost integer)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ((value->>'cost')::integer) as cost
  FROM public.app_settings 
  WHERE id = 'research_cost';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_research_cost() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_research_cost() TO anon;

-- Ensure all admin users exist
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Add imvuveteran@gmail.com as admin
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'imvuveteran@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now())
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Add cherifhoucine91@gmail.com as admin
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;