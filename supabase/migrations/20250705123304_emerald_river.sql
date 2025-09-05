/*
  # Fix user_credits table schema

  1. Changes
    - Fix user_credits table to use id as primary key (not user_id)
    - Create proper gift_credits function
    - Fix RLS policies
    - Migrate existing data if any

  2. Security
    - Maintain proper RLS policies
    - Ensure admin-only access to gift_credits function
*/

-- First, let's check the current structure and fix it
DO $$
BEGIN
  -- Check if user_credits table has user_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_credits' AND column_name = 'user_id'
  ) THEN
    -- Drop the table and recreate with correct structure
    DROP TABLE IF EXISTS public.user_credits CASCADE;
    
    -- Create user_credits table with correct structure
    CREATE TABLE public.user_credits (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      balance integer DEFAULT 0 NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Recreated user_credits table with correct schema';
  ELSE
    RAISE NOTICE 'user_credits table already has correct schema';
  END IF;
END $$;

-- Create RLS policies for user_credits
DROP POLICY IF EXISTS "Users can read own credits" ON public.user_credits;
CREATE POLICY "Users can read own credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
CREATE POLICY "Users can insert own credits"
  ON public.user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
CREATE POLICY "Users can update own credits"
  ON public.user_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all credits" ON public.user_credits;
CREATE POLICY "Admins can read all credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update all credits" ON public.user_credits;
CREATE POLICY "Admins can update all credits"
  ON public.user_credits
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "System can manage user credits" ON public.user_credits;
CREATE POLICY "System can manage user credits"
  ON public.user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create gift_credits function
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
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()) THEN
    RETURN json_build_object('status', 'error', 'message', 'Access denied: Admin privileges required');
  END IF;

  -- Validate amount
  IF amount <= 0 THEN
    RETURN json_build_object('status', 'error', 'message', 'Amount must be positive');
  END IF;

  -- Get current balance or create record if doesn't exist
  SELECT balance INTO current_balance
  FROM public.user_credits
  WHERE id = recipient_id;

  IF current_balance IS NULL THEN
    -- Create new record
    INSERT INTO public.user_credits (id, balance)
    VALUES (recipient_id, amount);
    new_balance := amount;
  ELSE
    -- Update existing record
    new_balance := current_balance + amount;
    UPDATE public.user_credits
    SET balance = new_balance, updated_at = now()
    WHERE id = recipient_id;
  END IF;

  -- Record the credit transaction
  INSERT INTO public.credit_transactions (from_user_id, to_user_id, amount, type)
  VALUES (null, recipient_id, amount, 'admin_gift');

  RETURN json_build_object(
    'status', 'success', 
    'message', 'Credits gifted successfully',
    'new_balance', new_balance
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.gift_credits(uuid, integer) TO authenticated;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at_user_credits ON public.user_credits;
CREATE TRIGGER handle_updated_at_user_credits
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;

-- Initialize credits for existing users who don't have records
INSERT INTO public.user_credits (id, balance)
SELECT au.id, 100
FROM auth.users au
LEFT JOIN public.user_credits uc ON au.id = uc.id
WHERE uc.id IS NULL
ON CONFLICT (id) DO NOTHING;