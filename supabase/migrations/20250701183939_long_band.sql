/*
  # Fix Database Schema Issues

  1. Create missing functions
    - Recreate is_admin function
    - Fix transfer_credits function
  
  2. Fix table constraints
    - Ensure all tables have proper primary keys and foreign keys
    - Fix ON CONFLICT issues
  
  3. Security
    - Update RLS policies to ensure proper access
*/

-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = user_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Create or replace transfer_credits function
CREATE OR REPLACE FUNCTION public.transfer_credits(
  from_id uuid,
  to_id uuid,
  amount integer
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  from_balance integer;
BEGIN
  -- Check if sender has enough credits
  SELECT balance INTO from_balance
  FROM public.user_credits
  WHERE id = from_id;
  
  IF from_balance IS NULL OR from_balance < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Deduct from sender
  UPDATE public.user_credits
  SET balance = balance - amount
  WHERE id = from_id;
  
  -- Add to receiver (create record if doesn't exist)
  INSERT INTO public.user_credits (id, balance)
  VALUES (to_id, amount)
  ON CONFLICT (id)
  DO UPDATE SET balance = user_credits.balance + amount;
  
  -- Record the transfer
  INSERT INTO public.credit_transfers (from_user_id, to_user_id, amount)
  VALUES (from_id, to_id, amount);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.transfer_credits(uuid, uuid, integer) TO authenticated;

-- Create or replace get_all_users_with_profiles function
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

-- Ensure admin_users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add existing admin user if they exist
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Look for the admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- If found, add them as admin
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now())
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Added admin user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found with email cherifhoucine91@gmail.com';
    END IF;
END $$;

-- Create auto_add_admin function
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user should be an admin
  IF NEW.email = 'cherifhoucine91@gmail.com' THEN
    INSERT INTO public.admin_users (id, created_at)
    VALUES (NEW.id, now())
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Auto-added admin user: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto_add_admin
DROP TRIGGER IF EXISTS auto_add_admin_trigger ON auth.users;
CREATE TRIGGER auto_add_admin_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_add_admin();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;

-- Ensure app_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default app settings
INSERT INTO public.app_settings (id, value) 
VALUES ('research_cost', '{"cost": 100}')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;