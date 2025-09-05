/*
  # Fix Database Issues

  1. Create admin_users table with proper constraints
  2. Create app_settings table with proper constraints
  3. Create user_credits table with proper structure
  4. Create research_history table with proper structure
  5. Add necessary RLS policies
  6. Create required functions
*/

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default app settings if not exists
INSERT INTO public.app_settings (id, value) 
VALUES ('research_cost', '{"cost": 100}')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- Create user_credits table with proper structure
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create research_history table with proper structure
CREATE TABLE IF NOT EXISTS public.research_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- Create is_admin function
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

-- Create handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_credits
  INSERT INTO public.user_credits (id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auto_add_admin function
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user should be an admin
  IF NEW.email = 'cherifhoucine91@gmail.com' THEN
    INSERT INTO public.admin_users (id, created_at)
    VALUES (NEW.id, now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create transfer_credits function
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

-- Create get_all_users_with_profiles function
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
GRANT EXECUTE ON FUNCTION public.transfer_credits(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;

-- Create RLS policies for app_settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can update app settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Create RLS policies for user_credits
CREATE POLICY "Users can read own credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own credits"
  ON public.user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update all credits"
  ON public.user_credits
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "System can manage user credits"
  ON public.user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for research_history
CREATE POLICY "Users can read own research history"
  ON public.research_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research history"
  ON public.research_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research history"
  ON public.research_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all research history"
  ON public.research_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "System can manage research history"
  ON public.research_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for admin_users
CREATE POLICY "Admins can read admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "System can manage admin users"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS handle_updated_at_app_settings ON public.app_settings;
CREATE TRIGGER handle_updated_at_app_settings
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_credits ON public.user_credits;
CREATE TRIGGER handle_updated_at_user_credits
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_research_history ON public.research_history;
CREATE TRIGGER handle_updated_at_research_history
  BEFORE UPDATE ON public.research_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for automatic user credit creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for automatic admin user creation
DROP TRIGGER IF EXISTS auto_add_admin_trigger ON auth.users;
CREATE TRIGGER auto_add_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_admin();

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
    END IF;
END $$;

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_history;