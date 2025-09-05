-- Fix type mismatch in admin_users check
-- This migration fixes the error: "operator does not exist: text = uuid"

-- Add admin user directly with proper type handling
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean;
BEGIN
    -- Look for the admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- Check if admin already exists in admin_users with proper type handling
    IF admin_user_id IS NOT NULL THEN
        -- Use explicit comparison between UUID types
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users WHERE id = admin_user_id
        ) INTO admin_exists;
        
        -- If user found and not already an admin, add them
        IF NOT admin_exists THEN
            INSERT INTO public.admin_users (id, created_at)
            VALUES (admin_user_id, now());
            RAISE NOTICE 'Added admin user: %', admin_user_id;
        ELSE
            RAISE NOTICE 'User % is already an admin', admin_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'Admin user not found with email cherifhoucine91@gmail.com';
    END IF;
END $$;

-- Fix auto_add_admin function to handle types properly
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if the user should be an admin
    IF NEW.email = 'cherifhoucine91@gmail.com' THEN
        -- Check if already an admin with proper type handling
        -- Both NEW.id and id in admin_users are UUID types, so no casting needed
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