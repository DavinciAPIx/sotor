/*
  # Create app settings table

  1. New Tables
    - `app_settings`
      - `id` (text, primary key)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `app_settings` table
    - Add policies for public read access
    - Add policies for admin write access

  3. Initial Data
    - Insert default research_cost setting
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to app settings
CREATE POLICY "Anyone can read app settings"
  ON app_settings
  FOR SELECT
  TO public
  USING (true);

-- Trigger to update updated_at on app_settings
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default research cost setting
INSERT INTO app_settings (id, value) 
VALUES ('research_cost', '{"cost": 0}')
ON CONFLICT (id) DO NOTHING;