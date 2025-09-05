-- Fix the ON CONFLICT error by ensuring the admin_users table exists first
-- and then adding the specific user without using ON CONFLICT

-- Ensure admin_users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Add specific user as admin by ID using a safer approach
DO $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if the user is already an admin
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = '401a6398-472a-4598-8495-0c0ce62c3ecd'
    ) INTO admin_exists;
    
    -- Only insert if not already an admin
    IF NOT admin_exists THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES ('401a6398-472a-4598-8495-0c0ce62c3ecd', now());
        RAISE NOTICE 'Added admin user by ID: 401a6398-472a-4598-8495-0c0ce62c3ecd';
    ELSE
        RAISE NOTICE 'User is already an admin';
    END IF;
END $$;

-- Add specific user as admin by email using a safer approach
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean;
BEGIN
    -- Look for the admin user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'imvuveteran@gmail.com';
    
    -- If found, check if already an admin
    IF admin_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = admin_user_id
        ) INTO admin_exists;
        
        -- Only insert if not already an admin
        IF NOT admin_exists THEN
            INSERT INTO public.admin_users (id, created_at)
            VALUES (admin_user_id, now());
            RAISE NOTICE 'Added admin user by email: %', admin_user_id;
        ELSE
            RAISE NOTICE 'User % is already an admin', admin_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'Admin user not found with email imvuveteran@gmail.com';
    END IF;
END $$;

-- Update auto_add_admin function to include the new admin email
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if the user should be an admin
    IF NEW.email = 'cherifhoucine91@gmail.com' OR NEW.email = 'imvuveteran@gmail.com' THEN
        -- Check if already an admin
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = NEW.id
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