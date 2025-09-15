-- Add column to track if user has seen the welcome message
ALTER TABLE public.profiles 
ADD COLUMN first_login_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have seen the message (so they don't get it retroactively)
UPDATE public.profiles 
SET first_login_completed = TRUE;