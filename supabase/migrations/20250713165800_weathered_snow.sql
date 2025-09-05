/*
  # Update user signup to conditionally give credits

  1. Changes
    - Modify handle_new_user function to check research cost
    - Give 100 credits only when research cost > 0
    - Give 0 credits when research is free

  2. Logic
    - Check app_settings for research_cost
    - If cost > 0, give 100 credits
    - If cost = 0, give 0 credits (free research)
*/

-- Update handle_new_user function to conditionally give credits based on research cost
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
  
  -- Insert initial credits
  INSERT INTO public.user_credits (id, balance)
  VALUES (NEW.id, initial_credits)
  ON CONFLICT (id) DO NOTHING;
  
  -- Record the transaction only if credits were given
  IF initial_credits > 0 THEN
    INSERT INTO public.transactions (user_id, amount, status, research_topic, payment_method)
    VALUES (NEW.id, initial_credits, 'paid', 'رصيد مجاني للمستخدمين الجدد', 'free_credit')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users who have 0 credits to 100 credits if research cost > 0
DO $$
DECLARE
  research_cost integer;
BEGIN
  -- Get current research cost
  SELECT COALESCE((value->>'cost')::integer, 0) INTO research_cost
  FROM public.app_settings 
  WHERE id = 'research_cost';
  
  -- If research costs money, update users with 0 credits to 100 credits
  IF research_cost > 0  THEN
    UPDATE public.user_credits
    SET balance = 100, updated_at = now()
    WHERE balance = 0 
    AND id NOT IN (SELECT id FROM public.admin_users);
    
    RAISE NOTICE 'Updated existing users with 0 credits to 100 credits since research cost is %', research_cost;
  ELSE
    RAISE NOTICE 'Research is free (cost: %), no credit updates needed', research_cost;
  END IF;
END $$;