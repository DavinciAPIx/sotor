-- Fix credits display for regular users
-- This migration ensures only admin users have unlimited credits

-- Update the handle_new_user function to set initial credits to 100 for all users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert initial credits (100 for all users)
  INSERT INTO public.user_credits (id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (id) DO NOTHING;
  
  -- Record the free credit transaction
  INSERT INTO public.transactions (user_id, amount, status, research_topic, payment_method)
  VALUES (NEW.id, 100, 'paid', 'رصيد مجاني للمستخدمين الجدد', 'free_credit')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have 100 credits if they have more than 999999
UPDATE public.user_credits
SET balance = 100
WHERE balance >= 999999 AND id NOT IN (SELECT id FROM public.admin_users);

-- Ensure admin users have a reasonable amount of credits (1000)
DO $$
DECLARE
  admin_id uuid;
BEGIN
  FOR admin_id IN SELECT id FROM public.admin_users
  LOOP
    INSERT INTO public.user_credits (id, balance)
    VALUES (admin_id, 1000)
    ON CONFLICT (id) DO UPDATE SET balance = 1000;
  END LOOP;
END $$;