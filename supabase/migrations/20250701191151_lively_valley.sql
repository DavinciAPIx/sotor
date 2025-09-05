-- Fix type mismatch in admin_users check
-- This migration fixes the error: "operator does not exist: text = uuid"

-- Add specific user as admin by ID using a safer approach with explicit type handling
DO $$
DECLARE
    admin_user_id uuid := '401a6398-472a-4598-8495-0c0ce62c3ecd';
    admin_exists boolean;
BEGIN
    -- Check if the user is already an admin with explicit type handling
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id::text = admin_user_id::text
    ) INTO admin_exists;
    
    -- Only insert if not already an admin
    IF NOT admin_exists THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now());
        RAISE NOTICE 'Added admin user by ID: %', admin_user_id;
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
    
    -- If found, check if already an admin with explicit type handling
    IF admin_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = admin_user_id::text
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

-- Update auto_add_admin function to handle type casting properly
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if the user should be an admin
    IF NEW.email = 'cherifhoucine91@gmail.com' OR NEW.email = 'imvuveteran@gmail.com' THEN
        -- Check if already an admin with explicit type handling
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = NEW.id::text
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