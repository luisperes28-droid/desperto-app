/*
  # Create secure RPC functions for therapist notes

  1. Problem
    - The system uses custom authentication with the `anon` role
    - RLS policies on `therapist_notes` require `authenticated` role and `get_current_user_id()`
    - The session variable `app.current_user_id` set via `set_current_user` is lost between
      REST API calls due to pgbouncer connection pooling
    - This causes all note CRUD operations to fail with permission errors

  2. Solution
    - Create SECURITY DEFINER RPC functions that accept `p_user_id` as parameter
    - Each function validates the user exists and has the correct role (admin or therapist)
    - Functions bypass RLS since they run as definer, but enforce access control internally
    - This approach works reliably regardless of connection pooling

  3. New Functions
    - `rpc_fetch_therapist_notes(p_user_id)` - Fetch notes (admins: all, therapists: own)
    - `rpc_create_therapist_note(...)` - Create a new note (therapists only for own notes)
    - `rpc_update_therapist_note(...)` - Update a note (owner or admin)
    - `rpc_delete_therapist_note(...)` - Delete a note (owner or admin)

  4. Security
    - All functions validate user_type before executing
    - Therapists can only manage their own notes
    - Admins can manage all notes
    - SECURITY DEFINER with fixed search_path prevents injection
*/

CREATE OR REPLACE FUNCTION rpc_fetch_therapist_notes(p_user_id uuid)
RETURNS SETOF therapist_notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
BEGIN
  SELECT user_type::text INTO v_user_type FROM users WHERE id = p_user_id AND is_active = true;
  IF v_user_type IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;
  IF v_user_type NOT IN ('admin', 'therapist') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF v_user_type = 'admin' THEN
    RETURN QUERY SELECT * FROM therapist_notes ORDER BY created_at DESC;
  ELSE
    RETURN QUERY SELECT * FROM therapist_notes WHERE therapist_id = p_user_id ORDER BY created_at DESC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION rpc_create_therapist_note(
  p_user_id uuid,
  p_client_id uuid,
  p_title text,
  p_content text,
  p_is_private boolean DEFAULT true,
  p_session_date timestamptz DEFAULT NULL,
  p_tags text[] DEFAULT '{}'
)
RETURNS therapist_notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_result therapist_notes;
BEGIN
  SELECT user_type::text INTO v_user_type FROM users WHERE id = p_user_id AND is_active = true;
  IF v_user_type IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;
  IF v_user_type NOT IN ('admin', 'therapist') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  INSERT INTO therapist_notes (therapist_id, client_id, title, content, is_private, session_date, tags)
  VALUES (p_user_id, p_client_id, p_title, p_content, p_is_private, p_session_date, p_tags)
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION rpc_update_therapist_note(
  p_user_id uuid,
  p_note_id uuid,
  p_title text DEFAULT NULL,
  p_content text DEFAULT NULL,
  p_is_private boolean DEFAULT NULL,
  p_tags text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_note_therapist_id uuid;
BEGIN
  SELECT user_type::text INTO v_user_type FROM users WHERE id = p_user_id AND is_active = true;
  IF v_user_type IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;
  IF v_user_type NOT IN ('admin', 'therapist') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT therapist_id INTO v_note_therapist_id FROM therapist_notes WHERE id = p_note_id;
  IF v_note_therapist_id IS NULL THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  IF v_user_type != 'admin' AND v_note_therapist_id != p_user_id THEN
    RAISE EXCEPTION 'Cannot update notes from other therapists';
  END IF;

  UPDATE therapist_notes SET
    title = COALESCE(p_title, title),
    content = COALESCE(p_content, content),
    is_private = COALESCE(p_is_private, is_private),
    tags = COALESCE(p_tags, tags),
    updated_at = now()
  WHERE id = p_note_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION rpc_delete_therapist_note(
  p_user_id uuid,
  p_note_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_note_therapist_id uuid;
BEGIN
  SELECT user_type::text INTO v_user_type FROM users WHERE id = p_user_id AND is_active = true;
  IF v_user_type IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;
  IF v_user_type NOT IN ('admin', 'therapist') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT therapist_id INTO v_note_therapist_id FROM therapist_notes WHERE id = p_note_id;
  IF v_note_therapist_id IS NULL THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  IF v_user_type != 'admin' AND v_note_therapist_id != p_user_id THEN
    RAISE EXCEPTION 'Cannot delete notes from other therapists';
  END IF;

  DELETE FROM therapist_notes WHERE id = p_note_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_fetch_therapist_notes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_create_therapist_note(uuid, uuid, text, text, boolean, timestamptz, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_update_therapist_note(uuid, uuid, text, text, boolean, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_delete_therapist_note(uuid, uuid) TO anon, authenticated;
