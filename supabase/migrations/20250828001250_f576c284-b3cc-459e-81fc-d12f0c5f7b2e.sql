-- Update the admin policy to use a specific email
-- Replace 'admin@example.com' with your actual email address
DROP POLICY IF EXISTS "Admin can manage quotes" ON public.quotes;

CREATE POLICY "Admin can manage quotes" 
ON public.quotes 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@example.com'  -- Replace with your email
  )
);