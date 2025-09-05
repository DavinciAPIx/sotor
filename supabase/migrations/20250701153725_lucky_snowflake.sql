/*
  # Create credit transfers table

  1. New Tables
    - `credit_transfers`
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, references auth.users)
      - `to_user_id` (uuid, references auth.users)
      - `amount` (integer)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `credit_transfers` table
    - Add policies for users to manage their transfers

  3. Functions
    - Create transfer_credits function for atomic credit transfers
*/

CREATE TABLE IF NOT EXISTS credit_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  status text DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transfers ENABLE ROW LEVEL SECURITY;

-- Policy for users to read credit transfers involving them
CREATE POLICY "Users can read credit transfers involving them"
  ON credit_transfers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );

-- Function to transfer credits between users atomically
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
  -- Check if the caller is the sender
  IF auth.uid() != from_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only transfer your own credits';
  END IF;

  -- Check if amount is positive
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Check if sender and receiver are different
  IF from_id = to_id THEN
    RAISE EXCEPTION 'Cannot transfer credits to yourself';
  END IF;

  -- Get sender's current balance
  SELECT balance INTO from_balance
  FROM user_credits
  WHERE id = from_id;

  -- Check if sender has enough credits
  IF from_balance IS NULL OR from_balance < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Perform the transfer atomically
  BEGIN
    -- Deduct from sender
    UPDATE user_credits
    SET balance = balance - amount
    WHERE id = from_id;

    -- Add to receiver (create record if doesn't exist)
    INSERT INTO user_credits (id, balance)
    VALUES (to_id, amount)
    ON CONFLICT (id)
    DO UPDATE SET balance = user_credits.balance + amount;

    -- Record the transfer
    INSERT INTO credit_transfers (from_user_id, to_user_id, amount)
    VALUES (from_id, to_id, amount);

  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Transfer failed: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.transfer_credits(uuid, uuid, integer) TO authenticated;