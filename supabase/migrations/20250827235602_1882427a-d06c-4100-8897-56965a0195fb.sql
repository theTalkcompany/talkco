-- Create quotes table for inspirational quotes
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read quotes (public content)
CREATE POLICY "Anyone can view quotes" 
ON public.quotes 
FOR SELECT 
USING (true);

-- Only allow authenticated users to insert quotes (admin only in practice)
CREATE POLICY "Authenticated users can create quotes" 
ON public.quotes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Only allow authenticated users to update quotes (admin only in practice)
CREATE POLICY "Authenticated users can update quotes" 
ON public.quotes 
FOR UPDATE 
TO authenticated
USING (true);

-- Only allow authenticated users to delete quotes (admin only in practice)
CREATE POLICY "Authenticated users can delete quotes" 
ON public.quotes 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing quotes from the hardcoded array
INSERT INTO public.quotes (text, author) VALUES
  ('You are stronger than you think, braver than you feel.', 'Unknown'),
  ('This too shall pass.', 'Persian Proverb'),
  ('No storm, not even the one in your life, can last forever.', 'Iyanla Vanzant'),
  ('Be gentle with yourself—you''re doing the best you can.', 'Unknown'),
  ('One day at a time.', 'Al-Anon'),
  ('You matter more than you know.', 'Unknown'),
  ('Small steps still move you forward.', 'Unknown'),
  ('Your feelings are valid. Your voice matters.', 'Unknown'),
  ('Healing is not linear.', 'Unknown'),
  ('You''ve survived 100% of your bad days so far.', 'Unknown');