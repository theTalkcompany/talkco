-- Add created_by field to rooms table to track room admin
ALTER TABLE public.rooms 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create reports table for user reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_user_id UUID NOT NULL,
  reported_by_user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  message_id UUID REFERENCES public.room_messages(id),
  message_content TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports table
-- Only the app admin can view all reports
CREATE POLICY "Admin can manage all reports" 
ON public.reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'talkco@outlook.com'
  )
);

-- Users can create reports
CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = reported_by_user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reported_by_user_id);

-- Update rooms table policies to allow authenticated users to create rooms
CREATE POLICY "Authenticated users can create rooms" 
ON public.rooms 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Room creators can update their own rooms
CREATE POLICY "Room creators can update their rooms" 
ON public.rooms 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Room creators can delete their own rooms
CREATE POLICY "Room creators can delete their rooms" 
ON public.rooms 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update room_participants policies to allow room admins to remove users
CREATE POLICY "Room admins can remove participants" 
ON public.room_participants 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE rooms.id = room_id 
    AND rooms.created_by = auth.uid()
  )
);