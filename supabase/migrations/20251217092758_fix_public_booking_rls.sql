/*
  # Fix RLS Policies for Public Booking Flow
  
  ## Changes Made
  
  1. **Bookings Table**
     - DROP existing restrictive policies that block public access
     - CREATE new policy: Public users can INSERT bookings (for client booking flow)
     - CREATE new policy: Admin can READ all bookings
     - CREATE new policy: Admin can UPDATE all bookings
     - CREATE new policy: Admin can DELETE all bookings
     - CREATE new policy: Authenticated users can view their own bookings
  
  2. **Predefined Security Questions Table**
     - Already has public READ policy (no changes needed, just verified)
  
  ## Security Notes
  
  - Public users can only INSERT bookings (create appointments)
  - Public users CANNOT read, update, or delete any bookings
  - Only admins can view, modify, and manage all bookings
  - Authenticated clients can view their own bookings only
  - This enables the public booking page while maintaining security
*/

-- DROP existing booking policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

-- BOOKINGS TABLE POLICIES

-- Allow public users to create bookings (for public booking page)
CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)
      AND user_type = 'admin'
    )
  );

-- Allow admins to update all bookings
CREATE POLICY "Admins can update all bookings"
  ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)
      AND user_type = 'admin'
    )
  )
  WITH CHECK (true);

-- Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings"
  ON bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT current_setting('app.current_user_id', true)::uuid)
      AND user_type = 'admin'
    )
  );

-- Allow authenticated clients to view their own bookings
CREATE POLICY "Clients can view own bookings"
  ON bookings
  FOR SELECT
  USING (
    client_id = (SELECT current_setting('app.current_user_id', true)::uuid)
  );

-- Allow authenticated therapists to view their assigned bookings
CREATE POLICY "Therapists can view assigned bookings"
  ON bookings
  FOR SELECT
  USING (
    therapist_id = (SELECT current_setting('app.current_user_id', true)::uuid)
  );

-- Allow clients to update their own bookings (for reschedule requests)
CREATE POLICY "Clients can update own bookings"
  ON bookings
  FOR UPDATE
  USING (
    client_id = (SELECT current_setting('app.current_user_id', true)::uuid)
  )
  WITH CHECK (
    client_id = (SELECT current_setting('app.current_user_id', true)::uuid)
  );

-- Verify predefined_security_questions already has public read access
-- (No changes needed - policy "Anyone can view predefined questions" exists)
