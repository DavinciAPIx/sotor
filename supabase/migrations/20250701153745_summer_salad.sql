/*
  # Add admin policies for all tables

  1. Admin Policies
    - Add admin policies to all tables for full access
    - Admins can read, insert, update, and delete on all tables

  2. Security
    - Policies check admin status using the is_admin function
*/

-- Admin policies for profiles table
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admin policies for user_credits table
CREATE POLICY "Admins can manage all user credits"
  ON user_credits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admin policies for transactions table
CREATE POLICY "Admins can manage all transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admin policies for research_history table
CREATE POLICY "Admins can manage all research history"
  ON research_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admin policies for app_settings table
CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admin policies for credit_transactions table
CREATE POLICY "Admins can manage all credit transactions"
  ON credit_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admin policies for credit_transfers table
CREATE POLICY "Admins can manage all credit transfers"
  ON credit_transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );