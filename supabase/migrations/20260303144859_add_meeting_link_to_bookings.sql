/*
  # Add meeting_link column to bookings

  1. Modified Tables
    - `bookings`
      - Added `meeting_link` (text, nullable) - Google Meet link for online sessions

  2. Notes
    - All sessions are now 100% online via Google Meet
    - The meeting link is optional so existing bookings are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'meeting_link'
  ) THEN
    ALTER TABLE bookings ADD COLUMN meeting_link text;
  END IF;
END $$;
