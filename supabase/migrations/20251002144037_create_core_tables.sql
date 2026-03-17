/*
  # Sistema Completo de Agendamentos - Desperto
  
  1. Novas Tabelas
    - services: Serviços oferecidos pelos terapeutas
    - bookings: Agendamentos de consultas
    - payments: Registos de pagamentos
    - therapist_notes: Notas dos terapeutas sobre clientes
    - business_settings: Configurações do negócio
    - coupons: Sistema de cupões/vouchers
    - coupon_usages: Histórico de utilização de cupões
    - password_reset_tokens: Tokens para reset de password
    - two_factor_auth_settings: Configurações de 2FA
    - security_questions: Perguntas de segurança dos utilizadores
    - predefined_security_questions: Perguntas predefinidas
    
  2. Segurança
    - RLS ativado em todas as tabelas
    - Políticas específicas por tipo de utilizador
    - Proteção de dados sensíveis
    
  3. Funcionalidades
    - Sistema de agendamentos completo
    - Gestão de pagamentos
    - Sistema de cupões
    - Autenticação avançada (2FA, perguntas de segurança)
    - Notas de terapeuta
*/

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('card', 'cash', 'paypal', 'mbway', 'multibanco', 'coupon');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration integer NOT NULL DEFAULT 60,
  price numeric(10, 2) NOT NULL,
  category text DEFAULT 'coaching',
  therapist_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  booking_date timestamptz NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  notes text,
  reminder_sent boolean DEFAULT false,
  reschedule_request jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id text,
  invoice_number text,
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Therapist notes table
CREATE TABLE IF NOT EXISTS therapist_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_private boolean DEFAULT true,
  session_date timestamptz,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Business settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  password text NOT NULL,
  discount_type text DEFAULT 'percentage',
  discount_value numeric(10, 2) NOT NULL,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coupon usages table
CREATE TABLE IF NOT EXISTS coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  used_at timestamptz DEFAULT now()
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Two factor auth settings table
CREATE TABLE IF NOT EXISTS two_factor_auth_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enabled boolean DEFAULT false,
  method text DEFAULT 'email',
  phone_number text,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Predefined security questions table
CREATE TABLE IF NOT EXISTS predefined_security_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User security questions table
CREATE TABLE IF NOT EXISTS security_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES predefined_security_questions(id) ON DELETE CASCADE NOT NULL,
  answer_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_therapist ON services(therapist_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_therapist ON bookings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_therapist_notes_therapist ON therapist_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_notes_client ON therapist_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;

-- SERVICES POLICIES
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Therapists can manage their services"
  ON services FOR ALL
  USING (therapist_id IN (SELECT id FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)))
  WITH CHECK (therapist_id IN (SELECT id FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)));

CREATE POLICY "Admins can manage all services"
  ON services FOR ALL
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin')
  WITH CHECK (true);

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    client_id = (SELECT current_setting('app.current_user_id', true)::uuid) OR
    therapist_id = (SELECT current_setting('app.current_user_id', true)::uuid)
  );

CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (client_id = (SELECT current_setting('app.current_user_id', true)::uuid));

CREATE POLICY "Users can update their bookings"
  ON bookings FOR UPDATE
  USING (
    client_id = (SELECT current_setting('app.current_user_id', true)::uuid) OR
    therapist_id = (SELECT current_setting('app.current_user_id', true)::uuid)
  )
  WITH CHECK (true);

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin')
  WITH CHECK (true);

-- PAYMENTS POLICIES
CREATE POLICY "Users can view payments for their bookings"
  ON payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE client_id = (SELECT current_setting('app.current_user_id', true)::uuid)
         OR therapist_id = (SELECT current_setting('app.current_user_id', true)::uuid)
    )
  );

CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin')
  WITH CHECK (true);

-- THERAPIST NOTES POLICIES
CREATE POLICY "Therapists can manage their notes"
  ON therapist_notes FOR ALL
  USING (therapist_id = (SELECT current_setting('app.current_user_id', true)::uuid))
  WITH CHECK (therapist_id = (SELECT current_setting('app.current_user_id', true)::uuid));

CREATE POLICY "Admins can view all notes"
  ON therapist_notes FOR SELECT
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin');

-- BUSINESS SETTINGS POLICIES
CREATE POLICY "Anyone can view business settings"
  ON business_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business settings"
  ON business_settings FOR ALL
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin')
  WITH CHECK (true);

-- COUPONS POLICIES
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin')
  WITH CHECK (true);

-- COUPON USAGES POLICIES
CREATE POLICY "Users can view their coupon usages"
  ON coupon_usages FOR SELECT
  USING (user_id = (SELECT current_setting('app.current_user_id', true)::uuid));

CREATE POLICY "System can create coupon usages"
  ON coupon_usages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all coupon usages"
  ON coupon_usages FOR SELECT
  USING ((SELECT user_type FROM users WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)) = 'admin');

-- PASSWORD RESET TOKENS POLICIES
CREATE POLICY "Anyone can create password reset tokens"
  ON password_reset_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = (SELECT current_setting('app.current_user_id', true)::uuid));

-- TWO FACTOR AUTH SETTINGS POLICIES
CREATE POLICY "Users can manage their 2FA settings"
  ON two_factor_auth_settings FOR ALL
  USING (user_id = (SELECT current_setting('app.current_user_id', true)::uuid))
  WITH CHECK (user_id = (SELECT current_setting('app.current_user_id', true)::uuid));

-- SECURITY QUESTIONS POLICIES
CREATE POLICY "Anyone can view predefined questions"
  ON predefined_security_questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage their security questions"
  ON security_questions FOR ALL
  USING (user_id = (SELECT current_setting('app.current_user_id', true)::uuid))
  WITH CHECK (user_id = (SELECT current_setting('app.current_user_id', true)::uuid));

-- Create triggers for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_notes_updated_at
  BEFORE UPDATE ON therapist_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_two_factor_auth_settings_updated_at
  BEFORE UPDATE ON two_factor_auth_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined security questions
INSERT INTO predefined_security_questions (question_text) VALUES
  ('Qual era o nome do seu primeiro animal de estimação?'),
  ('Em que cidade nasceu?'),
  ('Qual é o nome de solteira da sua mãe?'),
  ('Qual foi o nome da sua primeira escola?'),
  ('Qual é o seu livro favorito?')
ON CONFLICT (question_text) DO NOTHING;

-- Insert sample services for therapist Luis Peres
DO $$
DECLARE
  therapist_id uuid;
BEGIN
  SELECT id INTO therapist_id FROM users WHERE username = 'luisperes';
  
  IF therapist_id IS NOT NULL THEN
    INSERT INTO services (name, description, duration, price, category, therapist_id) VALUES
      ('Sessão de Coaching Individual', 'Sessão personalizada de coaching para desenvolvimento pessoal', 60, 50.00, 'coaching', therapist_id),
      ('Consulta de Orientação Vocacional', 'Apoio na escolha de carreira e orientação profissional', 90, 75.00, 'vocacional', therapist_id),
      ('Terapia de Casal', 'Sessão de terapia para casais', 90, 80.00, 'terapia', therapist_id),
      ('Workshop de Gestão de Stress', 'Workshop prático sobre técnicas de gestão de stress', 120, 100.00, 'workshop', therapist_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
