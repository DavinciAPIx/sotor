/*
  # Fix get_all_users_with_profiles Function Return Type

  1. Drop the existing function first to avoid return type conflict
  2. Recreate the function with the correct return type
  3. Grant proper permissions
*/

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.get_all_users_with_profiles();

-- Recreate the function with the correct return type
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
    p.id,
    p.full_name,
    p.avatar_url,
    au.email,
    CASE WHEN admin_users.id IS NOT NULL THEN true ELSE false END as is_admin
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.admin_users ON p.id = admin_users.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO authenticated;