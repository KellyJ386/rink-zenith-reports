-- Add fuel_type column to resurfacing_machines table
ALTER TABLE public.resurfacing_machines 
ADD COLUMN fuel_type TEXT DEFAULT 'electric' CHECK (fuel_type IN ('gas', 'electric'));