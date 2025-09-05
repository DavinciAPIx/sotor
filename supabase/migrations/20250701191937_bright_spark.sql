/*
  # Fix Admin User Check and Add Specific Admin Users
  
  1. Fixes
    - Fixes type mismatch in admin user checks
    - Adds specific users as admins
  
  2. Changes
    - Adds user with ID 401a6398-472a-4598-8495-0c0ce62c3ecd as admin
    - Adds user with email imvuveteran@gmail.com as admin
    - Updates auto_add_admin function to include both admin emails
*/

-- Add specific user as admin by ID using a direct approach
DO $$
BEGIN
  -- Insert directly, ignoring if it already exists
  BEGIN
    INSERT INTO public.admin_users (id, created_at)
    VALUES ('401a6398-472a-4598-8495-0c0ce62c3ecd', now());
    RAISE NOTICE 'Added admin user by ID: 401a6398-472a-4598-8495-0c0ce62c3ecd';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'User 401a6398-472a-4598-8495-0c0ce62c3ecd is already an admin';
  END;
END $$;

-- Add specific user as admin by email
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Look for the admin user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'imvuveteran@gmail.com';
    
    -- If found, add them as admin
    IF admin_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.admin_users (id, created_at)
            VALUES (admin_user_id, now());
            RAISE NOTICE 'Added admin user by email: %', admin_user_id;
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'User % is already an admin', admin_user_id;
        END;
    ELSE
        RAISE NOTICE 'Admin user not found with email imvuveteran@gmail.com';
    END IF;
END $$;

-- Update auto_add_admin function to include both admin emails
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user should be an admin
    IF NEW.email = 'cherifhoucine91@gmail.com' OR NEW.email = 'imvuveteran@gmail.com' THEN
        BEGIN
            INSERT INTO public.admin_users (id, created_at)
            VALUES (NEW.id, now());
            RAISE NOTICE 'Auto-added admin user: %', NEW.id;
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'User % is already an admin', NEW.id;
        END;
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