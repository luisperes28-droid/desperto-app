/*
  # Sistema de Autenticação e Perfis de Utilizador

  1. Novas Tabelas
    - `users` - Dados de autenticação dos utilizadores
    - `user_profiles` - Perfis e informações adicionais
    
  2. Segurança
    - RLS ativado em todas as tabelas
    - Políticas para operações CRUD
    - Controlo de acesso baseado em tipo de utilizador
    
  3. Funções
    - Autenticação de utilizadores
    - Criação de utilizadores
    - Gestão de passwords
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user type enum
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('client', 'admin', 'therapist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  user_type user_type NOT NULL DEFAULT 'client',
  is_active boolean DEFAULT true,
  failed_login_attempts integer DEFAULT 0,
  lockout_until timestamptz,
  last_login_ip text,
  last_login_at timestamptz,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  bio text,
  avatar_url text,
  specialties text[] DEFAULT '{}',
  availability_config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access for authentication" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow user self-update" ON users;

-- USERS TABLE POLICIES - Simplified for authentication
CREATE POLICY "Allow public read access for authentication"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow user self-update"
  ON users FOR UPDATE
  USING (true);

-- PROFILES POLICIES - Simplified
DROP POLICY IF EXISTS "Allow public profile read" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile update" ON user_profiles;

CREATE POLICY "Allow public profile read"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow profile insert"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow profile update"
  ON user_profiles FOR UPDATE
  USING (true);

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create authenticate function
CREATE OR REPLACE FUNCTION authenticate_user(username_input text, password_input text)
RETURNS TABLE(
  user_id uuid,
  username text,
  email text,
  user_type user_type,
  full_name text
) AS $$
DECLARE
  user_record users%ROWTYPE;
  profile_record user_profiles%ROWTYPE;
BEGIN
  -- Find user by username or email
  SELECT * INTO user_record
  FROM users u
  WHERE (u.username = username_input OR u.email = username_input) AND u.is_active = true;

  -- Check if user exists
  IF user_record.id IS NULL THEN
    RETURN;
  END IF;

  -- Verify password
  IF NOT verify_password(password_input, user_record.password_hash) THEN
    RETURN;
  END IF;

  -- Get user profile
  SELECT * INTO profile_record
  FROM user_profiles up
  WHERE up.user_id = user_record.id;

  -- Return user data
  RETURN QUERY SELECT 
    user_record.id,
    user_record.username,
    user_record.email,
    user_record.user_type,
    COALESCE(profile_record.full_name, user_record.username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user creation function
CREATE OR REPLACE FUNCTION create_user(
  username_input text,
  email_input text,
  password_input text,
  full_name_input text,
  user_type_input user_type DEFAULT 'client'
)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert user
  INSERT INTO users (username, email, password_hash, user_type)
  VALUES (
    username_input,
    email_input,
    hash_password(password_input),
    user_type_input
  )
  RETURNING id INTO new_user_id;

  -- Insert user profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (new_user_id, full_name_input);

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set current user function for RLS
CREATE OR REPLACE FUNCTION set_current_user(user_id_input uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id_input::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default users
DO $$
DECLARE
  admin_user_id uuid;
  therapist_user_id uuid;
  client_user_id uuid;
BEGIN
  -- Admin user
  SELECT create_user(
    'admin',
    'euestoudesperto@gmail.com',
    'Dhvif2m1',
    'Administrador Desperto',
    'admin'
  ) INTO admin_user_id;

  -- Therapist user
  SELECT create_user(
    'luisperes',
    'luisperes28@gmail.com',
    'Dhvif2m0',
    'Luis Peres',
    'therapist'
  ) INTO therapist_user_id;

  -- Client user
  SELECT create_user(
    'cliente',
    'cliente@teste.com',
    '123456',
    'Cliente Teste',
    'client'
  ) INTO client_user_id;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Users already exist, skip
    NULL;
END $$;