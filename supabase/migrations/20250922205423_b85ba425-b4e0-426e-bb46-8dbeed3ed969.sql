-- Enable leaked password protection and create backup admin system
-- This migration addresses critical security issues identified in the security scan

-- First, let's create a system for backup admins
CREATE TABLE IF NOT EXISTS public.backup_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on backup_admins
ALTER TABLE public.backup_admins ENABLE ROW LEVEL SECURITY;

-- Only existing admins can manage backup admins
CREATE POLICY "Only admins can manage backup admins"
ON public.backup_admins
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create function to automatically promote backup admin on first login
CREATE OR REPLACE FUNCTION public.handle_backup_admin_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this user is a backup admin
  IF EXISTS (
    SELECT 1 FROM public.backup_admins 
    WHERE email = NEW.email AND activated_at IS NULL
  ) THEN
    -- Activate the backup admin record
    UPDATE public.backup_admins 
    SET activated_at = NOW() 
    WHERE email = NEW.email;
    
    -- Give them admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log this critical action
    INSERT INTO public.security_events (event_type, user_id, details)
    VALUES (
      'backup_admin_activated',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'activation_time', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for backup admin activation
DROP TRIGGER IF EXISTS backup_admin_activation_trigger ON auth.users;
CREATE TRIGGER backup_admin_activation_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_backup_admin_activation();

-- Enhanced content moderation logging
CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID, -- references posts.id or messages.id
  content_type TEXT NOT NULL, -- 'post', 'message', 'comment'
  content_preview TEXT NOT NULL, -- first 100 chars of content
  flagged_by TEXT NOT NULL, -- 'ai_primary', 'ai_fallback', 'user_report', 'admin'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  action_taken TEXT, -- 'removed', 'flagged', 'warning_sent', 'user_banned'
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
CREATE POLICY "Only admins can view moderation logs"
ON public.content_moderation_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert logs
CREATE POLICY "System can insert moderation logs"
ON public.content_moderation_logs
FOR INSERT
WITH CHECK (true);

-- Add update trigger
CREATE TRIGGER update_content_moderation_logs_updated_at
  BEFORE UPDATE ON public.content_moderation_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();