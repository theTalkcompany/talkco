-- Extend reports table to handle posts and comments
ALTER TABLE public.reports 
ADD COLUMN post_id uuid,
ADD COLUMN comment_id uuid;

-- Make room_id nullable since posts/comments aren't in rooms
ALTER TABLE public.reports 
ALTER COLUMN room_id DROP NOT NULL;

-- Update RLS policies to handle post/comment reports
CREATE POLICY "Users can create post/comment reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (
  auth.uid() = reported_by_user_id AND 
  (room_id IS NOT NULL OR post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE POLICY "Users can view their post/comment reports" 
ON public.reports 
FOR SELECT 
USING (
  auth.uid() = reported_by_user_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() AND users.email = 'talkco@outlook.com'
  )
);