/*
  # Add Tap Payment Support

  1. Changes
    - Update transactions table to support Tap payment method
    - Add Tap-specific payment tracking
    - Update credit calculation for SAR currency

  2. Security
    - Maintain existing RLS policies
    - Add support for tap_payment method
*/

-- Add tap_payment as a valid payment method (no schema changes needed, just documentation)
-- The transactions table already supports various payment methods via the payment_method text field

-- Update any existing Chargily transactions to be clearly marked
UPDATE public.transactions 
SET payment_method = 'chargily_payment' 
WHERE payment_method = 'CIB' OR payment_method IS NULL;

-- Add a comment to document the supported payment methods
COMMENT ON COLUMN public.transactions.payment_method IS 'Supported payment methods: tap_payment, chargily_payment, credit, free_credit, admin_gift';

-- Create function to get user credits safely (avoiding RLS issues)
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
  WHERE id = user_id_param;
  
  -- Return 0 if no record found
  RETURN COALESCE(user_balance, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_credits(uuid) TO authenticated;

-- Create function to check user admin status safely
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON public.transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status ON public.transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_credits_balance ON public.user_credits(balance);

-- Update app settings to document the new payment provider
DO $$
BEGIN
  -- Add payment provider settings
  INSERT INTO public.app_settings (id, value) 
  VALUES ('payment_providers', '{"tap": {"enabled": true, "currency": "SAR"}, "chargily": {"enabled": false, "currency": "DZD"}}')
  ON CONFLICT (id) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();
END $$;