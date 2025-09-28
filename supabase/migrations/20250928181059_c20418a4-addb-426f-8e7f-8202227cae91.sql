-- Clear all reports and messages from the Anxiety room (test messages cleanup)

-- First, delete any reports for messages in the Anxiety room
DELETE FROM public.reports 
WHERE message_id IN (
  SELECT id FROM public.room_messages 
  WHERE room_id = 'ed304396-bc0e-433f-aed9-4efa522631df'
);

-- Then delete the messages from the Anxiety room
DELETE FROM public.room_messages 
WHERE room_id = 'ed304396-bc0e-433f-aed9-4efa522631df';