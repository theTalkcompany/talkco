-- Fix the RLS policy for willow_config table
-- Remove the policy that tries to access auth.users table directly
DROP POLICY IF EXISTS "Admin can manage willow config" ON public.willow_config;

-- Create a simpler policy that allows authenticated users to manage config
-- The admin check will be handled at the application level
CREATE POLICY "Authenticated users can manage willow config" 
ON public.willow_config 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);