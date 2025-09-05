/*
  # Create function to get all users with profiles

  1. Functions
    - `get_all_users_with_profiles` - Returns user data with profiles for admin use
    - `get_all_user_emails` - Returns user emails for admin use (already exists but ensuring it's here)

  2. Security
    - Functions are security definer and check admin permissions
*/

-- Function to get all users with their profiles (for admin use)
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return all users with their profiles
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    p.full_name,
    p.avatar_url,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO authenticated;

-- Ensure the get_all_user_emails function exists (from previous migration)
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
    RETURN QUERY SELECT auth.users.id, auth.users.email 
                 FROM auth.users 
                 ORDER BY auth.users.created_at DESC;
  ELSE
    -- For non-admins, return only their own email
    RETURN QUERY SELECT auth.users.id, auth.users.email 
                 FROM auth.users 
                 WHERE auth.users.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO authenticated;