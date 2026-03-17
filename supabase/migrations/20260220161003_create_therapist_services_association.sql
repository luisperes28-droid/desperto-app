/*
  # Create therapist_services association table

  1. New Tables
    - `therapist_services`
      - `id` (uuid, primary key)
      - `therapist_id` (uuid, foreign key to users.id)
      - `service_id` (uuid, foreign key to services.id)
      - `created_at` (timestamptz)
      - Unique constraint on (therapist_id, service_id)

  2. Data
    - Luis Peres: Psicoterapia UCEM, Sessao Miracle Choice, Coaching Pessoal
    - Christina: Consulta Coerencia Bioemocional, Terapia pelo Perdao, Sessao Miracle Choice

  3. Security
    - Enable RLS on therapist_services table
    - Policy for authenticated users to read therapist_services
    - Policy for admins to manage therapist_services
*/

CREATE TABLE IF NOT EXISTS therapist_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES users(id),
  service_id uuid NOT NULL REFERENCES services(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(therapist_id, service_id)
);

ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view therapist services"
  ON therapist_services
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert therapist services"
  ON therapist_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update therapist services"
  ON therapist_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete therapist services"
  ON therapist_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Also allow anonymous/public read for public booking page
CREATE POLICY "Public can view therapist services"
  ON therapist_services
  FOR SELECT
  TO anon
  USING (true);

-- Luis Peres: Psicoterapia UCEM, Sessao Miracle Choice, Coaching Pessoal
INSERT INTO therapist_services (therapist_id, service_id) VALUES
  ('e579ea96-481b-4042-92f5-3babccf4a055', '754ea307-7a91-4dc2-8e98-6affa73721b6'),
  ('e579ea96-481b-4042-92f5-3babccf4a055', '2527bd70-0686-4e04-85d0-d5b36b085216'),
  ('e579ea96-481b-4042-92f5-3babccf4a055', '3c1dc4ee-f9e3-4451-9119-89dcdee53065')
ON CONFLICT (therapist_id, service_id) DO NOTHING;

-- Christina: Consulta Coerencia Bioemocional, Terapia pelo Perdao, Sessao Miracle Choice
INSERT INTO therapist_services (therapist_id, service_id) VALUES
  ('6875e79a-a31b-4444-9fa6-80ca70ab4f03', 'f89934c1-8342-44da-93b3-c8dbff4f63e0'),
  ('6875e79a-a31b-4444-9fa6-80ca70ab4f03', 'de1b5228-a382-4d4b-84f6-455cbbf260c3'),
  ('6875e79a-a31b-4444-9fa6-80ca70ab4f03', '2527bd70-0686-4e04-85d0-d5b36b085216')
ON CONFLICT (therapist_id, service_id) DO NOTHING;
