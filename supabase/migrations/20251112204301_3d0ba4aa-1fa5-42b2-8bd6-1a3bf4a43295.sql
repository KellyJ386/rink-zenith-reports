-- Add timezone column to facilities table
ALTER TABLE public.facilities 
ADD COLUMN timezone TEXT DEFAULT 'America/New_York';