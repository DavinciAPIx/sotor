-- Fix type casting issues in user_credits table
-- This migration fixes the "operator does not exist: text = uuid" error

-- First, let's safely check and fix the user_credits table structure
DO $$
DECLARE
    has_user_id_column boolean;
    has_id_column boolean;
BEGIN
    -- Check if user_credits table has user_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_credits' 
        AND column_name = 'user_id'
    ) INTO has_user_id_column;
    
    -- Check if user_credits table has id column as primary key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_credits' 
        AND column_name = 'id'
        AND is_nullable = 'NO'
    ) INTO has_id_column;
    
    RAISE NOTICE 'user_credits table - has_user_id_column: %, has_id_column: %', has_user_id_column, has_id_column;
    
    -- If table has user_id column, we need to fix it
    IF has_user_id_column AND NOT has_id_column THEN
        RAISE NOTICE 'Fixing user_credits table structure...';
        
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
        
        RAISE NOTICE 'Successfully recreated user_credits table with correct schema';
    ELSE
        RAISE NOTICE 'user_credits table already has correct schema or does not exist';
    END IF;
END $$;

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_credits (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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

-- Create or replace gift_credits function with proper error handling
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
    -- Check if the caller is an admin with explicit type handling
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

    -- Validate recipient_id
    IF recipient_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Recipient ID is required');
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
        
        RAISE NOTICE 'Created new credit record for user % with balance %', recipient_id, amount;
    ELSE
        -- Update existing record
        new_balance := current_balance + amount;
        UPDATE public.user_credits
        SET balance = new_balance, updated_at = now()
        WHERE id = recipient_id;
        
        RAISE NOTICE 'Updated credit balance for user % from % to %', recipient_id, current_balance, new_balance;
    END IF;

    -- Record the credit transaction
    INSERT INTO public.credit_transactions (from_user_id, to_user_id, amount, type)
    VALUES (null, recipient_id, amount, 'admin_gift');

    RETURN json_build_object(
        'status', 'success', 
        'message', 'Credits gifted successfully',
        'new_balance', new_balance,
        'amount_added', amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in gift_credits: %', SQLERRM;
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.gift_credits(uuid, integer) TO authenticated;

-- Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at_user_credits ON public.user_credits;
CREATE TRIGGER handle_updated_at_user_credits
    BEFORE UPDATE ON public.user_credits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;

-- Initialize credits for existing users who don't have records
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT au.id
        FROM auth.users au
        LEFT JOIN public.user_credits uc ON au.id = uc.id
        WHERE uc.id IS NULL
    LOOP
        INSERT INTO public.user_credits (id, balance)
        VALUES (user_record.id, 100)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Initialized credits for user %', user_record.id;
    END LOOP;
END $$;