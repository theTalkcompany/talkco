-- Fix critical security vulnerability in profiles table RLS policies
-- Remove the conflicting admin access policy that exposes raw sensitive data
DROP POLICY IF EXISTS "Profile access control" ON public.profiles;

-- Keep the secure user-only access policy
-- Users can still view their own profiles normally
-- "Users can view their own profile" policy remains: (auth.uid() = user_id)

-- Create a secure admin view policy that uses our masking function
-- This ensures admins cannot directly access raw sensitive data
CREATE POLICY "Secure admin profile access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profiles with full data
  (auth.uid() = user_id) 
  -- Admins cannot directly access other users' profiles
  -- They must use the get_masked_profile() function instead
);

-- Add a comment explaining the security design
COMMENT ON POLICY "Secure admin profile access" ON public.profiles IS 
'Security policy: Users see their own data. Admins must use get_masked_profile() function for privacy protection.';

-- Ensure the existing data masking function is properly secured
-- This function was created earlier and provides masked data for admins
COMMENT ON FUNCTION public.get_masked_profile(uuid) IS 
'Admin function: Returns masked profile data to protect user privacy. Logs all access attempts.';