-- Drop the duplicate functions if they exist
DROP FUNCTION IF EXISTS public.get_user_email;
DROP FUNCTION IF EXISTS public.query_user_email;

-- Create a single, clear function
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Grant explicit permissions
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id TO service_role;