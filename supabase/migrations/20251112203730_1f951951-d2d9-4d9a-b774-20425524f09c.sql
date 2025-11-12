-- Remove shift column from refrigeration_logs table
ALTER TABLE public.refrigeration_logs DROP COLUMN IF EXISTS shift;