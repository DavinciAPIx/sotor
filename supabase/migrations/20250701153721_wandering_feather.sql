/*
  # Create credit transactions table

  1. New Tables
    - `credit_transactions`
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, references auth.users)
      - `to_user_id` (uuid, references auth.users)
      - `amount` (integer)
      - `type` (text) - 'admin_gift', 'transfer', etc.
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `credit_transactions` table
    - Add policies for users to read transactions involving them
*/

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text DEFAULT 'transfer' NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read credit transactions involving them
CREATE POLICY "Users can read credit transactions involving them"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );

-- Policy for users to insert credit transactions they initiate
CREATE POLICY "Users can insert credit transactions they initiate"
  ON credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);