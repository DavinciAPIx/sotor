/*
  # Fix User Credits and Payment Issues

  1. Fix user_credits table structure
  2. Create safe RPC functions for credits
  3. Fix payment processing
  4. Add proper error handling
*/

-- Ensure user_credits table has correct structure
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admins can read all credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admins can update all credits" ON public.user_credits;
DROP POLICY IF EXISTS "System can manage user credits" ON public.user_credits;

-- Create RLS policies for user_credits
CREATE POLICY "Users can read own credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON public.user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Create safe function to get user credits
CREATE OR REPLACE FUNCTION public.get_user_credits(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_balance integer;
BEGIN
  -- Get user credits balance
  SELECT balance INTO user_balance
  FROM public.user_credits
  WHERE user_id = user_id_param;
  
  -- Return 0 if no record found
  RETURN COALESCE(user_balance, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_credits(uuid) TO anon;

-- Create safe function to check admin status
CREATE OR REPLACE FUNCTION public.check_user_admin_status(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = user_id_param
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_user_admin_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_admin_status(uuid) TO anon;

-- Create function to safely update user credits
CREATE OR REPLACE FUNCTION public.update_user_credits(
  user_id_param uuid,
  new_balance integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert user credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (user_id_param, new_balance)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = new_balance,
    updated_at = now();

  RETURN json_build_object(
    'status', 'success',
    'new_balance', new_balance
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_user_credits(uuid, integer) TO service_role;

-- Update gift_credits function to use correct table structure
CREATE OR REPLACE FUNCTION public.gift_credits(
  recipient_id uuid,
  amount integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
  admin_check boolean;
BEGIN
  -- Check if the caller is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
  ) INTO admin_check;
  
  IF NOT admin_check THEN
    RETURN json_build_object('status', 'error', 'message', 'Access denied: Admin privileges required');
  END IF;

  -- Validate amount
  IF amount <= 0 THEN
    RETURN json_build_object('status', 'error', 'message', 'Amount must be positive');
  END IF;

  -- Get current balance or create record if doesn't exist
  SELECT balance INTO current_balance
  FROM public.user_credits
  WHERE user_id = recipient_id;

  IF current_balance IS NULL THEN
    -- Create new record
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (recipient_id, amount);
    new_balance := amount;
  ELSE
    -- Update existing record
    new_balance := current_balance + amount;
    UPDATE public.user_credits
    SET balance = new_balance, updated_at = now()
    WHERE user_id = recipient_id;
  END IF;

  -- Record the credit transaction
  INSERT INTO public.credit_transactions (from_user_id, to_user_id, amount, type)
  VALUES (null, recipient_id, amount, 'admin_gift');

  RETURN json_build_object(
    'status', 'success', 
    'message', 'Credits gifted successfully',
    'new_balance', new_balance
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.gift_credits(uuid, integer) TO authenticated;

-- Update handle_new_user function to use correct table structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  research_cost integer;
  initial_credits integer;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Get current research cost
  SELECT COALESCE((value->>'cost')::integer, 0) INTO research_cost
  FROM public.app_settings 
  WHERE id = 'research_cost';
  
  -- Set initial credits based on research cost
  IF research_cost > 0 THEN
    initial_credits := 100;  -- Give 100 credits when research costs money
  ELSE
    initial_credits := 0;    -- Give 0 credits when research is free
  END IF;
  
  -- Insert initial credits using user_id column
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, initial_credits)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Record the transaction only if credits were given
  IF initial_credits > 0 THEN
    INSERT INTO public.transactions (user_id, amount, status, research_topic, payment_method)
    VALUES (NEW.id, initial_credits, 'paid', 'رصيد مجاني للمستخدمين الجدد', 'free_credit')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update transfer_credits function to use correct table structure
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
  WHERE user_id = from_id;
  
  IF from_balance IS NULL OR from_balance < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Deduct from sender
  UPDATE public.user_credits
  SET balance = balance - amount
  WHERE user_id = from_id;
  
  -- Add to receiver (create record if doesn't exist)
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (to_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = user_credits.balance + amount;
  
  -- Record the transfer
  INSERT INTO public.credit_transfers (from_user_id, to_user_id, amount)
  VALUES (from_id, to_id, amount);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.transfer_credits(uuid, uuid, integer) TO authenticated;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at_user_credits ON public.user_credits;
CREATE TRIGGER handle_updated_at_user_credits
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;

-- Migrate existing data if needed
DO $$
DECLARE
  old_record RECORD;
BEGIN
  -- Check if there's an old user_credits table with id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_credits' 
    AND column_name = 'id'
    AND is_nullable = 'NO'
  ) THEN
    -- Migrate data from old structure to new structure
    FOR old_record IN 
      SELECT id as old_id, balance, created_at, updated_at
      FROM public.user_credits
    LOOP
      INSERT INTO public.user_credits (user_id, balance, created_at, updated_at)
      VALUES (old_record.old_id, old_record.balance, old_record.created_at, old_record.updated_at)
      ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migrated existing user credits data';
  END IF;
END $$;