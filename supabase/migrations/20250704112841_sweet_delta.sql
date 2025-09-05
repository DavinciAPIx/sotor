/*
  # Fix Type Casting Issues in Database Functions
  
  1. Fixes
    - Fix type mismatch errors in admin functions
    - Ensure proper UUID/text casting
    - Fix operator issues
  
  2. Changes
    - Update get_all_users_with_profiles function
    - Fix admin user checks
    - Ensure proper type handling
*/

-- Drop and recreate get_all_users_with_profiles function with proper type handling
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
  -- Check if the caller is an admin using proper UUID comparison
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  ) THEN
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

-- Fix get_all_user_emails function with proper type handling
DROP FUNCTION IF EXISTS public.get_all_user_emails();

CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (id uuid, email text) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin using proper UUID comparison
  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  ) THEN
    -- Return all user emails for admin
    RETURN QUERY 
    SELECT au.id, au.email 
    FROM auth.users au
    ORDER BY au.created_at DESC;
  ELSE
    -- For non-admins, return only their own email
    RETURN QUERY 
    SELECT au.id, au.email 
    FROM auth.users au
    WHERE au.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO authenticated;

-- Fix get_admin_stats function with proper type handling
DROP FUNCTION IF EXISTS public.get_admin_stats();

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
  -- Check if the caller is an admin using proper UUID comparison
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COALESCE(SUM(balance), 0) FROM public.user_credits)::bigint as total_credits,
    (SELECT COUNT(*) FROM public.research_history)::bigint as total_researches,
    (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE status = 'paid')::bigint as total_revenue,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE)::bigint as new_users_today,
    (SELECT COUNT(*) FROM public.research_history WHERE created_at >= CURRENT_DATE)::bigint as researches_today;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- Fix get_research_cost function
DROP FUNCTION IF EXISTS public.get_research_cost();

CREATE OR REPLACE FUNCTION public.get_research_cost()
RETURNS TABLE (cost integer)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE((value->>'cost')::integer, 0) as cost
  FROM public.app_settings 
  WHERE id = 'research_cost'
  LIMIT 1;
  
  -- If no result, return default
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0 as cost;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_research_cost() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_research_cost() TO anon;

-- Fix auto_add_admin function with proper type handling
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user should be an admin using proper text comparison
  IF NEW.email = 'cherifhoucine91@gmail.com' OR NEW.email = 'imvuveteran@gmail.com' THEN
    -- Check if already an admin using proper UUID comparison
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = NEW.id
    ) THEN
      INSERT INTO public.admin_users (id, created_at)
      VALUES (NEW.id, now());
      RAISE NOTICE 'Auto-added admin user: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS auto_add_admin_trigger ON auth.users;

-- Recreate trigger for auto_add_admin
CREATE TRIGGER auto_add_admin_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_add_admin();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;

-- Fix is_admin function with proper type handling
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = user_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Ensure admin users exist with proper error handling
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Add imvuveteran@gmail.com as admin
    SELECT au.id INTO admin_user_id 
    FROM auth.users au
    WHERE au.email = 'imvuveteran@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = admin_user_id) THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now());
        RAISE NOTICE 'Added admin user: %', admin_user_id;
      END IF;
    END IF;
    
    -- Add cherifhoucine91@gmail.com as admin
    SELECT au.id INTO admin_user_id 
    FROM auth.users au
    WHERE au.email = 'cherifhoucine91@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = admin_user_id) THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now());
        RAISE NOTICE 'Added admin user: %', admin_user_id;
      END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding admin users: %', SQLERRM;
END $$;