-- Create a more comprehensive security events table with better indexing
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON public.security_events(ip_address);

-- Add a function to clean up old security events (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete security events older than 1 year, except critical ones
  DELETE FROM public.security_events 
  WHERE created_at < (now() - interval '1 year')
    AND event_type NOT IN ('admin_role_change_success', 'admin_config_change', 'potential_xss_attempt');
  
  -- Delete non-critical events older than 90 days
  DELETE FROM public.security_events 
  WHERE created_at < (now() - interval '90 days')
    AND event_type IN ('session_started', 'successful_login', 'page_view');
END;
$$;

-- Create a function to detect suspicious IP patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_ips()
RETURNS TABLE(ip_address inet, event_count bigint, unique_users bigint, event_types text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.ip_address,
    COUNT(*) as event_count,
    COUNT(DISTINCT se.user_id) as unique_users,
    array_agg(DISTINCT se.event_type) as event_types
  FROM public.security_events se
  WHERE se.created_at > (now() - interval '24 hours')
    AND se.ip_address IS NOT NULL
  GROUP BY se.ip_address
  HAVING COUNT(*) > 100 OR 
         (COUNT(DISTINCT se.user_id) > 10 AND COUNT(*) > 50)
  ORDER BY event_count DESC;
END;
$$;

-- Create enhanced audit trigger for user_roles table
CREATE OR REPLACE FUNCTION public.enhanced_role_change_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enhanced logging for all role changes
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'enhanced_role_change',
      'user_roles',
      NEW.id,
      jsonb_build_object(
        'role', OLD.role,
        'target_user', OLD.user_id,
        'timestamp', OLD.updated_at
      ),
      jsonb_build_object(
        'role', NEW.role,
        'target_user', NEW.user_id,
        'timestamp', NEW.updated_at
      )
    );
    
    -- Alert for privilege escalation
    IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
      INSERT INTO public.security_events (event_type, user_id, details)
      VALUES (
        'critical_privilege_escalation',
        auth.uid(),
        jsonb_build_object(
          'target_user_id', NEW.user_id,
          'old_role', OLD.role,
          'new_role', NEW.role,
          'timestamp', now()
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the enhanced audit trigger
DROP TRIGGER IF EXISTS enhanced_role_change_audit_trigger ON public.user_roles;
CREATE TRIGGER enhanced_role_change_audit_trigger
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_role_change_audit();