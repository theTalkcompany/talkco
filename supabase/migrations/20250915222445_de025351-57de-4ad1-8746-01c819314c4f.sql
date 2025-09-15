-- Enable real-time for room_messages table
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- Enable real-time for room_participants table  
ALTER TABLE public.room_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;