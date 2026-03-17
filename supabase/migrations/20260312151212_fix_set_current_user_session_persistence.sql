/*
  # Fix set_current_user session persistence

  1. Problem
    - The `set_current_user` function was using `set_config('app.current_user_id', ..., true)`
    - The third parameter `true` means "local to current transaction"
    - This caused the user ID to disappear after the RPC call ended
    - Subsequent queries (INSERT/SELECT on therapist_notes, etc.) had no user context
    - RLS policies using `get_current_user_id()` returned NULL, blocking all access

  2. Fix
    - Change `set_config(..., true)` to `set_config(..., false)` so the setting persists
      for the entire database session/connection, not just the RPC transaction

  3. Security
    - No changes to RLS policies
    - The user ID is still validated by the authenticate function before being set
*/

CREATE OR REPLACE FUNCTION public.set_current_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$;
