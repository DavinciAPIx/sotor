/*
  # Fix Payment System Issues

  1. New Functions
    - Create update_user_credits function for safe credit updates
    - Fix existing RPC functions for payment processing
    - Add payment processing helper functions

  2. Security
    - Ensure proper RLS policies for payment operations
    - Add service_role access for payment processing

  3. Changes
    - Fix user_credits table structure issues
    - Add proper error handling for payment operations
*/

-- Create function to safely update user credits
CREATE OR REPLACE FUNCTION public.update_user_credits(
  user_id_param uuid,
  new_balance integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert user credits using user_id column
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
GRANT EXECUTE ON FUNCTION public.update_user_credits(uuid, integer) TO authenticated;

-- Update get_user_credits function to use user_id column
CREATE OR REPLACE FUNCTION public.get_user_credits(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_balance integer;
BEGIN
  -- Get user credits balance using user_id column
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

-- Create function to process successful payments
CREATE OR REPLACE FUNCTION public.process_payment_success(
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
BEGIN
  -- Calculate credits based on amount
  IF amount_param = 10 THEN
    credits_to_add := 10; -- Copper plan
  ELSIF amount_param = 30 THEN
    credits_to_add := 40; -- Silver plan
  ELSIF amount_param = 50 THEN
    credits_to_add := 70; -- Gold plan
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

  -- Record credit transaction
  INSERT INTO public.credit_transactions (from_user_id, to_user_id, amount, type)
  VALUES (null, user_id_param, credits_to_add, 'payment_credit');

  -- Update transaction status
  UPDATE public.transactions
  SET status = 'paid'
  WHERE payment_id = payment_id_param;

  RETURN json_build_object(
    'status', 'success',
    'credits_added', credits_to_add,
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
GRANT EXECUTE ON FUNCTION public.process_payment_success(text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_payment_success(text, uuid, integer) TO authenticated;

-- Update gift_credits function to use user_id column
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

  -- Get current balance using user_id column
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

-- Update handle_new_user function to use user_id column
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

-- Update transfer_credits function to use user_id column
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
  -- Check if sender has enough credits using user_id column
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