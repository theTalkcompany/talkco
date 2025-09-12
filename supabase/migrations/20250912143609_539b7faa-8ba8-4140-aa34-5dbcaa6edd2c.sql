-- Check if there's a trigger on privacy_policy table that's causing the issue
-- and fix the trigger to use the correct field name or remove it if not needed

-- First, let's see what triggers exist on privacy_policy
-- We'll drop any existing update trigger and create a proper one for last_updated field

-- Drop existing trigger if it exists (this might be causing the updated_at error)
DROP TRIGGER IF EXISTS update_privacy_policy_updated_at ON public.privacy_policy;

-- Create a new trigger function specifically for last_updated field
CREATE OR REPLACE FUNCTION public.update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for privacy_policy table using the correct field name
CREATE TRIGGER update_privacy_policy_last_updated
  BEFORE UPDATE ON public.privacy_policy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_updated_column();

-- Also fix the same issue for terms_of_service table
DROP TRIGGER IF EXISTS update_terms_of_service_updated_at ON public.terms_of_service;

-- Create trigger for terms_of_service table using the correct field name
CREATE TRIGGER update_terms_of_service_last_updated
  BEFORE UPDATE ON public.terms_of_service
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_updated_column();