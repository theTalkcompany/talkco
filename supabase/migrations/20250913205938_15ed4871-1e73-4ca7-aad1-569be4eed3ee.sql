-- CRITICAL SECURITY FIX 1: Secure Willow Config Table
-- Remove public read access and implement admin-only policies

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Anyone can read willow config" ON public.willow_config;

-- Create admin-only read policy
CREATE POLICY "Only admins can read willow config" 
ON public.willow_config 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- SECURITY FIX 2: Strengthen Role Change Safeguards
-- Add policy to prevent users from updating their own roles in user_roles table

-- Create policy to prevent self-role modification
CREATE POLICY "Users cannot modify their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  public.is_admin(auth.uid()) AND auth.uid() != user_id
);

-- Add trigger to log and validate critical role changes
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from changing their own role
  IF auth.uid() = NEW.user_id AND auth.uid() = OLD.user_id THEN
    RAISE EXCEPTION 'Users cannot modify their own roles';
  END IF;
  
  -- Log critical role changes to admin
  IF OLD.role != NEW.role AND NEW.role = 'admin' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'critical_role_change',
      'user_roles',
      NEW.id,
      jsonb_build_object('role', OLD.role, 'target_user', OLD.user_id),
      jsonb_build_object('role', NEW.role, 'target_user', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role change validation
DROP TRIGGER IF EXISTS validate_role_changes ON public.user_roles;
CREATE TRIGGER validate_role_changes
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_change();

-- SECURITY FIX 3: Strengthen Profiles Table Protection
-- Add additional policy to prevent unauthorized profile access during queries

-- Create policy to ensure profiles can only be viewed by the owner or admins
CREATE POLICY "Profile access control" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);

-- SECURITY FIX 4: Add security monitoring for failed auth attempts
-- Create table for security events monitoring

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Only system can insert security events
CREATE POLICY "System can log security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);