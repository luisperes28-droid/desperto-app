/*
  # Complete User Authentication and Profile System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password_hash` (text)
      - `user_type` (enum: client, admin, therapist)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `full_name` (text)
      - `phone` (text)
      - `bio` (text)
      - `avatar_url` (text)
      - `specialties` (text array)
      - `availability_config` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for all CRUD operations
    - User type-based access control
    - Self-management policies
    - Admin override policies

  3. Functions
    - Custom user creation function
    - User authentication function
    - Password hashing utilities
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user type enum
CREATE TYPE user_type AS ENUM ('client', 'admin', 'therapist');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  user_type user_type NOT NULL DEFAULT 'client',
  is_active boolean DEFAULT true,
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
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Therapists can view client profiles" ON user_profiles;

-- USERS TABLE POLICIES

-- Allow users to view their own data
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (id = (current_setting('app.current_user_id', true))::uuid);

-- Allow users to update their own data (except user_type)
CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (
    id = (current_setting('app.current_user_id', true))::uuid AND
    user_type = (SELECT user_type FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid)
  );

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    )
  );

-- Allow admins to update all users
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    )
  );

-- Allow admins to delete users (except themselves)
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  USING (
    id != (current_setting('app.current_user_id', true))::uuid AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    )
  );

-- Allow user registration (insert)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- USER PROFILES TABLE POLICIES

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (user_id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles
  FOR DELETE
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    )
  );

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    )
  );

-- Allow therapists to view client profiles (for appointments)
CREATE POLICY "Therapists can view client profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.id = user_profiles.user_id
      WHERE u1.id = (current_setting('app.current_user_id', true))::uuid 
      AND u1.user_type = 'therapist'
      AND u2.user_type = 'client'
    )
  );

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

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(username_input text, password_input text)
RETURNS TABLE(
  user_id uuid,
  username text,
  email text,
  user_type user_type,
  full_name text,
  phone text,
  avatar_url text
) AS $$
DECLARE
  user_record users%ROWTYPE;
  profile_record user_profiles%ROWTYPE;
BEGIN
  -- Find user by username
  SELECT * INTO user_record
  FROM users u
  WHERE u.username = username_input AND u.is_active = true;

  -- Check if user exists and password is correct
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  IF NOT verify_password(password_input, user_record.password_hash) THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  -- Get user profile
  SELECT * INTO profile_record
  FROM user_profiles up
  WHERE up.user_id = user_record.id;

  -- Set current user context for RLS
  PERFORM set_config('app.current_user_id', user_record.id::text, true);

  -- Return user data
  RETURN QUERY SELECT 
    user_record.id,
    user_record.username,
    user_record.email,
    user_record.user_type,
    COALESCE(profile_record.full_name, ''),
    COALESCE(profile_record.phone, ''),
    COALESCE(profile_record.avatar_url, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create new user
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
  -- Validate input
  IF LENGTH(username_input) < 3 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters long';
  END IF;

  IF LENGTH(password_input) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long';
  END IF;

  IF email_input !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Insert user
  INSERT INTO users (username, email, password_hash, user_type)
  VALUES (
    username_input,
    email_input,
    hash_password(password_input),
    user_type_input
  )
  RETURNING id INTO new_user_id;

  -- Set current user context for RLS
  PERFORM set_config('app.current_user_id', new_user_id::text, true);

  -- Insert user profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (new_user_id, full_name_input);

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id_input uuid,
  full_name_input text DEFAULT NULL,
  phone_input text DEFAULT NULL,
  bio_input text DEFAULT NULL,
  avatar_url_input text DEFAULT NULL,
  specialties_input text[] DEFAULT NULL,
  availability_config_input jsonb DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  -- Set current user context for RLS
  PERFORM set_config('app.current_user_id', user_id_input::text, true);

  UPDATE user_profiles SET
    full_name = COALESCE(full_name_input, full_name),
    phone = COALESCE(phone_input, phone),
    bio = COALESCE(bio_input, bio),
    avatar_url = COALESCE(avatar_url_input, avatar_url),
    specialties = COALESCE(specialties_input, specialties),
    availability_config = COALESCE(availability_config_input, availability_config),
    updated_at = now()
  WHERE user_id = user_id_input;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to change password
CREATE OR REPLACE FUNCTION change_password(
  user_id_input uuid,
  old_password text,
  new_password text
)
RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  -- Get current user
  SELECT * INTO user_record
  FROM users
  WHERE id = user_id_input AND is_active = true;

  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify old password
  IF NOT verify_password(old_password, user_record.password_hash) THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  -- Validate new password
  IF LENGTH(new_password) < 6 THEN
    RAISE EXCEPTION 'New password must be at least 6 characters long';
  END IF;

  -- Set current user context for RLS
  PERFORM set_config('app.current_user_id', user_id_input::text, true);

  -- Update password
  UPDATE users SET
    password_hash = hash_password(new_password),
    updated_at = now()
  WHERE id = user_id_input;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to deactivate user (soft delete)
CREATE OR REPLACE FUNCTION deactivate_user(user_id_input uuid)
RETURNS boolean AS $$
BEGIN
  -- Only admins can deactivate users, or users can deactivate themselves
  IF NOT (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (current_setting('app.current_user_id', true))::uuid 
      AND user_type = 'admin'
    ) OR
    user_id_input = (current_setting('app.current_user_id', true))::uuid
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE users SET
    is_active = false,
    updated_at = now()
  WHERE id = user_id_input;

  RETURN FOUND;
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

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, user_type)
VALUES (
  'admin',
  'luis@desperto.com',
  hash_password('admin123'),
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert admin profile
INSERT INTO user_profiles (user_id, full_name, bio)
SELECT 
  u.id,
  'Luis Peres',
  'Administrador do sistema Desperto - Despertar ao Minuto'
FROM users u
WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;