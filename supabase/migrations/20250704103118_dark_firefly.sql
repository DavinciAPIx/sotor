-- Add imvuveteran@gmail.com as admin user
-- This migration ensures the user with email imvuveteran@gmail.com gets admin privileges

-- Update auto_add_admin function to include imvuveteran@gmail.com
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user should be an admin
    IF NEW.email = 'cherifhoucine91@gmail.com' OR NEW.email = 'imvuveteran@gmail.com' THEN
        -- Check if already an admin
        PERFORM 1 FROM public.admin_users WHERE id = NEW.id;
        
        -- Only insert if not already an admin
        IF NOT FOUND THEN
            INSERT INTO public.admin_users (id, created_at)
            VALUES (NEW.id, now());
            RAISE NOTICE 'Auto-added admin user: %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add existing user with email imvuveteran@gmail.com as admin if they exist
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
        -- Check if already an admin
        PERFORM 1 FROM public.admin_users WHERE id = admin_user_id;
        
        -- Only insert if not already an admin
        IF NOT FOUND THEN
            INSERT INTO public.admin_users (id, created_at)
            VALUES (admin_user_id, now());
            RAISE NOTICE 'Added existing user as admin: %', admin_user_id;
        ELSE
            RAISE NOTICE 'User % is already an admin', admin_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'User with email imvuveteran@gmail.com not found. Will be added as admin when they sign up.';
    END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;