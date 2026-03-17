/*
  # Add RPC functions for saving therapist availability and business settings

  ## Problem
  The app uses custom auth (not Supabase Auth), and set_current_user() is transaction-local.
  Since each Supabase JS client call is a separate HTTP request (separate transaction),
  the user_id set by set_current_user is lost before subsequent queries run.
  This means therapist availability changes and business settings changes were never
  being persisted to the database.

  ## Solution
  Create RPC functions that accept the user_id as a parameter and perform the update
  within a single transaction, validating permissions internally.

  ## New Functions
  1. `save_therapist_availability` - Saves therapist availability config to user_profiles
  2. `save_business_settings` - Saves business settings (upsert) to business_settings table
  3. `load_business_settings` - Loads all business settings as a JSON object

  ## Security
  - save_therapist_availability: validates that the caller is the therapist themselves or an admin
  - save_business_settings: validates that the caller is an admin
  - load_business_settings: readable by anyone (public data)
*/

CREATE OR REPLACE FUNCTION save_therapist_availability(
  p_user_id uuid,
  p_therapist_id uuid,
  p_availability_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type user_type;
  v_result jsonb;
BEGIN
  SELECT user_type INTO v_user_type
  FROM users
  WHERE id = p_user_id AND is_active = true;

  IF v_user_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found or inactive');
  END IF;

  IF p_user_id <> p_therapist_id AND v_user_type <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to modify this therapist availability');
  END IF;

  UPDATE user_profiles
  SET availability_config = p_availability_config,
      updated_at = now()
  WHERE user_id = p_therapist_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Therapist profile not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION save_business_settings(
  p_user_id uuid,
  p_settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type user_type;
  v_key text;
  v_value jsonb;
BEGIN
  SELECT user_type INTO v_user_type
  FROM users
  WHERE id = p_user_id AND is_active = true;

  IF v_user_type IS NULL OR v_user_type <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can modify business settings');
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_settings)
  LOOP
    INSERT INTO business_settings (key, value, updated_by, updated_at)
    VALUES (v_key, v_value, p_user_id, now())
    ON CONFLICT (key)
    DO UPDATE SET value = v_value, updated_by = p_user_id, updated_at = now();
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION load_business_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_row RECORD;
BEGIN
  FOR v_row IN SELECT key, value FROM business_settings
  LOOP
    v_result := v_result || jsonb_build_object(v_row.key, v_row.value);
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION save_therapist_availability(uuid, uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_business_settings(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION load_business_settings() TO anon, authenticated;
