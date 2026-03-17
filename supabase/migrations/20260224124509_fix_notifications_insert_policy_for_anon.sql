/*
  # Fix notifications insert policy to allow anonymous booking flow

  1. Security Changes
    - Drop existing INSERT policy that only allows authenticated role
    - Create new INSERT policy that allows both anon and authenticated roles
    - Policy still requires a valid booking_id that exists in bookings table

  2. Notes
    - The client booking flow uses the anon key
    - Notifications must be insertable when a client creates a booking
    - The booking_id foreign key check ensures only valid bookings can trigger notifications
*/

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = notifications.booking_id
    )
  );
