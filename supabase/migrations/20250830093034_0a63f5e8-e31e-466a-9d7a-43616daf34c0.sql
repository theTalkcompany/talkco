-- Add date of birth to profiles table
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth DATE;

-- Make date_of_birth required for new users (existing users will need to update)
-- We don't set NOT NULL yet to avoid breaking existing users

-- Add age range columns to rooms table  
ALTER TABLE public.rooms 
ADD COLUMN age_min INTEGER NOT NULL DEFAULT 13,
ADD COLUMN age_max INTEGER NOT NULL DEFAULT 99;

-- Add check constraints to ensure valid age ranges
ALTER TABLE public.rooms 
ADD CONSTRAINT age_range_valid 
CHECK (age_min >= 13 AND age_max <= 99 AND age_min <= age_max);

-- Create index for efficient age range queries
CREATE INDEX idx_rooms_age_range ON public.rooms (age_min, age_max);

-- Create function to calculate age from date of birth
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;