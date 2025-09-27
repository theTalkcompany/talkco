-- Enhanced privacy: Add data masking function for admin profile access
CREATE OR REPLACE FUNCTION public.get_masked_profile(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  profile_record profiles%ROWTYPE;
  result jsonb;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get the profile data
  SELECT * INTO profile_record FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Log admin access to user profile
  INSERT INTO public.security_events (event_type, user_id, details)
  VALUES (
    'admin_profile_access',
    auth.uid(),
    jsonb_build_object(
      'accessed_profile_user_id', target_user_id,
      'timestamp', now(),
      'access_type', 'admin_masked_view'
    )
  );

  -- Return masked data for privacy protection
  result := jsonb_build_object(
    'user_id', profile_record.user_id,
    'full_name', CASE 
      WHEN profile_record.full_name IS NOT NULL 
      THEN LEFT(profile_record.full_name, 1) || '***'
      ELSE NULL 
    END,
    'email', CASE 
      WHEN profile_record.email IS NOT NULL 
      THEN LEFT(profile_record.email, 3) || '***@***'
      ELSE NULL 
    END,
    'phone', CASE 
      WHEN profile_record.phone IS NOT NULL 
      THEN '***-***-' || RIGHT(profile_record.phone, 4)
      ELSE NULL 
    END,
    'address', CASE 
      WHEN profile_record.address IS NOT NULL 
      THEN 'MASKED'
      ELSE NULL 
    END,
    'date_of_birth', CASE 
      WHEN profile_record.date_of_birth IS NOT NULL 
      THEN '****-**-**'
      ELSE NULL 
    END,
    'created_at', profile_record.created_at,
    'updated_at', profile_record.updated_at
  );

  RETURN result;
END;
$function$;