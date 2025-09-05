/*
  # Fix Moyasar Payment Integration

  1. New Tables
    - Create transactions_rows table to match the code expectations
    - Add proper indexes for payment processing

  2. Security
    - Enable RLS on transactions_rows table
    - Add policies for users and admins
    - Add service_role bypass for payment processing

  3. Functions
    - Create process_moyasar_payment function for webhook processing
    - Fix credit calculation and assignment
    - Add proper error handling and logging
*/

-- Create transactions_rows table (the code expects this table name)
CREATE TABLE IF NOT EXISTS public.transactions_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_id text UNIQUE,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  research_topic text,
  plan_title text,
  currency text DEFAULT 'SAR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Enable RLS on transactions_rows
ALTER TABLE public.transactions_rows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions_rows
CREATE POLICY "Users can read own transactions_rows"
  ON public.transactions_rows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions_rows"
  ON public.transactions_rows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions_rows"
  ON public.transactions_rows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions_rows"
  ON public.transactions_rows
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "System can manage transactions_rows"
  ON public.transactions_rows
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_rows_payment_id ON public.transactions_rows(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_rows_user_id_status ON public.transactions_rows(user_id, status);

-- Create function to process Moyasar payment success
CREATE OR REPLACE FUNCTION public.process_moyasar_payment(
  payment_id_param text,
  user_id_param uuid,
  amount_param integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
  credits_to_add integer;
  new_balance integer;
  existing_transaction RECORD;
BEGIN
  -- Check if payment was already processed
  SELECT * INTO existing_transaction
  FROM public.transactions_rows
  WHERE payment_id = payment_id_param AND status = 'paid';
  
  IF existing_transaction.id IS NOT NULL THEN
    RETURN json_build_object(
      'status', 'already_processed',
      'message', 'Payment already processed',
      'transaction_id', existing_transaction.id
    );
  END IF;

  -- Calculate credits based on amount (matching the frontend logic)
  IF amount_param = 10 THEN
    credits_to_add := 10; -- Copper plan: 1 research
  ELSIF amount_param = 30 THEN
    credits_to_add := 40; -- Silver plan: 4 researches + 1 bonus
  ELSIF amount_param = 50 THEN
    credits_to_add := 70; -- Gold plan: 7 researches + 2 bonus
  ELSE
    credits_to_add := amount_param; -- Default: 1 credit per 1 SAR
  END IF;

  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.user_credits
  WHERE user_id = user_id_param;

  -- Calculate new balance
  new_balance := COALESCE(current_balance, 0) + credits_to_add;

  -- Update or insert user credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (user_id_param, new_balance)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = new_balance,
    updated_at = now();

  -- Update transaction status to paid
  UPDATE public.transactions_rows
  SET 
    status = 'paid',
    paid_at = now(),
    updated_at = now()
  WHERE payment_id = payment_id_param;

  -- If no transaction exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.transactions_rows (
      user_id, 
      payment_id, 
      amount, 
      status, 
      payment_method, 
      research_topic,
      paid_at
    )
    VALUES (
      user_id_param, 
      payment_id_param, 
      amount_param, 
      'paid', 
      'moyasar', 
      'شحن رصيد',
      now()
    );
  END IF;

  -- Record credit transaction for audit
  INSERT INTO public.credit_transactions (from_user_id, to_user_id, amount, type)
  VALUES (null, user_id_param, credits_to_add, 'payment_credit');

  RETURN json_build_object(
    'status', 'success',
    'credits_added', credits_to_add,
    'new_balance', new_balance,
    'payment_id', payment_id_param
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'status', 'error',
      'message', SQLERRM,
      'payment_id', payment_id_param
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_moyasar_payment(text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_moyasar_payment(text, uuid, integer) TO authenticated;

-- Create function to handle payment callbacks from frontend
CREATE OR REPLACE FUNCTION public.handle_payment_callback(
  payment_id_param text,
  amount_param integer DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_id_param uuid;
  result json;
BEGIN
  -- Get the current user
  user_id_param := auth.uid();
  
  IF user_id_param IS NULL THEN
    RETURN json_build_object(
      'status', 'error',
      'message', 'User not authenticated'
    );
  END IF;

  -- Process the payment
  SELECT public.process_moyasar_payment(payment_id_param, user_id_param, amount_param) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_payment_callback(text, integer) TO authenticated;

-- Create updated_at trigger for transactions_rows
DROP TRIGGER IF EXISTS handle_updated_at_transactions_rows ON public.transactions_rows;
CREATE TRIGGER handle_updated_at_transactions_rows
  BEFORE UPDATE ON public.transactions_rows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for transactions_rows
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions_rows;

-- Migrate existing transactions to transactions_rows if needed
INSERT INTO public.transactions_rows (
  user_id, 
  payment_id, 
  amount, 
  status, 
  payment_method, 
  research_topic, 
  created_at, 
  updated_at
)
SELECT 
  user_id, 
  payment_id, 
  amount, 
  status, 
  payment_method, 
  research_topic, 
  created_at, 
  updated_at
FROM public.transactions
WHERE payment_id IS NOT NULL
ON CONFLICT (payment_id) DO NOTHING;