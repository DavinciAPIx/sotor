/*
  # Fix admin_users table constraint issue
  
  1. Changes
    - Ensures admin_users table has proper primary key constraint
    - Fixes the DO NOTHING clause in the admin user insertion
    - Adds proper admin user for cherifhoucine91@gmail.com
*/

-- First, ensure admin_users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Add admin user directly without using ON CONFLICT
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean;
BEGIN
    -- Look for the admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- Check if admin already exists in admin_users
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE id = admin_user_id
    ) INTO admin_exists;
    
    -- If user found and not already an admin, add them
    IF admin_user_id IS NOT NULL AND NOT admin_exists THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now());
        RAISE NOTICE 'Added admin user: %', admin_user_id;
    ELSIF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found with email cherifhoucine91@gmail.com';
    ELSE
        RAISE NOTICE 'User % is already an admin', admin_user_id;
    END IF;
END $$;

-- Fix auto_add_admin function to not use ON CONFLICT
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if the user should be an admin
    IF NEW.email = 'cherifhoucine91@gmail.com' THEN
        -- Check if already an admin
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users WHERE id = NEW.id
        ) INTO admin_exists;
        
        -- Only insert if not already an admin
        IF NOT admin_exists THEN
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

-- Enable realtime for admin_users table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;