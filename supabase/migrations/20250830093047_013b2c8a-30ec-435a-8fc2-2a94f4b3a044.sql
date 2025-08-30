-- Fix security issue: Set search_path for the calculate_age function
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INTEGER 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$;