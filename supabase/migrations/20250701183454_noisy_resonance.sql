/*
  # Fix Credit Transfers Table

  1. Create credit_transfers table with proper structure
  2. Add RLS policies for credit_transfers
  3. Enable realtime for credit_transfers
*/

-- Create credit_transfers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on credit_transfers
ALTER TABLE public.credit_transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own credit transfers" ON public.credit_transfers;
DROP POLICY IF EXISTS "Users can insert credit transfers" ON public.credit_transfers;
DROP POLICY IF EXISTS "System can manage credit transfers" ON public.credit_transfers;

-- Create RLS policies for credit_transfers
CREATE POLICY "Users can read own credit transfers"
  ON public.credit_transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can insert credit transfers"
  ON public.credit_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "System can manage credit transfers"
  ON public.credit_transfers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for credit_transfers
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transfers;

-- Create credit_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL DEFAULT 'transfer',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can insert credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "System can manage credit transactions" ON public.credit_transactions;

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can read own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can insert credit transactions"
  ON public.credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "System can manage credit transactions"
  ON public.credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for credit_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;