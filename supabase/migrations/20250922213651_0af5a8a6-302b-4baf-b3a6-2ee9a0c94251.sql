-- Enhanced privacy: Add data masking function for admin profile access
CREATE OR REPLACE FUNCTION public.mask_sensitive_profile_data(profile_data jsonb, requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only mask data for admin access to other users' profiles
  IF requesting_user_id != (profile_data->>'user_id')::uuid AND public.is_admin(requesting_user_id) THEN
    RETURN jsonb_build_object(
      'user_id', profile_data->>'user_id',
      'full_name', LEFT(profile_data->>'full_name', 1) || '***',
      'email', LEFT(profile_data->>'email', 3) || '***@***',
      'phone', '***-***-' || RIGHT(profile_data->>'phone', 4),
      'address', 'MASKED',
      'date_of_birth', '****-**-**',
      'created_at', profile_data->>'created_at',
      'updated_at', profile_data->>'updated_at'
    );
  END IF;
  
  -- Return full data for own profile or non-admin access
  RETURN profile_data;
END;
$function$;

-- Add audit logging for sensitive profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log when admins access other users' profiles
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    IF public.is_admin(auth.uid()) THEN
      INSERT INTO public.security_events (event_type, user_id, details)
      VALUES (
        'admin_profile_access',
        auth.uid(),
        jsonb_build_object(
          'accessed_profile_user_id', NEW.user_id,
          'timestamp', now(),
          'access_type', 'admin_view'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for profile access logging
CREATE TRIGGER log_profile_access_trigger
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_access();