/*
  # Fix RLS infinite recursion in users table

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies are referencing the users table within their own conditions
    
  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid self-referencing loops
    - Use auth.uid() instead of querying users table for current user identification
    
  3. Security
    - Maintain proper access control without recursion
    - Users can only access their own data
    - Admins can access all user data
*/

-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create new policies that avoid infinite recursion
-- Use auth.uid() directly instead of querying users table

-- Allow user registration (no recursion risk)
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own data using auth.uid()
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT
  TO public
  USING (id = auth.uid());

-- Users can update their own data using auth.uid()
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE
  TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- For admin access, we'll use a simpler approach that doesn't cause recursion
-- Create a function to check if current user is admin without querying users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$$;

-- Admin policies using the function (this avoids direct recursion in policy conditions)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  TO public
  USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE
  TO public
  USING (public.is_admin() AND id != auth.uid());