-- CRITICAL SECURITY FIXES FOR TALK APPLICATION
-- Phase 1: Fix Access Control Issues

-- 1. RESTRICT USER ROLES VISIBILITY
-- Currently anyone can see all user roles - this is a major security issue
-- Users should only see their own role, admins can see all roles

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create restrictive policies for user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Keep existing admin management policy (already secure)

-- 2. SECURE AI CONFIGURATION ACCESS
-- Currently all authenticated users can modify Willow AI config - critical security issue
-- Only admins should be able to modify AI configuration

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage willow config" ON public.willow_config;

-- Create secure policies for willow_config
CREATE POLICY "Anyone can read willow config" 
ON public.willow_config 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert willow config" 
ON public.willow_config 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update willow config" 
ON public.willow_config 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete willow config" 
ON public.willow_config 
FOR DELETE 
USING (is_admin(auth.uid()));

-- 3. REMOVE HARDCODED EMAIL CHECKS FROM POLICIES
-- Replace hardcoded email checks with proper role-based functions

-- Fix quotes table policies
DROP POLICY IF EXISTS "Admin can manage quotes" ON public.quotes;

-- Fix reports table policies  
DROP POLICY IF EXISTS "Users can view their post/comment reports" ON public.reports;

CREATE POLICY "Users can view their own reports or admins can view all" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reported_by_user_id OR is_admin(auth.uid()));

-- 4. ADD AUDIT LOGGING TABLE FOR SECURITY MONITORING
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger AS $$
BEGIN
  -- Log role changes for security monitoring
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'role_change',
      'user_roles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change auditing
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();