
-- Function to get all user emails securely
-- This will be called with RPC from the client
CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (id uuid, email text) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
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
