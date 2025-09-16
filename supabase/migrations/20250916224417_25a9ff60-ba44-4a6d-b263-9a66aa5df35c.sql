-- Create user moderation table for tracking bans and warnings
CREATE TABLE public.user_moderation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('ban', 'warning', 'unban')),
  reason text,
  duration_hours integer, -- NULL for permanent ban
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text
);

-- Enable RLS
ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage user moderation" 
ON public.user_moderation 
FOR ALL 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_user_moderation_user_id ON public.user_moderation(user_id);
CREATE INDEX idx_user_moderation_active ON public.user_moderation(is_active);
CREATE INDEX idx_user_moderation_expires_at ON public.user_moderation(expires_at);

-- Function to check if user is currently banned
CREATE OR REPLACE FUNCTION public.is_user_banned(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_moderation
    WHERE user_moderation.user_id = is_user_banned.user_id
      AND action_type = 'ban'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Function to get active warnings count for user
CREATE OR REPLACE FUNCTION public.get_user_warnings_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.user_moderation
  WHERE user_moderation.user_id = get_user_warnings_count.user_id
    AND action_type = 'warning'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
$$;