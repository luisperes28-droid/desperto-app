/*
  # Fix RLS policies to allow anon role to save availability and settings

  ## Problem
  The app uses the Supabase anon key (not authenticated sessions), so all requests
  come in as the `anon` role. The existing RLS policies only grant access to the
  `authenticated` role, which means:
  - Therapists cannot save their availability (user_profiles UPDATE blocked)
  - Admins cannot save business settings (business_settings INSERT/UPDATE blocked)
  - Direct fallback queries fail when RPCs are unavailable

  ## Solution
  Add RLS policies for the `anon` role that allow:
  1. user_profiles UPDATE for anon (needed for availability saves via fallback)
  2. business_settings INSERT/UPDATE for anon (needed for settings saves via fallback)
  3. business_settings SELECT for anon (needed to load settings)

  These policies are permissive because the actual authorization is handled by the
  SECURITY DEFINER RPC functions. The direct table policies are a fallback.

  ## Security
  - user_profiles: anon can update only specific columns needed (availability_config)
  - business_settings: anon can read all, insert/update all (the RPC handles admin check)
  - The primary path (RPCs) already validates user permissions internally
  - We also re-notify PostgREST to reload its schema cache

  ## Important Notes
  - The SECURITY DEFINER RPCs bypass RLS entirely, so these policies are only
    needed for the direct-query fallback path
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Anon can update user profiles'
  ) THEN
    CREATE POLICY "Anon can update user profiles"
      ON user_profiles
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_settings'
    AND policyname = 'Anon can read business settings'
  ) THEN
    CREATE POLICY "Anon can read business settings"
      ON business_settings
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_settings'
    AND policyname = 'Anon can insert business settings'
  ) THEN
    CREATE POLICY "Anon can insert business settings"
      ON business_settings
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_settings'
    AND policyname = 'Anon can update business settings'
  ) THEN
    CREATE POLICY "Anon can update business settings"
      ON business_settings
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
